const {User, validateUser} = require('../models/user');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    // Return the list of all users
    const users = await User.find().sort('-dateCreated');
    res.send(users);
});

router.get('/:userId', async (req, res) => {
    // Return the list of all users
    const user = await User.findById(req.params.userId);
    if(!user) return res.status(400).status("User does not exist")

    res.send(user);
});

router.post('/create', async (req, res) => {
    const { error } = validateUser(req.body); 
    if (error) return res.status(400).send(error.details[0].message);

    let user = new User({ 
        name: req.body.name,
        dateCreated: Date.now(),
        isActive: true
    });
    user = await user.save();

    res.send(user);
});


module.exports = router;