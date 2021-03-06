const express = require('express');
const error = require('../middleware/error');
const posts = require('../routes/posts');
const users = require('../routes/users');

module.exports = function(app) {
    app.use(express.json());
    app.use('/api/posts', posts);
    app.use('/api/users', users);
    app.use(error);
}