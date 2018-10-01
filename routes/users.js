const validateObjectId = require('../middleware/validateObjectId');
const {User, validateUser} = require('../models/user');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

// Returns the list of all users
router.get('/', async (req, res) => {
    // Return the list of all users
    const users = await User.find().sort('-dateCreated');
    res.send(users);
});

// Get a User data provided userId
router.get('/:userId', validateObjectId, async (req, res) => {
    const { error } = validateUser(req.params.userId);
    if (error) return res.status(400).send(error.details[0].message);
    // Return the list of all users
    const user = await User.findById(req.params.userId);
    if(!user) return res.status(400).status({"message" : "User does not exist"})

    res.send(user);
});

// Create a new User - returns the new User Object
router.post('/create', async (req, res) => {

    let user = new User({ 
        name: req.body.name,
        dateCreated: Date.now(),
        isActive: true
    });
    user = await user.save();

    res.send(user);
});


module.exports = router;