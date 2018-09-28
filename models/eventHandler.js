const mongoose = require('mongoose');
const { Post } = require('./post');
const { User } = require('./user');
const { Event } = require('./event');
const winston = require('winston');
const {calculateRank} = require('../rank');

const timeOutForNewPostsCheckInSeconds = 15;
const maxEventsProcessing = 10;


module.exports.startListening = async function(){
    winston.info('Started event\'s handler process');

    // Executes every ${timeOutForNewPostsCheckInSeconds} seconds
    setInterval(async function() {
        let events = [];
        let singleEvent;
        let counter = 0;
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
                console.log('Events are: ' + events);
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
                        case ("CREATE"):
                        createPostAction(event);
                        break;
                        case ('UPDATE'):
                        updatePostAction(event);
                        break;
                        case ('UPVOTE'):
                        upvotePostAction(event);
                        break;
                        case ('DOWNVOTE'):
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
            upVotes: [],
            downVotes: [],
            downVotesCount: 0,
            upVotesCount: 0,
            dateCreated: Date.now(),
            dateUpdated: Date.now(),
            content: event.eventBody[0].content
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

    // Make sure post exists
    post = await Post.findById(event.eventBody[0].postId);
    if(!post){
        winston.error(`Post ${event.eventBody[0].postId} does not exist and therefore can not be updated. ${event}` );
        return;
    }

    console.log("Post is: " + post);

    // Update the post to DB
    try{
        post.title = event.eventBody[0].title;
        post.content = event.eventBody[0].content;
        post.dateUpdated = Date.now()
        post = await post.save();
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

    // Make sure post exists
    let post = await Post.findById(event.eventBody[0].postId);
    if(!post){
        winston.error(`Post ${event.eventBody[0].postId} does not exist and therefore can not be updated. ${event}` );
        return;
    }

    // Check if user already voted before and where
    const isUserInUpVoteList = (post.upVotes.indexOf(user._id) > -1);
    const isUserInDownVoteList = (post.downVotes.indexOf(user._id) > -1);

    if(!isUserInDownVoteList && !isUserInUpVoteList){
        // Updating User's UpVote
        post = await addUserToUpVoteList(post, user._id);
    }else if(!isUserInDownVoteList && isUserInUpVoteList){
        // User Already UpVoted the Post
        winston.info(`User ${user._id} already UpVoted Post ${post._id}. A user can only do it once`);
    }else if(isUserInDownVoteList && !isUserInUpVoteList){
        // User DownVoted before - first remove it and then perform UpVote
        post = await removeUserFromDownVoteList(post, user._id);
        post = await addUserToUpVoteList(post, user._id);
    }else{
        // Error - The user has already upvoted and downvoted this post - illegal combination
        winston.error(`The user ${user._id} has already upvoted and downvoted this post. illegal combination!`);
    }
    try {
        const result = await post.save();
        winston.info(`Post ${result._id} was successfully upvoted`);
        removeEventFromDb(event._id);
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

    // Make sure post exists
    let post = await Post.findById(event.eventBody[0].postId);
    if(!post){
        winston.error(`Post ${event.eventBody[0].postId} does not exist and therefore can not be updated. ${event}` );
        return;
    }

    // Check if user already voted before and where
    const isUserInUpVoteList = (post.upVotes.indexOf(user._id) > -1);
    const isUserInDownVoteList = (post.downVotes.indexOf(user._id) > -1);

    if(!isUserInDownVoteList && !isUserInUpVoteList){
        // Updating User's DownVote
        post = await addUserToDownVoteList(post, user._id);
    }else if(!isUserInDownVoteList && isUserInUpVoteList){
        // User UpVoted before - first remove it and then perform DownVote
        post = await removeUserFromUpVoteList(post, user._id);
        post = await addUserToDownVoteList(post, user._id);
    }else if(isUserInDownVoteList && !isUserInUpVoteList){
        // User Already DownVotes the Post
        winston.info(`User ${user._id} already DownVoted Post ${post._id}. A user can only do it once`);
    }else{
        // Error - The user has already upvoted and downvoted this post - illegal combination
        winston.error(`The user ${user._id} has already upvoted and downvoted this post. illegal combination!`);
    }
    try {
        const result = await post.save();
        winston.info(`Post ${result._id} was successfully downvoted`);
        removeEventFromDb(event._id)
    }catch(error){
        winston.error('Failed downvoting post to DB ' + post);
    }
}


async function addUserToUpVoteList(post, voterId){
    // Get UpVotes List
    let upVotesList = post.upVotes;
    // Adding the voting user id to the list
    upVotesList.push(voterId);
    // Updating the list size
    post.upVotesCount = upVotesList.length;
    post.rank = calculateRank(post.upVotesCount, post.downVotesCount, post.dateCreated);
    console.log(`User ${voterId} upvoted Post ${post._id}. New Rank: ${post.rank}`);

    return post;
}

async function addUserToDownVoteList(post, voterId){
    // Get DownVotes List
    let downVotesList = post.downVotes;
    // Adding the voting user id to the list
    downVotesList.push(voterId);
    // Updating the list size
    post.downVotesCount = downVotesList.length;
    post.rank = calculateRank(post.upVotesCount, post.downVotesCount, post.dateCreated);
    console.log(`User ${voterId} downvoted Post ${post._id}. New Rank: ${post.rank}`);

    return post;
}

async function removeUserFromUpVoteList(post, voterId){
    // Get UpVotes List
    let upVotesList = post.upVotes;
    // Removing the voting user id from the list
    upVotesList.remove(voterId);
    // Updating the list size
    post.upVotesCount = upVotesList.length;
    console.log(`User ${voterId}' upvote was removed from Post ${post._id}.`);

    return post;
}

async function removeUserFromDownVoteList(post, voterId){
    // Get DownVotes List
    let downVotesList = post.downVotes;
    // Removing the voting user id from the list
    downVotesList.remove(voterId);
    // Updating the list size
    post.downVotesCount = downVotesList.length;
    console.log(`User ${voterId}' downvote was removed from Post ${post._id}.`);

    return post;
}