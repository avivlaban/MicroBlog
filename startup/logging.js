const config = require('../config');
const winston = require('winston');
require('winston-mongodb');
require('express-async-errors');

module.exports = function() {
    winston.handleExceptions(
        new winston.transports.Console({colorize: true, prettyPrint: true}),
        new winston.transports.MongoDB({
        db: `${config.db.db}://${config.db.host}/${config.db.name}`
     })
    )

    process.on('unhandledRejection', (ex) => {
        throw (ex);
});

    winston.add(winston.transports.File, { filename: './logs/logfile.log'});
    winston.add(winston.transports.MongoDB, {
        db: `${config.db.db}://${config.db.host}/${config.db.name}`,
        level : "info"
    });
}