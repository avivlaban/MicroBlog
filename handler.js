const eventHandler = require('./Events/eventHandler')


require('./startup/logging')();
require('./startup/db')();


eventHandler.startListening();