export type Language = 'fr' | 'en';

export interface QuoteMessageInput {
  language: Language;
  fullName: string;
  vehicle: { make: string; model: string; year: number; trim?: string | null; vin?: string | null };
  odometerKm?: number | null;
  /** The maintenance item this request is about (from the user's calendar). */
  task?: {
    name: string;
    description?: string | null;
    notesForGarage?: string | null;
    dueKm?: number | null;
    dueDate?: Date | null;
  } | null;
  /** The breakdown the user reported and the AI's first reading of it. */
  diagnosis?: { description: string; primaryCause?: string | null } | null;
}

const vehicleLabel = (v: QuoteMessageInput['vehicle']) => [v.make, v.model, v.trim, v.year].filter(Boolean).join(' ');

const number = (value: number, language: Language) => value.toLocaleString(language === 'fr' ? 'fr-CA' : 'en-CA');

const date = (value: Date, language: Language) =>
  value.toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** Keeps a line of free text on one line and short: it is quoted inside the message. */
const oneLine = (text: string, max = 500) => text.replace(/\s+/g, ' ').trim().slice(0, max);

const WORDS = {
  fr: {
    greeting: 'Bonjour,',
    intro: (name: string) => `Je m'appelle ${name}.`,
    askTask: 'Pourriez-vous me faire une soumission et me proposer un rendez-vous pour ce qui suit ?',
    askDiagnosis: 'Pourriez-vous examiner mon véhicule et me faire une soumission pour le problème suivant ?',
    askGeneral: (v: string) => `Pourriez-vous me faire une soumission pour l'entretien de mon ${v} ?`,
    vehicle: 'Véhicule',
    mileage: 'Kilométrage',
    task: 'Entretien',
    due: 'Échéance',
    notes: 'Précisions',
    problem: 'Problème signalé',
    cause: 'Cause probable (première analyse)',
    vin: 'NIV',
    reply: 'Merci de me répondre par courriel avec le prix et vos disponibilités.',
    thanks: 'Merci !',
    footer: 'Envoyé avec MekaMemo.',
  },
  en: {
    greeting: 'Hello,',
    intro: (name: string) => `My name is ${name}.`,
    askTask: 'Could you give me a quote and suggest an appointment for the following?',
    askDiagnosis: 'Could you look at my vehicle and give me a quote for the following problem?',
    askGeneral: (v: string) => `Could you give me a quote for servicing my ${v}?`,
    vehicle: 'Vehicle',
    mileage: 'Mileage',
    task: 'Service',
    due: 'Due',
    notes: 'Details',
    problem: 'Reported problem',
    cause: 'Likely cause (first analysis)',
    vin: 'VIN',
    reply: 'Please reply by email with the price and your availability.',
    thanks: 'Thank you!',
    footer: 'Sent with MekaMemo.',
  },
} as const;

/** The email subject: names the service (or problem) and the vehicle, so the garage can tell requests apart. */
export function buildQuoteSubject(input: Pick<QuoteMessageInput, 'language' | 'vehicle' | 'task' | 'diagnosis'>): string {
  const base = input.language === 'fr' ? 'Demande de soumission' : 'Quote request';
  const what = input.task?.name ?? (input.diagnosis ? (input.language === 'fr' ? 'diagnostic' : 'diagnosis') : null);
  return [base, what && oneLine(what, 80), vehicleLabel(input.vehicle)].filter(Boolean).join(' — ');
}

/**
 * The message a quote request sends to a garage. It carries the maintenance item (or the
 * reported breakdown) with the vehicle's details, so the garage can answer with a price and a
 * date without a first round of questions. The user can edit all of it before it is sent.
 */
export function buildQuoteMessage(input: QuoteMessageInput): string {
  const w = WORDS[input.language];
  const { language, vehicle, odometerKm, task, diagnosis } = input;
  const v = vehicleLabel(vehicle);

  if (!task && !diagnosis) {
    return [w.greeting, '', `${w.intro(input.fullName)} ${w.askGeneral(v)}`, '', w.thanks, input.fullName, '', w.footer].join('\n');
  }

  const details: string[] = [`${w.vehicle} : ${v}`];
  if (vehicle.vin) details.push(`${w.vin} : ${vehicle.vin}`);
  if (odometerKm) details.push(`${w.mileage} : ${number(odometerKm, language)} km`);

  if (task) {
    details.push(`${w.task} : ${oneLine(task.name, 120)}`);
    const due = [task.dueDate ? date(task.dueDate, language) : null, task.dueKm ? `${number(task.dueKm, language)} km` : null].filter(Boolean);
    if (due.length) details.push(`${w.due} : ${due.join(' · ')}`);
    if (task.notesForGarage?.trim()) details.push(`${w.notes} : ${oneLine(task.notesForGarage)}`);
  }
  if (diagnosis) {
    details.push(`${w.problem} : ${oneLine(diagnosis.description)}`);
    if (diagnosis.primaryCause?.trim()) details.push(`${w.cause} : ${oneLine(diagnosis.primaryCause, 200)}`);
  }

  return [
    w.greeting,
    '',
    `${w.intro(input.fullName)} ${diagnosis && !task ? w.askDiagnosis : w.askTask}`,
    '',
    ...details,
    '',
    w.reply,
    '',
    w.thanks,
    input.fullName,
    '',
    w.footer,
  ].join('\n');
}
