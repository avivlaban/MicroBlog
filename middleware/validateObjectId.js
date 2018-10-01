const mongoose = require('mongoose');

// Make sure an object Id is valid for mongoDB
module.exports = function(req, res, next) {
    if(!mongoose.Types.ObjectId.isValid(req.params.id))
        return res.status(404).send('Invalid ID');

    next();
}