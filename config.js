const env = process.env.NODE_ENV; // 'dev' or 'test'

const dev = {
    app: {
        port: parseInt(process.env.DEV_APP_PORT) || 3000
    },
    db: {
        db: 'mongodb',
        host: process.env.DEV_DB_HOST || 'localhost',
        port: parseInt(process.env.DEV_DB_PORT) || 27017,
        name: process.env.DEV_DB_NAME || 'microblog'
    },
    cache: {
        //connectionString: process.env.CACHE_CONNECTION_STRING
        connectionString: 'redis://admin:ZJPFRNMVAMMNIPXD@aws-us-east-1-portal.14.dblayer.com:16419'
    }
};
const test = {
    app: {
        port: parseInt(process.env.TEST_APP_PORT) || 3000
    },
    db: {
        db: 'mongodb',
        host: process.env.TEST_DB_HOST || 'localhost',
        port: parseInt(process.env.TEST_DB_PORT) || 27017,
        name: process.env.TEST_DB_NAME || 'test'
    },
    cache: {
        //connectionString: process.env.CACHE_CONNECTION_STRING
        connectionString: 'redis://admin:ZJPFRNMVAMMNIPXD@aws-us-east-1-portal.14.dblayer.com:16419'
    }
};
const docker = {
    app: {
        port: parseInt(process.env.TEST_APP_PORT) || 3000
    },
    db: {
        db: 'mongodb',
        host: 'mongodb',
        port: 27017,
        name: 'microblog'
    },
    cache: {
        //connectionString: process.env.CACHE_CONNECTION_STRING
        connectionString: 'redis://admin:ZJPFRNMVAMMNIPXD@aws-us-east-1-portal.14.dblayer.com:16419'
    }
};
const config = {
    dev,
    test,
    docker
};

module.exports = config[env];