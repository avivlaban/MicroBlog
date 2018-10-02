const mongoose = require('mongoose');
const {Post, getNewPostObject, savePostToDB} = require('../models/post');
const {User} = require('../models/user');
const {Event} = require('./event');
const winston = require('winston');
const {calculateRank} = require('./rank');
const {getRedisClient} = require('../startup/cache');
const {calculateVotes, eventAction} = require('./eventsUtils');
const consts = require('../consts/consts');

// Set the timeOut of the event processing to run in seconds
const TIMEOUT_FOR_PROCCESSING_EVENTS_IN_SECONDS = 5;
// Set the timeOut of the 'get top posts' process to run in seconds
const TIMEOUT_FOR_GETTING_TOP_POSTS_IN_SECONDS = 60;
// Max events allowed to be processed each session
const MAX_EVENTS_TO_PROCESS = 10;
// Max Posts allowed in cache
const MAX_POSTS_TO_STORE_IN_CHACE = 1000;

const client = getRedisClient();

// Main function - runs in loop while processing events and getting top results to store in cache
module.exports.startListening = async function () {
    winston.info('Started event\'s handler process');
    if (process.env.NODE_ENV != consts.APP_TEST_ENV) {
        setInterval(async function () {
            // Update Top events in cache
            updateTopResultsInCache(MAX_POSTS_TO_STORE_IN_CHACE);
        }, TIMEOUT_FOR_GETTING_TOP_POSTS_IN_SECONDS * 1000);
    }
    ;

    // Executes every ${timeOutForProccessingEventsInSeconds} seconds
    setInterval(async function () {

        // Populate Events from DB
        events = await populateEvents();

        //If there are events to process
        if (events) {
            await triggerEvents(events);
        };
    }, TIMEOUT_FOR_PROCCESSING_EVENTS_IN_SECONDS * 1000);
};

async function populateEvents(eventsArray){
    let singleEvent;
    let counter = 0;
    if(!eventsArray){
        eventsArray = [];
    }

    // Get events to Process from DB
    try {
        do {
            singleEvent = await Event.findOneAndUpdate({isActive: true}, {isActive: false});
            if (singleEvent) {
                eventsArray.push(singleEvent);
                counter++;
            }
        } while (singleEvent && (counter < MAX_EVENTS_TO_PROCESS));
        if (eventsArray.length > 0) {
            winston.info('Successfully got events from DB');
        } else {
            winston.info('No events to update');
        }
    } catch (error) {
        winston.error("Failed getting events from DB: " + error);
        return null;
    }
    return eventsArray;
}

async function triggerEvents(eventsArray){
    try {
        eventsArray.forEach(function (event) {
            switch (event.action) {
                case (eventAction.CREATE):
                    createPostAction(event);
                    break;
                case (eventAction.UPDATE):
                    updatePostAction(event);
                    break;
                case (eventAction.UPVOTE):
                    votePostAction(eventAction.UPVOTE, event);
                    break;
                case (eventAction.DOWNVOTE):
                    votePostAction(eventAction.DOWNVOTE, event);
                    break;
                default:
                    winston.error('Unknown action. Event can not be updated: ' + event);
            }
        });
        return eventsArray;
    } catch (error) {
        winston.error("Error while triggering events was found: " + error);
        return null;
    }
}
// Create a post logic - Getting an event and saving a new post to DB with the event's data provided
async function createPostAction(event) {
    let post;
    let user;
    // Make sure user exists
    try {
        user = await User.findById(event.eventBody[0].userId);
        if (!user) {
            winston.error(`Error with User. He does not exist and therefore can not post. ${event}`);
            return;
        }
    } catch (error) {
        winston.error('Failed processing event: ' + event);
        return;
    }
    // Creating a new Post
    try {
        post = getNewPostObject(user, event.eventBody[0].title, event.eventBody[0].content);

        // Save event to DB
        post = await savePostToDB(post);
        winston.info(`A new Post was successfully created: ${post._id}`);
        try {
            //Remove Event from DB
            removeEventFromDb(event._id);
            console.log("Removed event: " + event._id);
        } catch (error) {
            winston.error('Failed deleting an event: ' + event._id);
        }
    } catch (error) {
        winston.error('Failed Saving post to DB ' + post);
    }

    return;
}

// Update a post logic - Getting an event and returning the same event with the new updated title and/or content
async function updatePostAction(event) {
    let post;
    let user;
    // Make sure user exists
    user = await User.findById(event.eventBody[0].userId);
    if (!user) {
        winston.error(`User ${event.eventBody[0].userId} does not exist and therefore can not update post.  ${event}`);
        return;
    }

    // Update the post to DB
    try {
        post = await Post.findOneAndUpdate({_id: event.eventBody[0].postId}, {
            title: event.eventBody[0].title,
            content: event.eventBody[0].content,
            dateUpdated: Date.now()
        }, {new: true});

        if (post) {
            winston.info(`Post ${post._id} was successfully updated`);
        }
        //Remove Event from DB
        removeEventFromDb(event._id);

    } catch (error) {
        winston.error('Failed Saving updated post to DB ' + post);
    }

}

// Finds an Event in DB and removing it
function removeEventFromDb(id) {
    Event.findOneAndRemove({_id: id}, function (err, res) {
        if (res) {
            winston.log(`Event ${id} deleted successfully`);
            return true;
        } else {
            winston.error(`Failed deleting event: ${id} with error: ${err}`);
            return false;
        }
    });
}

// Vote a post logic - Getting an event and returning the same event with the new votes calculation
async function votePostAction(action, event) {
    // Make sure user exists and allowed to vote
    const user = await User.findById(event.eventBody[0].userId);
    if (!user) {
        winston.error(`User ${event.eventBody[0].userId} does not exist and therefore can not update post.  ${event}`);
        return;
    }

    // Make sure that post exists in DB and ready to be processed - if so, we flag the post in DB and lock it from editing
    let post = await Post.findOneAndUpdate({
        _id: event.eventBody[0].postId,
        isProcessed: false
    }, {$set: {isProcessed: true}}, {new: true});
    // If a post is not found or not ready to be edited
    if (!post) {
        // Make sure that post exists in DB at all
        post = await Post.findById(event.eventBody[0].postId);
        if (!post) {
            // if not - return
            winston.error(`Post ${event.eventBody[0].postId} does not exist and therefore can not be updated. ${event}`);
            return;
        } else {
            // if yes - we enable the event in order to get it again next cycle
            const enableEvent = await Event.findOneAndUpdate({_id: event._id}, {isActive: true});
            if (enableEvent) {
                winston.info(`Event ${event._id} will be processed next cycle`);
            } else {
                winston.error(`Failed enabling event ${event._id} for next cycle`);
            }
            return;
        }
    }
    // Update the new votes and the new rank generated, also we set the post to be ready again to edit
    post.votes = await calculateVotes(action, post.votes, user._id);
    post.rank = await calculateRank(post.votes[0].upVotes.length, post.votes[0].downVotes.length, post.dateCreated);
    post.isProcessed = false;

    try {
        // Save the updated post in DB;
        post = await savePostToDB(post);
        if (post) {
            winston.info(`Post ${post._id} votes are updated`);
            removeEventFromDb(event._id);
        }
    } catch (error) {
        winston.error('Failed upvoting post to DB ' + post);
    }
}

// Get the current top results from cache sorted and storing it into cache
async function updateTopResultsInCache(numberOfResults) {
    try {
        const posts = await Post.find().sort({rank: -1}).limit(numberOfResults);
        client.setex("top/", consts.CACHE_STORE_TIMEOUT, JSON.stringify(posts));
        winston.info('Updated Top Posts in cache successfully');
        return true;
    } catch (err) {
        winston.error("Failed updated TopResults in cache, Reason: " + err);
        return false;
    }
}