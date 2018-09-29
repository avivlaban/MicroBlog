const mongoose = require('mongoose');
const { Post } = require('../models/post');
const { User } = require('../models/user');
const { Event } = require('./event');
const winston = require('winston');
const {calculateRank} = require('./rank');
const { getRedisClient } = require('../startup/cache');
const {calculateVotes, eventAction} = require('./eventsUtils');

const client = getRedisClient();

const timeOutForNewPostsCheckInSeconds = 10;
const maxEventsProcessing = 10;
const maxPostsInCache = 1000;


module.exports.startListening = async function(){
    winston.info('Started event\'s handler process');

    // Executes every ${timeOutForNewPostsCheckInSeconds} seconds
    setInterval(async function() {
        let events = [];
        let singleEvent;
        let counter = 0;

        // Update Top events in cache
        updateTopResultsInCache(maxPostsInCache);
        // Get Events to Process from DB
        try{
            do{
                singleEvent = await Event.findOneAndUpdate({isActive: true}, {isActive: false});
                if(singleEvent) {
                    events.push(singleEvent);
                    counter++;
                }
            }while(singleEvent && (counter < maxEventsProcessing));
            if(events.length > 0) {
                winston.info('Sucessfully got events from DB');
            }else{
                winston.info('No Events to update');
            }
        }catch(error){
            winston.error("Failed getting events from DB: " + error);
        }


        //console.log("Single Event action: " + JSON.parse(events)[0].action);

        //If there are events to process
        if(events){
            try {
                events.forEach(function (event) {

                    console.log("Event is: " + event);
                    switch (event.action) {
                        case (eventAction.CREATE):
                        createPostAction(event);
                        break;
                        case (eventAction.UPDATE):
                        updatePostAction(event);
                        break;
                        case (eventAction.UPVOTE):
                        upvotePostAction(event);
                        break;
                        case (eventAction.DOWNVOTE):
                        downvotePostAction(event);
                        break;
                        default:
                        winston.error('Unknown action. Event can not be updated: ' + event);
                    }
                });
            }catch(error){
                winston.error("Error found: " + error);
            }
        };

    }, timeOutForNewPostsCheckInSeconds * 1000);
}

async function createPostAction(event){
    let post;
    let user;
    // Make sure user exists
    try {
        user = await User.findById(event.eventBody[0].userId);
        if (!user) {
            winston.error(`Error with User. He does not exist and therefore can not post. ${event}`);
            return;
        }
    }catch(error){
        winston.error('Failed processing event: ' + event);
        return;
    }
    // Creating a new Post
    try{
        post = new Post({
            title: event.eventBody[0].title,
            autor: {
                _id: user._id,
                name: user.name
            },
            rank: calculateRank(0, 0, Date.now()),
            votes: [{upVotes: [], downVotes: [], upVotesCount: 0, downVotesCount: 0}],
            dateCreated: Date.now(),
            dateUpdated: Date.now(),
            content: event.eventBody[0].content,
            isProcessed: false
        });
        post = await post.save();
        winston.info(`A new Post was successfully created: ${post._id}`);
        try{
            //Remove Event from DB
            removeEventFromDb(event._id);
            console.log("Removed event: " + event._id);
        }catch(error){
            winston.error('Failed deleting an event: ' + event._id);
        }
    }catch(error){
        winston.error('Failed Saving post to DB ' + post);
    }

    return;
}

async function updatePostAction(event){
    let post;
    let user;
    // Make sure user exists
    user = await User.findById(event.eventBody[0].userId);
    if(!user){
        winston.error(`User ${event.eventBody[0].userId} does not exist and therefore can not update post.  ${event}`);
        return;
    }

    // Update the post to DB
    try{
        post = await Post.findOneAndUpdate({_id: event.eventBody[0].postId}, {
            title: event.eventBody[0].title,
            content: event.eventBody[0].content,
            dateUpdated: Date.now()
        },{new: true});

        if (post) {
            winston.info(`Post ${post._id} was successfully updated`);
        }
        removeEventFromDb(event._id);

    }catch(error){
        winston.error('Failed Saving updated post to DB ' + post);
    }

}

function removeEventFromDb(id){
    // Event.findOneAndRemove({_id: id}, function(result, err){
    //     if(!err){
    //         winston.log(`Event ${id} deleted successfully`);
    //         return true;
    //     }else{
    //         winston.error(`Failed deleting event: ${id} with error: ${err}`);
    //         return false;
    //     }
    // });
    console.log(`Event ${id} deleted successfully`);
}


async function upvotePostAction(event){
    // Make sure user exists
    const user = await User.findById(event.eventBody[0].userId);
    if(!user){
        winston.error(`User ${event.eventBody[0].userId} does not exist and therefore can not update post.  ${event}`);
        return;
    }

    // Make sure that post exists in DB and ready to be processed
    let post = await Post.findOneAndUpdate({_id: event.eventBody[0].postId, isProcessed: false}, {$set: {isProcessed: true}}, {new: true});
    if(!post){
        // Make sure that post exists in DB
        post = await Post.findById(event.eventBody[0].postId);
        if(!post){
            winston.error(`Post ${event.eventBody[0].postId} does not exist and therefore can not be updated. ${event}`);
            return;
        }else{
            const enableEvent = await Event.findOneAndUpdate({_id: event._id}, {isActive: true});
            if(enableEvent){
                winston.info(`Event ${event._id} will be processed next cycle`);
            }else{
                winston.error(`Failed enabling event ${event._id} for next cycle`);
            }
            return;
        }
    }
    console.log("Post to Edit is: " + post);
    post.votes = await calculateVotes(eventAction.UPVOTE, post.votes, user._id);
    post.rank =  await calculateRank(post.votes[0].upVotes.length, post.votes[0].downVotes.length, post.dateCreated);
    post.isProcessed = false;

    try {
        post = await post.save();
        if(post) {
            winston.info(`Post ${post._id} upvotes are updated`);
            removeEventFromDb(event._id);
        }
    }catch(error){
        winston.error('Failed upvoting post to DB ' + post);
    }
}

async function downvotePostAction(event){
    // Make sure user exists
    const user = await User.findById(event.eventBody[0].userId);
    if(!user){
        winston.error(`User ${event.eventBody[0].userId} does not exist and therefore can not update post.  ${event}`);
        return;
    }

    // Make sure that post exists in DB and ready to be processed
    let post = await Post.findOneAndUpdate({_id: event.eventBody[0].postId, isProcessed: false}, {$set: {isProcessed: true}}, {new: true});
    if(!post){
        // Make sure that post exists in DB
        post = await Post.findById(event.eventBody[0].postId);
        if(!post){
            winston.error(`Post ${event.eventBody[0].postId} does not exist and therefore can not be updated. ${event}`);
            return;
        }else{
            const enableEvent = await Event.findOneAndUpdate({_id: event._id}, {isActive: true});
            if(enableEvent){
                winston.info(`Event ${event._id} will be processed next cycle`);
            }else{
                winston.error(`Failed enabling event ${event._id} for next cycle`);
            }
            return;
        }
    }

    post.votes =  await calculateVotes(eventAction.DOWNVOTE, post.votes, user._id);
    post.rank =  await calculateRank(post.votes[0].upVotes.length, post.votes[0].downVotes.length, post.dateCreated);
    post.isProcessed = false;

    try {
        post = await post.save();
        if(post) {
            winston.info(`Post ${post._id} downvotes are updated`);
            removeEventFromDb(event._id);
        }
    }catch(error){
        winston.error('Failed upvoting post to DB ' + post);
    }
}

async function updateTopResultsInCache(numberOfResults){
    try{
        const posts = await Post.find().sort({ rank: -1}).limit(numberOfResults);
        client.setex("topposts/", 300, JSON.stringify(posts));
        winston.log('Updated TopResults in cache successfully');
        return true;
    }catch(err){
        winston.error("Failed updated TopResults in cache, Reason: " + err);
        return false;
    }
}