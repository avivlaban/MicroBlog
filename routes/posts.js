const consts = require('../consts/consts');
const {Post, getNewPostObject, savePostToDB} = require('../models/post');
const {User} = require('../models/user');
const {Event, validateCreateEvent, validateUpdateEvent, validateVoteEvent, saveEventToDB} = require('../events/event');
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
        if (result != null && process.env.NODE_ENV != consts.APP_TEST_ENV) {
            winston.info("Returning results from Cache");
            resp.send(result);
        } else {
            winston.info("No results in cache. Returning results from DB.");
            let posts;
            try{
                posts = await Post.find().sort({rank: -1}).limit(1000);
                try{
                    client.setex("top/", consts.CACHE_STORE_TIMEOUT, JSON.stringify(posts));
                    resp.send(posts);
                }catch(err){
                    winston.error(err);
                    resp.status(consts.HTTP_ACCEPTED).send();
                }
            }catch(err){
                console.error(err);
                resp.status(consts.HTTP_ACCEPTED).send();
            }
        }
})
});


router.post('/create', async (req, res) => {
    let post;
    let user;

    // Check that body has data
    if(!req.body){
        res.status(consts.HTTP_BAD_REQUEST).send("No data in body");
    }

    // Check if the post is a valid JSON
    const { error } = validateCreateEvent(req.body);
    if (error) return res.status(consts.HTTP_BAD_REQUEST).send(error.details[0]);
    // Make sure user exists
    try {
        user = await User.findById(req.body.userId);
        if (!user) {
            const error = `Error with User. He does not exist and therefore can not post. ${event}`;
            winston.error(error);
            return res.status(consts.HTTP_NOT_FOUND).send(error);
        }
    }catch(error){
        const errorMessage = 'Failed processing User: ' + req.body.userId;
        winston.error(errorMessage);
        return res.status(consts.HTTP_INTERNAL_SERVER_ERROR).send(errorMessage);
    }

    // Create a Post
    post = await getNewPostObject(user, req.body.title, req.body.content);

    // Save Post in DB
    try{
        post = await savePostToDB(post);
        res.status(consts.HTTP_OK).send("Post created: " + post);
    }catch(error){
        winston.error("Failed saving post to DB: " + error);
        res.status(consts.HTTP_INTERNAL_SERVER_ERROR).send(error);
    }
});

router.put('/update', async (req, res) => {
    // Check that body has data
    if(!req.body){
        res.status(consts.HTTP_BAD_REQUEST).send("No data in body");
    }
    // Check if the post is a valid JSON
    const { error } = validateUpdateEvent(req.body);
    if (error) return res.status(consts.HTTP_BAD_REQUEST).send(error.details[0]);

    // Create an Event for later processing
    let event = new Event({
        action: eventAction.UPDATE,
        eventBody: req.body,
        dateCreated: Date.now(),
        isActive: true
    });

    // Save Event in DB
    try{
        event = await saveEventToDB(event);
        res.status(consts.HTTP_OK).send("Update Event Recieved");
    }catch(error){
        winston.error("Failed saving an UPDATE event to DB: " + error);
        res.status(consts.HTTP_INTERNAL_SERVER_ERROR).send(error);
    }

});

router.put('/upvote', async (req, res) => {
    // Check that body has data
    if(!req.body){
        res.status(consts.HTTP_BAD_REQUEST).send("No data in body");
    }

    // Check if the post is a valid JSON
    const { error } = validateVoteEvent(req.body);
    if (error) return res.status(consts.HTTP_BAD_REQUEST).send(error.details[0]);

    // Create an Event for later processing
    let event = new Event({
        action: eventAction.UPVOTE,
        eventBody: req.body,
        dateCreated: Date.now(),
        isActive: true
    });

    // Save Event in DB
    // TODO: extract to another method
    try{
        event = await saveEventToDB(event);
        res.status(consts.HTTP_OK).send("UpVote Event Recieved");
    }catch(error){
        winston.error("Failed saving an UPVOTE event to DB: " + error);
        res.status(consts.HTTP_INTERNAL_SERVER_ERROR).send(error);
    }
});

router.put('/downvote', async (req, res) => {
    // Check that body has data
    if(!req.body){
        res.status(consts.HTTP_BAD_REQUEST).send("No data in body");
    }

    // Check if the post is a valid JSON
    const { error } = validateVoteEvent(req.body);
    if (error) return res.status(consys.HTTP_BAD_REQUEST).send(error.details[0]);

    // Create an Event for later processing
    let event = new Event({
        action: eventAction.DOWNVOTE,
        eventBody: req.body,
        dateCreated: Date.now(),
        isActive: true
    });

    // Save Event in DB
    try{
        event = await saveEventToDB(event);
        res.status(consts.HTTP_OK).send("DownVote Event Recieved");
    }catch(error){
        winston.error("Failed saving a DOWNVOTE event to DB: " + error);
        res.status(consts.HTTP_INTERNAL_SERVER_ERROR).send(error);
    }

});

module.exports = router;