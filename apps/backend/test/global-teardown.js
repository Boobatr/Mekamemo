const { stopEmbeddedPostgres } = require('./embedded-db');

module.exports = async function globalTeardown() {
  await stopEmbeddedPostgres();
};
