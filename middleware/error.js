const winston = require('winston');

module.exports = function(err, req, res, next){
    winston.error(err.message, err);
    res.status(500).send({"error" : "Something went wrong, porbably a Feature ;)"});
}