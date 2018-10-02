const Joi = require('joi');
const mongoose = require('mongoose');

const USER_NAME_MIN_LENGTH = 3;
const USER_NAME_MAX_LENGTH = 50;

/**
 * Instance of User scheme is DB
 * @type {Model} - User Model in DB
 */
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

/**
 * Validates User was submitted correctly
 * @param user
 * @return {*}
 */
function validateUser(user) {
  const schema = {
    name: Joi.string().min(USER_NAME_MIN_LENGTH).max(USER_NAME_MAX_LENGTH).required()
  };

  return Joi.validate(user, schema);
}

/**
 * Save a User Schema to DB
 * @param user
 * @return the user saved as returned from DB
 */
module.exports.saveUserToDB = async function (user){
    user = await user.save();
    return user;
}

exports.userSchema = userSchema;
exports.userNameSchema = userNameSchema;
exports.User = User; 
exports.validateUser = validateUser;