const express = require('express');
const winston = require('winston');
const topPosts = require('./topPosts');

const app = express();
require('./startup/logging')();
require('./startup/routes')(app);
require('./startup/db')();
//require('./startup/validation')();

// const p = Promise.reject(new Error('Calling an error!'));
// p.then(() => console.log('Done'));
//throw new Error('Testing Errors !');

const port = process.env.PORT || 3000;
const test = async () =>
{
    return await topPosts.init();
}

test().then(() => {
        app.listen(port, () => {
          winston.info(`Listening on port ${port}...`);
        });
});


