const path = require('path');

const DATA_DIR = path.resolve(__dirname, '..', '..', '..', '.pgdata');
const PORT = 54322;
const USER = 'mekamemo';
const PASSWORD = 'mekamemo';

let instance = null;

function connectionUrl(databaseName) {
  return `postgresql://${USER}:${PASSWORD}@127.0.0.1:${PORT}/${databaseName}?schema=public`;
}

/** Starts (or reuses) a single persistent embedded Postgres for local dev/test — no Docker required. */
async function startEmbeddedPostgres() {
  if (instance) return instance;
  const { default: EmbeddedPostgres } = await import('embedded-postgres');
  instance = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: USER,
    password: PASSWORD,
    port: PORT,
    persistent: true,
  });

  const fs = require('fs');
  const isFirstRun = !fs.existsSync(path.join(DATA_DIR, 'PG_VERSION'));
  if (isFirstRun) {
    await instance.initialise();
  }
  await instance.start();
  return instance;
}

async function ensureDatabase(databaseName) {
  const pg = await startEmbeddedPostgres();
  try {
    await pg.createDatabase(databaseName);
  } catch (err) {
    if (!/already exists/i.test(String(err))) throw err;
  }
  return connectionUrl(databaseName);
}

async function stopEmbeddedPostgres() {
  if (!instance) return;
  await instance.stop();
  instance = null;
}

module.exports = { startEmbeddedPostgres, ensureDatabase, stopEmbeddedPostgres, connectionUrl, PORT };
