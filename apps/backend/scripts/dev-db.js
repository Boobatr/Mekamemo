const { execSync } = require('child_process');
const { ensureDatabase, stopEmbeddedPostgres } = require('../test/embedded-db');

const command = process.argv[2];

async function main() {
  const databaseUrl = await ensureDatabase('mekamemo');
  console.log('Dev database ready at', databaseUrl);

  if (command === 'migrate') {
    execSync(`npx prisma migrate dev --name ${process.argv[3] || 'update'}`, {
      cwd: __dirname + '/..',
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'inherit',
    });
    await stopEmbeddedPostgres();
    return;
  }

  if (command === 'stop') {
    await stopEmbeddedPostgres();
    return;
  }

  // 'start' (default): leave the server running for the caller (e.g. `npm run start:dev`).
  console.log('Postgres is running. Press Ctrl+C to stop.');
  process.on('SIGINT', async () => {
    await stopEmbeddedPostgres();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
