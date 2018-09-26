const redis = require("redis");
let connectionString = "redis://admin:ZJPFRNMVAMMNIPXD@aws-us-east-1-portal.14.dblayer.com:16419";
var client = null;

module.exports.getRedisClient = function(){
    // caching
    if (connectionString === undefined) {
        winsron.error("Please set the COMPOSE_REDIS_URL environment variable");
        process.exit(1);
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
