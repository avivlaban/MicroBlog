const Joi = require('joi');
const mongoose = require('mongoose');

const regexIdValidationForDB = '/^[0-9a-fA-F]{24}$/';
const Event = mongoose.model('Events', new mongoose.Schema({
    action: {
        type: String,
        enum : ['CREATE','UPDATE', 'UPVOTE', 'DOWNVOTE']
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

function validateCreateEvent(event) {

    const schema = {
        title: Joi.string().min(5).max(50).required(),
        content: Joi.string().min(1).max(1000).required(),
        userId: Joi.string().required()
    };

    return Joi.validate(event, schema);
};

function validateUpdateEvent(event) {

    const schema = {
        title: Joi.string().min(5).max(50).required(),
        content: Joi.string().min(1).max(1000).required(),
        userId: Joi.string().required(),
        postId: Joi.string().min(5).max(50).required()
    };

    return Joi.validate(event, schema);
};

function validateVoteEvent(event) {

    const schema = {
        userId: Joi.string().required(),
        postId: Joi.string().min(5).max(50).required()
    };

    return Joi.validate(event, schema);
};

exports.Event = Event;
exports.validateCreateEvent = validateCreateEvent;
exports.validateUpdateEvent = validateUpdateEvent;
exports.validateVoteEvent = validateVoteEvent;
