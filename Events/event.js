const Joi = require('joi');
const mongoose = require('mongoose');
// Event Title
const EVENT_TITLE_MIN_LENGTH = 5;
const EVENT_TITLE_MAX_LENGTH = 50;
// Event Content
const EVENT_CONTENT_MIN_LENGTH = 1;
const EVENT_CONTENT_MAX_LENGTH = 1000;
// Event User Id
const EVENT_USER_ID_MIN_LENGTH = 5;
const EVENT_USER_ID_MAX_LENGTH = 50;
// Event Post Id
const EVENT_POST_ID_MIN_LENGTH = 5;
const EVENT_POST_ID_MAX_LENGTH = 50;

/**
 * Instance of Event scheme is DB
 * @type {Model} - Event Model in DB
 */
const Event = mongoose.model('Events', new mongoose.Schema({
    action: {
        type: Number,
        requires: true
    },
    eventBody: {
        type: Array,
        requires: true
    },
    dateCreated: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        required: true
    }
}));

/**
 * Validates Event with Action Type of CREATE
 * @param event to verify
 * @return Joi validation object
 */
function validateCreateEvent(event) {

    const schema = {
        title: Joi.string().min(EVENT_TITLE_MIN_LENGTH).max(EVENT_TITLE_MAX_LENGTH).required(),
        content: Joi.string().min(EVENT_CONTENT_MIN_LENGTH).max(EVENT_CONTENT_MAX_LENGTH).required(),
        userId: Joi.string().min(5).max(50).required()
    };

    return Joi.validate(event, schema);
};

/**
 * Validates Event with Action Type of UPDATE was submitted correctly
 * @param event to verify
 * @return Joi validation object
 */
function validateUpdateEvent(event) {

    const schema = {
        title: Joi.string().min(EVENT_TITLE_MIN_LENGTH).max(EVENT_TITLE_MAX_LENGTH).required(),
        content: Joi.string().min(EVENT_CONTENT_MIN_LENGTH).max(EVENT_CONTENT_MAX_LENGTH).required(),
        userId: Joi.string().min(EVENT_USER_ID_MIN_LENGTH).max(EVENT_USER_ID_MAX_LENGTH).required(),
        postId: Joi.string().min(EVENT_POST_ID_MIN_LENGTH).max(EVENT_POST_ID_MAX_LENGTH).required()
    };

    return Joi.validate(event, schema);
};

/**
 * Validates Event with Action Type of UPVOTE or DOWNVOTE
 * @param event to verify
 * @return Joi validation object
 */
function validateVoteEvent(event) {

    const schema = {
        userId: Joi.string().min(EVENT_USER_ID_MIN_LENGTH).max(EVENT_USER_ID_MAX_LENGTH).required(),
        postId: Joi.string().min(EVENT_POST_ID_MIN_LENGTH).max(EVENT_POST_ID_MAX_LENGTH).required()
    };

    return Joi.validate(event, schema);
};

/**
 * Save an Event Schema to DB
 * @param event to save
 * @return the event saved as returned from DB
 */
module.exports.saveEventToDB = async function (event){
    event = await event.save();
    return event;
}

exports.Event = Event;
exports.validateCreateEvent = validateCreateEvent;
exports.validateUpdateEvent = validateUpdateEvent;
exports.validateVoteEvent = validateVoteEvent;
