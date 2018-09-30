
const {Post} = require('../models/post');
const {User} = require('../models/user');
const {Event, validateCreateEvent, validateUpdateEvent, validateVoteEvent} = require('../Events/event');
const winston = require('winston');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const { getRedisClient } = require('../startup/cache');
const {eventAction} = require('../events/eventsUtils');
const {calculateRank} = require('../events/rank');

const client = getRedisClient();

router.get('/', async (req, res) => {
        res.send({message: "Hi, I'm your MicroBlog..."});
  });

router.get('/top/', async (req, resp) => {

    client.get("top/", async (err, result) => {
        if (result != null && process.env.NODE_ENV != 'test') {
            winston.info("Returning results from Cache");
            resp.send(result);
        } else {
            winston.info("No results in cache. Returning results from DB.");
            let posts;
            try{
                posts = await Post.find().sort({rank: -1}).limit(1000);
                try{
                    client.setex("top/", 300, JSON.stringify(posts));
                    resp.send(posts);
                }catch(err){
                    winston.error(err);
                    resp.status(202).send();
                }
            }catch(err){
                console.error(err);
                resp.status(202).send();
            }
        }
})
});

router.post('/create', async (req, res) => {
    // Check if the post is a valid JSON
    const { error } = validateCreateEvent(req.body);
    if (error) return res.status(400).send(error.details[0]);

    let post;
    let user;
    // Make sure user exists
    try {
        user = await User.findById(req.body.userId);
        if (!user) {
            const error = `Error with User. He does not exist and therefore can not post. ${event}`;
            winston.error(error);
            return res.status(404).send(error);
        }
    }catch(error){
        const errorMessage = 'Failed processing User: ' + req.body.userId;
        winston.error(errorMessage);
        return res.status(500).send(errorMessage);
    }

    // Create a Post
    post = new Post({
        title: req.body.title,
        autor: {
            _id: user._id,
            name: user.name
        },
        rank: calculateRank(0, 0, Date.now()),
        votes: [{upVotes: [], downVotes: [], upVotesCount: 0, downVotesCount: 0}],
        dateCreated: Date.now(),
        dateUpdated: Date.now(),
        content: req.body.content,
        isProcessed: false
    });

    // Save Post in DB
    try{
        post = await post.save();
        res.status(200).send("Post created: " + post);
    }catch(error){
        winston.error("Failed saving post to DB: " + error);
        res.status(500).send(error);
    }
});

router.put('/update', async (req, res) => {
    // Check if the post is a valid JSON
    const { error } = validateUpdateEvent(req.body);
    if (error) return res.status(400).send(error.details[0]);

    // Create an Event for later processing
    let event = new Event({
        action: eventAction.UPDATE,
        eventBody: req.body,
        dateCreated: Date.now(),
        isActive: true
    });

    // Save Event in DB
    try{
        event = await event.save();
        res.status(200).send("Update Event Recieved");
    }catch(error){
        winston.error("Failed saving an UPDATE event to DB: " + error);
        res.status(500).send(error);
    }

});

router.put('/upvote', async (req, res) => {

    // Check if the post is a valid JSON
    const { error } = validateVoteEvent(req.body);
    if (error) return res.status(400).send(error.details[0]);

    // Create an Event for later processing
    let event = new Event({
        action: eventAction.UPVOTE,
        eventBody: req.body,
        dateCreated: Date.now(),
        isActive: true
    });

    // Save Event in DB
    try{
        event = await event.save();
        res.status(200).send("UpVote Event Recieved");
    }catch(error){
        winston.error("Failed saving an UPVOTE event to DB: " + error);
        res.status(500).send(error);
    }
});

router.put('/downvote', async (req, res) => {
    // Check if the post is a valid JSON
    const { error } = validateVoteEvent(req.body);
    if (error) return res.status(400).send(error.details[0]);

    // Create an Event for later processing
    let event = new Event({
        action: eventAction.DOWNVOTE,
        eventBody: req.body,
        dateCreated: Date.now(),
        isActive: true
    });

    // Save Event in DB
    try{
        event = await event.save();
        res.status(200).send("DownVote Event Recieved");
    }catch(error){
        winston.error("Failed saving a DOWNVOTE event to DB: " + error);
        res.status(500).send(error);
    }

});

module.exports = router;