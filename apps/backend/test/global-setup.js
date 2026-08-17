const { execSync } = require('child_process');
const { ensureDatabase } = require('./embedded-db');
const { seedGarages } = require('../prisma/seed-garages');

const TEST_DB_NAME = 'mekamemo_test';

module.exports = async function globalSetup() {
  const databaseUrl = await ensureDatabase(TEST_DB_NAME);
  process.env.DATABASE_URL = databaseUrl;

  execSync('npx prisma migrate deploy', {
    cwd: __dirname + '/..',
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  await seedGarages(prisma);
  await prisma.$disconnect();
};
