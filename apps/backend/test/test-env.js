const { connectionUrl } = require('./embedded-db');

process.env.DATABASE_URL = connectionUrl('mekamemo_test');
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '7d';
