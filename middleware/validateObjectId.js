const mongoose = require('mongoose');

/**
 * Make sure an object Id is valid for mongoDB queries
 * @param req
 * @param res
 * @param next
 * @return {*|void}
 */
module.exports = function(req, res, next) {
    //TODO: check if req.params exists.
    if(req.body) {
        if (!mongoose.Types.ObjectId.isValid(req.params.id))
            return res.status(404).send('Invalid ID');
    }else{
        return res.status(404).send('No Data in req.body');
    }

    next();
}