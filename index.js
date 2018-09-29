const express = require('express');
const winston = require('winston');
const eventHandler = require('./Events/eventHandler')

const app = express();
require('./startup/logging')();
require('./startup/routes')(app);
require('./startup/db')();
//require('./startup/validation')();

const port = process.env.PORT || 3000;
const startEventHandlerProcess = eventHandler.startListening();

app.listen(port, () => {
  winston.info(`Listening on port ${port}...`);
});



