const {User, validateUser} = require('../models/user');
const {Post, validatePost} = require('../models/post');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    res.status(200).send('Test Completed');
  });

router.post('/create/:userId', async (req, res) => {
    const { error } = validatePost(req.body); 
    if (error) return res.status(400).send(error.details[0].message);
    // Make Sure User Exists
    console.log("User id is: ", req.params.userId);
    const user = await User.findById(req.params.userId);
    // If Not - Return 404
    if(!user) return res.status(404).send('User does not exist and therefore can not post');
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

    res.send(post);
});

router.put('/update/:postId', async (req, res) => {
    const { error } = validatePost(req.body); 
    if (error) return res.status(400).send(error.details[0].message);
    // Make Sure Post Exists
    let post = await Post.findById(req.params.postId);
    // If Not - Return 404
    if(!post) return res.status(404).send('A post with the given id does not exists');
    // If Yes - Create a new Post
    console.log("Post id is: ", req.params.postId);
    console.log("New Title is: ", req.body.title);
    console.log("New Post is: ", req.body.content);
    post = await Post.findOneAndUpdate(req.params.postId, 
        {
            title: req.body.title,
            content: req.body.content,
            dateUpdated: Date.now()
        });
    res.send("Post was updated");
});

router.put('/upvote/post/:postId/user/:userId', async (req, res) => {
    console.log(1);
    // Make Sure Post Exists
    let post = await Post.findById(req.params.postId);
    console.log(2);
    // If Not - Return 404
    if(!post) return res.status(404).send('A post with the given id does not exists');
    console.log(3);
    // Make Sure User Exists
    console.log("User id is: ", req.params.userId);
    console.log(4);
    const user = await User.findById(req.params.userId);
    console.log(5);
    // If Not - Return 404
    if(!user) return res.status(404).send('User does not exist and therefore can not upvote');
    console.log(6);
    //If Yes - Get Upvotes Array
    let upVotesList = post.upVotes;
    console.log(7);
    const indexOfUserInUpVoteList = req.params.userId;
    console.log(8);
    
    if(indexOfUserInUpVoteList > -1){
        console.log(`User ${user._id} UpVoting Post ${post._id}.`);
        upVotesList.put(userId);
        post.upVotes = upVotesList;
        post.upVotesCount = upVotesList.length;
        const result = await post.save();
        console.log("Post UpVoted Updated:", result);
        res.send(result);
    }else{
        //const errorMessage = `User ${user._id} already UpVoted Post ${post._id}. A user can only do it once`;
        console.log("Bye");
        res.send("Bye");
    }
});

module.exports = router;