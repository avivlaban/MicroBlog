const redis = require("redis");
const config = require('../config');
let connectionString = config.cache.connectionString;
var client = null;

module.exports.getRedisClient = function(){
    // caching
    if (connectionString === undefined) {
        winsron.error("Please set the COMPOSE_REDIS_URL environment variable");
    }

    if (connectionString.startsWith("rediss://")) {
        client = redis.createClient(connectionString, {
            tls: { servername: new URL(connectionString).hostname }
        });
    } else {
        client = redis.createClient(connectionString);
    }

    return client;
}
