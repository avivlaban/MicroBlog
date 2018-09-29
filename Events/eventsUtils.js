const {calculateRank} = require('./rank');
const winston = require('winston');

module.exports.eventAction = {
    CREATE: 1,
    UPDATE: 2,
    UPVOTE: 3,
    DOWNVOTE: 4,
}

module.exports.calculateVotes = async function (action, votes, voter, postId) {
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

async function upVoteAction(votes, voter, postId){
    // Check if user already voted before and where
    const isUserInUpVoteList = (votes[0].upVotes.indexOf(voter) > -1);
    const isUserInDownVoteList = (votes[0].downVotes.indexOf(voter) > -1);

    if(!isUserInDownVoteList && !isUserInUpVoteList){
        // Updating User's UpVote
        votes = await addUserToUpVoteList(votes, voter, postId);
    }else if(!isUserInDownVoteList && isUserInUpVoteList){
        // User Already UpVoted the Post
        winston.info(`User ${voter} already UpVoted Post. He can only do it once`);
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

async function downVoteAction(votes, voter, postId){
    // Check if user already voted before and where
    const isUserInUpVoteList = (votes[0].upVotes.indexOf(voter) > -1);
    const isUserInDownVoteList = (votes[0].downVotes.indexOf(voter) > -1);

    if(!isUserInDownVoteList && !isUserInUpVoteList){
        // Updating User's DownVote
        votes = await addUserToDownVoteList(votes, voter, postId);
    }else if(!isUserInDownVoteList && isUserInUpVoteList){
        // User UpVoted before - first remove it and then perform DownVote
        votes = await removeUserFromUpVoteList(votes, voter, postId);
        votes = await addUserToDownVoteList(votes, voter, postId);
    }else if(isUserInDownVoteList && !isUserInUpVoteList){
        // User Already DownVotes the Post
        winston.info(`User ${voter} already DownVoted Post. He can only do it once`);
    }else{
        // Error - The user has already upvoted and downvoted this post - illegal combination
        winston.error(`The user ${voter} has already upvoted and downvoted this post. illegal combination!`);
    }
    return votes;
}

async function addUserToUpVoteList(votes, voterId, postId){
    // Get UpVotes List
    let upVotesList = votes[0].upVotes;
    // Adding the voting user id to the list
    upVotesList.push(voterId);

    winston.log(`User ${voterId} upvoted Post ${postId}`);
    return votes;
}

async function addUserToDownVoteList(votes, voterId, postId){
    // Get DownVotes List
    let downVotesList = votes[0].downVotes;
    // Adding the voting user id to the list
    downVotesList.push(voterId);

    winston.log(`User ${voterId} downvoted Post ${postId}`);
    return votes;
}

async function removeUserFromUpVoteList(votes, voterId, postId){
    // Get UpVotes List
    let upVotesList = votes[0].upVotes;
    // Removing the voting user id from the list
    upVotesList.remove(voterId);

    winston.log(`User ${voterId}' upvote was removed from Post ${postId}.`);

    return votes;
}

async function removeUserFromDownVoteList(votes, voterId, postId){
    // Get DownVotes List
    let downVotesList = votes[0].downVotes;
    // Removing the voting user id from the list
    downVotesList.remove(voterId);

    winston.log(`User ${voterId}' downvote was removed from Post ${postId}.`);
    return votes;
}