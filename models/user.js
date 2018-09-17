const Joi = require('joi');
const mongoose = require('mongoose');

const User = mongoose.model('Users', new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true, 
    minlength: 5,
    maxlength: 255
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

function validateUser(user) {
  const schema = {
    name: Joi.string().min(3).max(50).required()
  };

  return Joi.validate(user, schema);
}

exports.User = User; 
exports.validateUser = validateUser;