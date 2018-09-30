const winston = require('winston');
const mongoose = require('mongoose');
const config = require('../config');

module.exports = function() {
    mongoose.connect(`mongodb://${config.db.host}/${config.db.name}`)
        .then(() => winston.info('Connected to MongoDB...'))
        .catch(function(error) {
            winston.error('Error: could not connecnt to DB. ' + error);
    });
}