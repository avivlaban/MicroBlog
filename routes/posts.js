const {User, validateUser} = require('../models/user');
const {Post, validatePost, validateIdFormat} = require('../models/post');
const {calculateRank} = require('../rank');
const topPosts = require('../topPosts');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    res.status(200).send({"message" : 'Hello! Start Posting!'});
  });

router.get('/topposts/:count', async (req, res) => {
    return new Promise((resolve, reject) => {
        // Get the Top Posts as requseted by :count
        const postsResult = topPosts.getTopPosts(req.params.count).then((pr) => {

        if(pr){
            resolve(res.status(200).send(pr));
        }else{
            reject(res.status(500).send());
        }
        });
    });
});

router.post('/create/:userId', async (req, res) => {
    // Check if the post is a valid JSON
    const { error } = validatePost(req.body); 
    if (error) return res.status(400).send(error.details[0].message);

    // Make Sure User Exists
    const user = await User.findById(req.params.userId);
    // If Not - Return 404
    if(!user) return res.status(404).send({"message:" : 'User does not exist and therefore can not post'});
    // If Yes - Create a new Post
    let post = new Post({
        title: req.body.title,
        autor: {
            _id: user._id,
            name: user.name
        },
        rank: 0,
        upVotes: [],
        downVotes: [], 
        downVotesCount: 0,
        upVotesCount: 0,
        dateCreated: Date.now(),
        dateUpdated: Date.now(),
        content: req.body.content
    });
    post = await post.save();
    topPosts.addPostToUpdateList(post);

    res.send(post);
});

router.put('/update/:postId/user/:userId', async (req, res) => {
    // Check if the post is a valid JSON
    const { error } = validatePost(req.body); 
    if (error) return res.status(400).send(error.details[0].message);

    // Make Sure User Exists
    const user = await User.findById(req.params.userId);
    // If Not - Return 404
    if(!user) return res.status(404).send({"message:" : 'User does not exist and therefore can not post'});

    // Make Sure Post Exists
    let post = await Post.findById(req.params.postId);
    // If Not - Return 404
    if(!post) return res.status(404).send({"message:" : 'A post with the given id does not exists'});
    // If Yes - Create a new Post
    const updatePost = new Promise((resolve,reject) => {
        try{
            post = Post.findOneAndUpdate(req.params.postId,
            {
                title: req.body.title,
                content: req.body.content,
                dateUpdated: Date.now()
            }, {new: true}).then(result => {
                resolve(result)});
        }catch(err) {
            reject("Failed Updating Post with id: " + postId);
        }
        topPosts.addPostToUpdateList(post);

    })
    .then(post => {res.send(post)});

});

router.put('/upvote/post/:postId/user/:userId', async (req, res) => {
    const userId = req.params.userId;
    const postId = req.params.postId
    let post;
    if(validateIdFormat(postId) === true){
        // Make Sure Post Exists
        post = await Post.findById(postId);
        // If Not - Return 404
        if(!post) return res.status(404).send({"message:" : 'A post with the given id does not exists'});
    }else{
        return res.status(404).send({"message:" : 'A post with the given id does not exists'});
    }
    let user;
    if(validateIdFormat(userId) === true){
        // Make Sure User Exists
        console.log("User id is: ", req.params.userId);
        user = await User.findById(req.params.userId);
        // If Not - Return 404
        if(!user) return res.status(404).send({"message:" : 'User does not exist and therefore can not upvote'});
    }else{
        return res.status(404).send({"message:" : 'User does not exist and therefore can not upvote'})
    }
    //If Yes - Get Upvotes Array
    console.log("Post is:", post);

    const isUserInUpVoteList = (post.upVotes.indexOf(userId) > -1);
    const isUserInDownVoteList = (post.downVotes.indexOf(userId) > -1);
    console.log(`Is in upVote: ${isUserInUpVoteList}, is in downvote:${isUserInDownVoteList}`)


    if(!isUserInDownVoteList && !isUserInUpVoteList){
        // Updating User's UpVote
        post = addUserToUpVoteList(post, userId);
    }else if(!isUserInDownVoteList && isUserInUpVoteList){
        // User Already UpVoted the Post
        const errorMessage = `User ${user._id} already UpVoted Post ${post._id}. A user can only do it once`;
        console.log(errorMessage);
        res.status(405).send({"message:" : errorMessage});
    }else if(isUserInDownVoteList && !isUserInUpVoteList){
        // User DownVoted before - first remove it and then perform UpVote
        post = removeUserFromDownVoteList(post, userId);
        post = addUserToUpVoteList(post, userId);
    }else{
        // Error - The user has alredy upvoted and downvoted this post - illegal combination
        res.status(500).send();
    }

    const result = await post.save();
    topPosts.addPostToUpdateList(post);
    console.log("Post UpVoted Updated:", result);
    res.send(result);
});

router.put('/downvote/post/:postId/user/:userId', async (req, res) => {
    const userId = req.params.userId;
    const postId = req.params.postId
    let post;
    if(validateIdFormat(postId) === true){
        // Make Sure Post Exists
        post = await Post.findById(postId);
        // If Not - Return 404
        if(!post) return res.status(404).send({"message:" : 'A post with the given id does not exists'});
    }else{
        return res.status(404).send({"message:" : 'A post with the given id does not exists'});
    }
    let user;
    if(validateIdFormat(userId) === true){
        // Make Sure User Exists
        user = await User.findById(req.params.userId);
        // If Not - Return 404
        if(!user) return res.status(404).send({"message:" : 'User does not exist and therefore can not downvote'});
    }else{
        return res.status(404).send({"message:" : 'User does not exist and therefore can not downvote'})
    }
    //If Yes - Get Downvote Array
    console.log("Post is:", post);

    const isUserInUpVoteList = (post.upVotes.indexOf(userId) > -1);
    const isUserInDownVoteList = (post.downVotes.indexOf(userId) > -1);


    if(!isUserInDownVoteList && !isUserInUpVoteList){
        // Updating User's DownVote
        post = addUserToDownVoteList(post, userId);
    }else if(isUserInDownVoteList && !isUserInUpVoteList){
        // User Already DownVotes the Post
        const errorMessage = `User ${user._id} already Downvoted Post ${post._id}. A user can only do it once`;
        console.log(errorMessage);
        res.status(405).send(errorMessage);
    }else if(!isUserInDownVoteList && isUserInUpVoteList){
        // User UpVoted before - first remove it and then perform DownVote
        post = removeUserFromUpVoteList(post, userId);
        post = addUserToDownVoteList(post, userId);
    }else{
        // Error - The user has alredy upvoted and downvoted this post - illegal combination
        res.status(500).send();
    }

    const result = await post.save();
    topPosts.addPostToUpdateList(post);
    console.log("Post Downvoted Updated:", result);
    res.send(result);

});


function didUserVote(array, userId){
    const indexOfUserInList = array.indexOf(userId);
    if(indexOfUserInList > -1){
        return true;
    }else{
        return false;
    }
};

function addUserToUpVoteList(post, voterId){
    // Get UpVotes List
    let upVotesList = post.upVotes;
    // Adding the voting user id to the list
    upVotesList.push(voterId);
    // Updating the list size
    post.upVotesCount += 1;
    post.rank = calculateRank(post.upVotesCount, post.downVotesCount, post.dateCreated);
    console.log(`User ${voterId} upvoted Post ${post._id}. New Rank: ${post.rank}`);

    return post;
}

function addUserToDownVoteList(post, voterId){
    // Get DownVotes List
    let downVotesList = post.downVotes;
    // Adding the voting user id to the list
    downVotesList.push(voterId);
    // Updating the list size
    post.downVotesCount += 1;
    post.rank = calculateRank(post.upVotesCount, post.downVotesCount, post.dateCreated);
    console.log(`User ${voterId} downvoted Post ${post._id}. New Rank: ${post.rank}`);

    return post;
}

function removeUserFromUpVoteList(post, voterId){
    // Get UpVotes List
    let upVotesList = post.upVotes;
    // Removing the voting user id from the list
    upVotesList.remove(voterId);
    // Updating the list size
    post.upVotesCount -= 1;
    console.log(`User ${voterId}' upvote was removed from Post ${post._id}.`);

    return post;
}

function removeUserFromDownVoteList(post, voterId){
    // Get DownVotes List
    let downVotesList = post.downVotes;
    // Removing the voting user id from the list
    downVotesList.remove(voterId);
    // Updating the list size
    post.downVotesCount -= 1;
    console.log(`User ${voterId}' downvote was removed from Post ${post._id}.`);

    return post;
}

module.exports = router;