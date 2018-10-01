const Joi = require('joi');
const mongoose = require('mongoose');

// A User Scheme
const userSchema = new mongoose.Schema({
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
  });

  const userNameSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true, 
        minlength: 5,
        maxlength: 255
      }
  });

const User = mongoose.model('Users', userSchema);

// Validates User was submitted correctly
function validateUser(user) {
  const schema = {
    name: Joi.string().min(3).max(50).required()
  };

  return Joi.validate(user, schema);
}
exports.userSchema = userSchema;
exports.userNameSchema = userNameSchema;
exports.User = User; 
exports.validateUser = validateUser;