const { PrismaClient } = require('@prisma/client');
const { seedGarages } = require('./seed-garages');

(async () => {
  const prisma = new PrismaClient();
  await seedGarages(prisma);
  await prisma.$disconnect();
  console.log('Seeded reference data (garages).');
})();
