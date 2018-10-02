const Joi = require('joi');
const mongoose = require('mongoose');
const {userNameSchema} = require('./user');

const POST_TITLE_MIN_LENGTH = 5;
const POST_TITLE_MAX_LENGTH = 50;
const POST_CONTENT_MIN_LENGTH = 1;
const POST_CONTENT_MAX_LENGTH = 1000;

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
        title: Joi.string().min(POST_TITLE_MIN_LENGTH).max(POST_TITLE_MAX_LENGTH).required(),
        content: Joi.string().min(POST_CONTENT_MIN_LENGTH).max(POST_CONTENT_MAX_LENGTH).required()
    };
  
    return Joi.validate(post, schema);
};

module.exports.getNewPostObject = function (user, title, content){
    new Post({
        title: title,
        autor: {
            _id: user._id,
            name: user.name
        },
        rank: calculateRank(0, 0, Date.now()),
        votes: [{upVotes: [], downVotes: [], upVotesCount: 0, downVotesCount: 0}],
        dateCreated: Date.now(),
        dateUpdated: Date.now(),
        content: content,
        isProcessed: false
    });
};

module.exports.savePostToDB = async function (post){
    post = await post.save();
    return post;
}

  exports.Post = Post; 
  exports.validatePost = validatePost;
