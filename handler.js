const eventHandler = require('./events/eventHandler')


require('./startup/logging')();
require('./startup/db')();


eventHandler.startListening();