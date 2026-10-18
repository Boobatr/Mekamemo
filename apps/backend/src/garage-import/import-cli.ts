import { existsSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';
import { importOvertureGarages } from './overture-import';

/**
 * `npm run import:garages [file]` — runs before the API starts on every deploy.
 * It is a no-op once the dataset's release is loaded, and it never blocks startup:
 * if anything fails the app still boots and the import is retried on the next start.
 */
async function main() {
  const file = process.argv[2] ?? join(process.cwd(), 'prisma', 'data', 'garages-ca.ndjson.gz');
  if (!existsSync(file)) {
    console.log(`No garage data file at ${file} — skipping import.`);
    return;
  }

  const prisma = new PrismaClient();
  try {
    await importOvertureGarages(prisma, file, { log: console.log });
  } catch (err) {
    console.error('Garage import failed (the app will start anyway):', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
