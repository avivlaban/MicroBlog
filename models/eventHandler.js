const mongoose = require('mongoose');
const Joi = require('joi');

const timeOutForNewPostsCheckInSeconds = 60;

var eventsMap = {};




// Connect to DB and get a pull of events



// For every event we Pharse



//save the pharsed event to currect document in DB







module.exports.startListening = function(){

    // Wake up every X
    setInterval(function() {

        Event.find({}, function(err, events) {

            events.forEach(function(event) {
                eventsMap[user._id] = user;
            });

            res.send(userMap);
        });

    }, timeOutForNewPostsCheckInSeconds * 1000);
}