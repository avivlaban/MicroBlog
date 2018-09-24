
const winston = require('winston');
require('winston-mongodb');
require('express-async-errors');

module.exports = function() {
    winston.handleExceptions(
        new winston.transports.Console({colorize: true, prettyPrint: true}),
        new winston.transports.MongoDB({
        db: 'mongodb://localhost/microblog'
    }))

    process.on('unhandledRejection', (ex) => {
        throw (ex);
});

    winston.add(winston.transports.File, { filename: 'logfile.log'});
    winston.add(winston.transports.MongoDB, {
        db: 'mongodb://localhost/microblog',
        level : "error"
    });
}