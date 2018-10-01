const Joi = require('joi');
const mongoose = require('mongoose');
const {userNameSchema} = require('./user');

// A Post Scheme
const Post = mongoose.model('Posts', new mongoose.Schema({
    title: {
        type: String, 
        requires: true,
        minlength: 0,
        maxlength: 255
    },
    autor: {
      type: userNameSchema,
      required: true
    },
    rank: { 
        type: Number,  
        required: true
    },
    votes: [{upVotes: Array, downVotes: Array, upVotesCount: Number, downVotesCount: Number}],

    dateCreated: { 
        type: Date, 
        required: true
    },
    dateUpdated: { 
        type: Date, 
        required: true
    },
    content: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 1000,
    },
    isProcessed: {
        type: Boolean,
        required: true
    }
  }));

// Validated Post was submitted correctly
function validatePost(post) {
    const schema = {
        title: Joi.string().min(5).max(50).required(),
        content: Joi.string().min(1).max(1000).required()
    };
  
    return Joi.validate(post, schema);
};

  exports.Post = Post; 
  exports.validatePost = validatePost;
