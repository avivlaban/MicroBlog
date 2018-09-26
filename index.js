const express = require('express');
const winston = require('winston');
const topPosts = require('./topPosts');

const app = express();
require('./startup/logging')();
require('./startup/routes')(app);
require('./startup/db')();
//require('./startup/validation')();

const port = process.env.PORT || 3000;
const loadTopPostsFromDb = async () =>
{
    return await topPosts.init();
}

loadTopPostsFromDb().then(() => {
        app.listen(port, () => {
          winston.info(`Listening on port ${port}...`);
        });
});


