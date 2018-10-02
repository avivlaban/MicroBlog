const express = require('express');
const winston = require('winston');
const config = require('./config')

const app = express();
require('./startup/logging')();
require('./startup/routes')(app);
require('./startup/db')();


const server = app.listen(config.app.port, () => {
  winston.info(`Listening on port ${config.app.port}...`);
});

module.exports = server;
