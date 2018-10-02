const winston = require('winston');
const mongoose = require('mongoose');
const config = require('../config');
const DB_ADDRESS = `${config.db.db}://${config.db.host}:${config.db.port}/${config.db.name}`;

const DB_CONNECT_TIMEOUT_IN_SECONDS = 15;
module.exports = function() {
    console.log("DB address: " + DB_ADDRESS);
        mongoose.connect(DB_ADDRESS)
            .then(() => winston.info('Connected to MongoDB...'))
            .catch(function(error) {
                winston.info(`Failed connecting to db.. trying again in ${DB_CONNECT_TIMEOUT_IN_SECONDS} sec..`);
                setTimeout(function() {
                    try{
                        mongoose.connect(DB_ADDRESS);
                        winston.info('Connected to MongoDB...')
                    }catch(error){
                        winston.error('Error: could not connect to DB. ' + error);
                    };
                }, DB_CONNECT_TIMEOUT_IN_SECONDS * 1000);
        });
};