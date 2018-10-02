const consts = require('../consts/consts');
const validateObjectId = require('../middleware/validateObjectId');
const {User, validateUser} = require('../models/user');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

// Returns the list of all users
router.get('/', async (req, res) => {
    // Return the list of all users
    const users = await User.find().sort('-dateCreated');
    res.status(consts.HTTP_OK).send(users);
});

// Get a User data provided userId
router.get('/:userId', validateObjectId, async (req, res) => {
    const { error } = validateUser(req.params.userId);
    if (error) return res.status(consts.HTTP_BAD_REQUEST).send(error.details[0].message);
    // Return the list of all users
    const user = await User.findById(req.params.userId);
    if(!user) return res.status(consts.HTTP_BAD_REQUEST).status({"message" : "User does not exist"});

    res.status(consts.HTTP_OK).send(user);
});

// Create a new User - returns the new User Object
router.post('/create', async (req, res) => {

    let user = new User({ 
        name: req.body.name,
        dateCreated: Date.now(),
        isActive: true
    });

    try{
        user = await saveUserToDB(user);
        console.info(`User ${user._id} was saved to DB`);
    }catch(error){
        console.error(`User ${user._id} was NOT saved to DB`);
    }

    res.status(consts.HTTP_OK).send(user);
});


module.exports = router;