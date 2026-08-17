/** Shared garage fixtures — used by both the e2e global-setup and the dev seed script. */
const GARAGES = [
  {
    name: 'Garage Précision',
    address: '1234 Rue Masson, Montréal, QC',
    lat: 45.5372,
    lng: -73.5745,
    phone: '+1 514 555 0100',
    email: 'rendezvous@precision.ca',
    specialties: ['Vidange synthétique', 'Rotation et équilibrage', 'Freins', 'Inspection préachat', "Pneus d'hiver"],
    rating: 4.8,
    reviewCount: 212,
    certifications: ['CAA'],
  },
  {
    name: 'Atelier Rosemont',
    address: '5678 Rue Beaubien, Montréal, QC',
    lat: 45.5548,
    lng: -73.5817,
    phone: '+1 514 555 0111',
    email: null,
    specialties: ['Vidange', 'Freins', 'Suspension'],
    rating: 4.6,
    reviewCount: 140,
    certifications: [],
  },
  {
    name: 'Mécanique Papineau',
    address: '910 Avenue Papineau, Montréal, QC',
    lat: 45.5276,
    lng: -73.5556,
    phone: '+1 514 555 0122',
    email: 'info@mecaniquepapineau.ca',
    specialties: ['Vidange', 'Diagnostic', 'Climatisation', 'Transmission'],
    rating: 4.4,
    reviewCount: 88,
    certifications: [],
  },
];

async function seedGarages(prisma) {
  const existingCount = await prisma.garage.count();
  if (existingCount > 0) return;

  for (const garage of GARAGES) {
    await prisma.garage.create({ data: garage });
  }
}

module.exports = { seedGarages, GARAGES };
