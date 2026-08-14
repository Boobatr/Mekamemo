/**
 * Example data for the mock-data (pre-backend) build phase — mirrors the
 * design handoff mockup's placeholder content (Task #12 swaps every one of
 * these reads for a real TanStack Query hook against the NestJS API).
 */

export const mockUser = {
  id: 'user-1',
  fullName: 'Marc Lavoie',
  email: 'marc.lavoie@courriel.ca',
  phone: '+1 514 555 0142',
  postalCode: 'H2X 1Y4',
  searchRadiusKm: 15,
  language: 'fr' as const,
  units: 'km' as const,
};

export const mockVehicles = [
  {
    id: 'vehicle-rav4',
    make: 'Toyota',
    model: 'RAV4',
    trim: 'LE',
    year: 2021,
    engine: '2,5 L I4',
    odometerKm: 64200,
    usageType: 'mixed' as const,
    statusLabel: 'VIDANGE DANS 9 J',
    tasksCount: 4,
    photoUrl: null,
  },
  {
    id: 'vehicle-civic',
    make: 'Honda',
    model: 'Civic',
    year: 2018,
    engine: null,
    odometerKm: 128940,
    usageType: 'mixed' as const,
    statusLabel: 'FREINS EN RETARD',
    tasksCount: 6,
    photoUrl: null,
  },
  {
    id: 'vehicle-transit',
    make: 'Ford',
    model: 'Transit',
    year: 2019,
    engine: null,
    odometerKm: 211560,
    usageType: 'highway' as const,
    statusLabel: 'À JOUR',
    tasksCount: 0,
    photoUrl: null,
  },
];

export const mockNextDue = {
  vehicleId: 'vehicle-rav4',
  taskName: 'Vidange',
  vehicleLabel: 'RAV4',
  daysUntilDue: 9,
};

export const mockFleetSummary = {
  vehiclesCount: 3,
  upcoming30d: 4,
  costThisYearCents: 184000,
};

export const mockMaintenanceTasks = [
  {
    id: 'task-oil-change',
    name: "Vidange d'huile + filtre",
    dueDateLabel: '17 AOÛT',
    intervalKm: 8000,
    intervalMonths: 6,
    editedByUser: true,
    userIntervalKm: 7000,
    priority: 'normal' as const,
    costMinCents: 9000,
    costMaxCents: 13000,
    notesForGarage: 'Huile synthétique 0W-20. Vérifier le bruit à la suspension avant droite.',
    groupWithTaskId: 'task-tire-rotation',
    projectedDueKm: 66000,
  },
  {
    id: 'task-tire-rotation',
    name: 'Rotation des pneus',
    dueDateLabel: '17 août',
    groupedWith: "la vidange",
    costMinCents: 4000,
    costMaxCents: 4000,
  },
  {
    id: 'task-cabin-filter',
    name: "Filtre à air d'habitacle",
    dueDateLabel: 'Oct. 2026',
    intervalKm: 72000,
    costMinCents: 5500,
    costMaxCents: 5500,
  },
  {
    id: 'task-brake-inspection',
    name: 'Inspection des freins',
    dueDateLabel: 'Janv. 2027',
    intervalKm: 80000,
    intervalMonths: 24,
    inspectionIncluded: true,
  },
  {
    id: 'task-coolant',
    name: 'Liquide de refroidissement',
    dueDateLabel: 'Mai 2027',
    intervalKm: 96000,
    costMinCents: 14000,
    costMaxCents: 14000,
  },
];

export const mockMileagePace = {
  avgKmPerMonth: 1380,
  readingsCount: 4,
  monthlyBars: [
    { label: 'AVR', km: 1200 },
    { label: 'MAI', km: 1450 },
    { label: 'JUIN', km: 1300 },
    { label: 'JUIL', km: 1500 },
    { label: 'AOÛT', km: 1380 },
    { label: 'SEPT', km: 0 },
  ],
  suggestedReadings: [64900, 65400, 65900],
  projection: {
    taskName: 'Vidange',
    dueKm: 72000,
    dueDateLabel: '12 septembre',
  },
};

export const mockNotifications = [
  {
    id: 'notif-1',
    type: 'maintenance_reminder_due' as const,
    dateLabel: "AUJOURD'HUI · 8:00",
    title: 'Civic 2018 — freins en retard de 3 400 km',
    body: "L'inspection était prévue à 125 500 km. Voulez-vous que je cherche un garage ?",
    actions: ['CHERCHER', 'REPORTER'],
  },
  {
    id: 'notif-2',
    type: 'garage_response' as const,
    dateLabel: 'HIER · 18:30',
    title: 'Garage Précision a répondu',
    body: 'Deux plages proposées pour samedi. À confirmer.',
    actions: [],
  },
  {
    id: 'notif-3',
    type: 'maintenance_reminder_7d' as const,
    dateLabel: '4 AOÛT',
    title: 'RAV4 — vidange dans 14 jours',
    body: 'Rappel automatique à 14 jours avant l’échéance.',
    actions: [],
  },
  {
    id: 'notif-4',
    type: 'maintenance_reminder_due' as const,
    dateLabel: '28 JUILLET',
    title: 'Transit — inspection annuelle faite',
    body: "Ajoutée à l'historique. Facture jointe.",
    actions: [],
  },
];

export const mockBreakdownTags = [
  'sinceWhen',
  'warningLight',
  'onBraking',
  'visibleLeak',
  'odor',
] as const;

export const mockDiagnosis = {
  id: 'diagnosis-1',
  analyzedInSeconds: 4,
  primaryCause: 'Plaquettes de frein avant usées',
  confidence: 'high' as const,
  explanation:
    'Le grincement au freinage et la vibration du volant vont ensemble. Dernier remplacement : 54 800 km, il y a 10 600 km.',
  secondaryCauses: [
    { cause: 'Disques voilés', confidence: 'medium' as const },
    { cause: 'Étrier qui colle', confidence: 'low' as const },
  ],
  recommendedDelay: '2 semaines',
  costMinCents: 25000,
  costMaxCents: 40000,
  safetyNote: 'Vous pouvez rouler, mais évitez les longs trajets et gardez vos distances.',
  disclaimer: 'Estimation indicative : le garage confirme au diagnostic.',
  availableGarages: [
    { id: 'garage-precision', name: 'Garage Précision', distanceKm: 2.1, slotLabel: 'jeu. 14 h' },
    { id: 'garage-rosemont', name: 'Atelier Rosemont', distanceKm: 3.4, slotLabel: 'ven. 9 h' },
  ],
};

export const mockGarages = [
  {
    id: 'garage-precision',
    name: 'Garage Précision',
    neighbourhood: 'Rosemont',
    distanceKm: 2.4,
    rating: 4.8,
    reviewCount: 212,
    priceCents: 9500,
    contactMethod: 'email' as const,
    slotLabel: 'SAM. 9:00',
    certifiedCaa: true,
    openUntil: '18:00',
    waitDays: 2,
    commuteMinutes: 7,
    warrantyMonths: 12,
    services: [
      'Vidange synthétique',
      'Rotation et équilibrage',
      'Freins',
      'Inspection préachat',
      "Pneus d'hiver",
    ],
    email: 'rendezvous@precision.ca',
  },
  {
    id: 'garage-rosemont',
    name: 'Atelier Rosemont',
    neighbourhood: 'Rosemont',
    distanceKm: 3.1,
    rating: 4.6,
    reviewCount: 140,
    priceCents: 8900,
    contactMethod: 'voice' as const,
    slotLabel: 'SAM. 11:30',
  },
  {
    id: 'garage-papineau',
    name: 'Mécanique Papineau',
    neighbourhood: 'Papineau',
    distanceKm: 3.8,
    rating: 4.4,
    reviewCount: 88,
    priceCents: 11000,
    contactMethod: 'email' as const,
    slotLabel: 'LUN. 8:00',
  },
];

export const mockBooking = {
  id: 'booking-1',
  vehicleLabel: 'RAV4 2021',
  taskName: 'Vidange',
  garagesRetainedCount: 5,
  emailsSent: 3,
  voiceCalls: 2,
  responsesReceivedCount: 4,
  lastReceivedMinutesAgo: 12,
  bestOption: {
    garageId: 'garage-precision',
    garageName: 'Garage Précision',
    dateLabel: 'Samedi 15 août · 9:00',
    distanceKm: 2.4,
    commuteMinutes: 7,
    priceCents: 9500,
    durationMinutes: 45,
    confirmedByChannel: 'Courriel',
    cancellationHours: 24,
  },
  otherSlots: [
    { garageId: 'garage-rosemont', garageName: 'Atelier Rosemont', dateLabel: 'sam. 11:30', distanceKm: 3.1, priceCents: 8900 },
    { garageId: 'garage-papineau', garageName: 'Mécanique Papineau', dateLabel: 'lun. 8:00', distanceKm: 3.8, priceCents: 11000 },
  ],
};

export const mockHistory = {
  vehicleLabel: 'TOYOTA RAV4 2021',
  totalThisYearCents: 74200,
  interventionsCount: 6,
  entriesByYear: [
    {
      year: 2026,
      entries: [
        { id: 'h1', name: 'Pneus d’été + équilibrage', dateLabel: '14 avril', mileageKm: 58900, garageName: 'Garage Précision', costCents: 18000 },
        { id: 'h2', name: "Vidange d'huile + filtre", dateLabel: '2 février', mileageKm: 56100, garageName: 'Garage Précision', costCents: 9600 },
        { id: 'h3', name: 'Plaquettes avant', dateLabel: '9 janvier', mileageKm: 54800, garageName: 'Atelier Rosemont', costCents: 31200 },
      ],
    },
    {
      year: 2025,
      entries: [
        { id: 'h4', name: "Pneus d'hiver", dateLabel: '21 novembre', mileageKm: 51200, garageName: null, costCents: 17500 },
        { id: 'h5', name: 'Inspection 50 000 km', dateLabel: '3 août', mileageKm: 49700, garageName: null, costCents: 21000 },
      ],
    },
  ],
};
