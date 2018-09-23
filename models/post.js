const Joi = require('joi');
const mongoose = require('mongoose');
const {userNameSchema} = require('./user');

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
    upVotes: { 
      type: Array,  
      required: true
    },
    downVotes: { 
        type: Array,  
        required: true
    },
    upVotesCount: {
        type: Number,
        required: true
    },
    downVotesCount: {
        type: Number,
        required: true
    },
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
    }
  }));

function validatePost(post) {
    const schema = {
        title: Joi.string().min(5).max(50).required(),
        content: Joi.string().min(1).max(1000).required()
    };
  
    return Joi.validate(post, schema);
};

function validateIdFormat(id){
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
        return true;
    }else{
        return false;
    }
}



  exports.Post = Post; 
  exports.validatePost = validatePost;
  exports.validateIdFormat = validateIdFormat;
