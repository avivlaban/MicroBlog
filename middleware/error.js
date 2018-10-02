const winston = require('winston');

/**
 * Error middleware
 * @param err
 * @param req
 * @param res
 * @param next
 */
module.exports = function(err, req, res, next){
    winston.error(err.message, err);
    res.status(500).send({"error" : "Something went wrong, porbably a Feature ;)"});
}