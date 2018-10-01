const redis = require("redis");
const config = require('../config');
const winston = require('winston');
let connectionString = process.env.CACHE_CONNECTION_STRING || config.cache.connectionString;
var client = null;

module.exports.getRedisClient = function(){

    if (connectionString === undefined) {
        winston.error("Please set the COMPOSE_REDIS_URL environment variable");
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
