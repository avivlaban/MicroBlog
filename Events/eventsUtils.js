const winston = require('winston');

// Supported Event's Actions
module.exports.eventAction = {
    CREATE: 1,
    UPDATE: 2,
    UPVOTE: 3,
    DOWNVOTE: 4,
}

module.exports.calculateVotes = async function (action, votes, voter, postId) {
    // Make sure we don't get null or undefined
    if(!action && !votes[0].upVotes && !votes[0].downVotes && !voter){
        winston.error('one of the elements provided is null or undefined');
        return votes;
    }

    let result;
    switch(action){
        // UPVOTE Action
        case 3:
            result = await upVoteAction(votes, voter, postId);
            break;
        // DOWNVOTE Action
        case 4:
            result = await downVoteAction(votes, voter, postId);
            break;
        default:
            winston.error("No permitted action found: " + action);
    }
    return result;

}

// Updating the votes according to a UpVote logic
async function upVoteAction(votes, voter, postId){
    // Check if user already voted before and where
    let isUserInUpVoteList;
    let isUserInDownVoteList;
    try {
        isUserInUpVoteList = (votes[0].upVotes.indexOf(voter) > -1);
        isUserInDownVoteList = (votes[0].downVotes.indexOf(voter) > -1);
    }catch(error){
        winston.error('failed upvoting: ' + error);
        return votes;
    }

    if(!isUserInDownVoteList && !isUserInUpVoteList){
        // Updating User's UpVote
        votes = await addUserToUpVoteList(votes, voter, postId);
    }else if(!isUserInDownVoteList && isUserInUpVoteList){
        // User Already UpVoted the Post
        winston.info(`User ${voter} already UpVoted Post ${postId}. He can only do it once`);
    }else if(isUserInDownVoteList && !isUserInUpVoteList){
        // User DownVoted before - first remove it and then perform UpVote
        votes = await removeUserFromDownVoteList(votes, voter, postId);
        votes = await addUserToUpVoteList(votes, voter, postId);
    }else{
        // Error - The user has already upvoted and downvoted this post - illegal combination
        winston.error(`The user ${voter} has already upvoted and downvoted this post. illegal combination!`);
    }
    return votes;
}

// Updating the votes according to a DownVote logic
async function downVoteAction(votes, voter, postId){

    // Check if user already voted before and where
    let isUserInUpVoteList;
    let isUserInDownVoteList;
    try {
        isUserInUpVoteList = (votes[0].upVotes.indexOf(voter) > -1);
        isUserInDownVoteList = (votes[0].downVotes.indexOf(voter) > -1);
    }catch(error){
        winston.error('failed downvoting: ' + error);
        return votes;
    }

    if(!isUserInDownVoteList && !isUserInUpVoteList){
        // Updating User's DownVote
        votes = await addUserToDownVoteList(votes, voter, postId);
    }else if(!isUserInDownVoteList && isUserInUpVoteList){
        // User UpVoted before - first remove it and then perform DownVote
        votes = await removeUserFromUpVoteList(votes, voter, postId);
        votes = await addUserToDownVoteList(votes, voter, postId);
    }else if(isUserInDownVoteList && !isUserInUpVoteList){
        // User Already DownVotes the Post
        winston.info(`User ${voter} already DownVoted Post ${postId}. He can only do it once`);
    }else{
        // Error - The user has already upvoted and downvoted this post - illegal combination
        winston.error(`The user ${voter} has already upvoted and downvoted this post. illegal combination!`);
    }
    return votes;
}

// add a given user to the object's upvote list
async function addUserToUpVoteList(votes, voterId, postId){
    // Get UpVotes List
    let upVotesList = votes[0].upVotes;
    // Adding the voting user id to the list
    upVotesList.push(voterId);

    winston.log(`User ${voterId} upvoted Post ${postId}`);
    return votes;
}

// add a given user to the object's downvote list
async function addUserToDownVoteList(votes, voterId, postId){
    // Get DownVotes List
    let downVotesList = votes[0].downVotes;
    // Adding the voting user id to the list
    downVotesList.push(voterId);

    winston.log(`User ${voterId} downvoted Post ${postId}`);
    return votes;
}

// remove a given user from the object's upvote list
async function removeUserFromUpVoteList(votes, voterId, postId){
    // Get UpVotes List
    let upVotesList = votes[0].upVotes;

    // Removing the voting user id from the list
    var index = upVotesList.indexOf(voterId);
    if (index > -1) {
        upVotesList.splice(index, 1);
    }
    winston.log(`User ${voterId}' upvote was removed from Post ${postId}.`);

    return votes;
}

// remove a given user from the object's downvote list
async function removeUserFromDownVoteList(votes, voterId, postId){
    // Get DownVotes List
    let downVotesList = votes[0].downVotes;

    // Removing the voting user id from the list
    var index = downVotesList.indexOf(voterId);
    if (index > -1) {
        downVotesList.splice(index, 1);
    }
    winston.log(`User ${voterId}' downvote was removed from Post ${postId}.`);
    return votes;
}