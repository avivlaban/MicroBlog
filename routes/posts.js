
const {Post} = require('../models/post');
const {Event, validateCreateEvent, validateUpdateEvent, validateVoteEvent} = require('../Events/event');
const winston = require('winston');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const { getRedisClient } = require('../startup/cache');
const {eventAction} = require('../events/eventsUtils');

const client = getRedisClient();


router.get('/', async (req, res) => {

  });

router.get('/top/', async (req, resp) => {

    client.get("top/", async (err, result) => {
        if (result != null) {
            console.log("Cache hit for ");
            resp.send(result);
        } else {
            console.log("Cache missed for ");
            let posts;
            try{
                posts = await Post.find().sort({ rank: 1}).limit(1000);
                console.log("Posts are: " + posts);
                try{
                    client.setex("top/", 300, JSON.stringify(posts));
                    resp.send(posts);
                }catch(err){
                    console.log(err);
                    resp.status(202).send();
                }
            }catch(err){
                console.log(err);
                resp.status(202).send();
            }
        }
})
});

router.post('/create', async (req, res) => {
    // Check if the post is a valid JSON
    const { error } = validateCreateEvent(req.body);
    if (error) return res.status(400).send(error.details[0]);

    // Create an Event for later processing
    let event = new Event({
        action: eventAction.CREATE,
        eventBody: req.body,
        dateCreated: Date.now(),
        isActive: true
    });

    // Save Event in DB
    try{
        event = await event.save();
        res.status(200).send("Create Event Recieved");
    }catch(error){
        winston.error("Failed saving a CREATE event to DB: " + error);
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