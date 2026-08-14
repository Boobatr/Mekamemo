import { z } from 'zod';
import {
  AttachmentTypeSchema,
  BookingStatusSchema,
  ConfidenceSchema,
  ContactMethodSchema,
  LanguageSchema,
  MileageSourceSchema,
  PlanSchema,
  QuoteRequestStatusSchema,
  TaskPrioritySchema,
  TaskStatusSchema,
  UnitsSchema,
  UsageTypeSchema,
} from './enums';

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  phone: z.string().min(1),
  fullName: z.string().min(1),
  postalCode: z.string().min(1),
  searchRadiusKm: z.number().int().positive(),
  language: LanguageSchema,
  units: UnitsSchema,
  autoContactGarages: z.boolean(),
  voiceFallbackEnabled: z.boolean(),
  confirmBeforeBooking: z.literal(true),
  createdAt: z.string().datetime(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const CreateUserProfileSchema = UserProfileSchema.omit({
  id: true,
  createdAt: true,
  confirmBeforeBooking: true,
});
export type CreateUserProfileInput = z.infer<typeof CreateUserProfileSchema>;

export const VehicleSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  vin: z.string().length(17).nullable(),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1980).max(2100),
  engine: z.string().nullable(),
  trim: z.string().nullable(),
  usageType: UsageTypeSchema,
  photoUrl: z.string().url().nullable(),
  createdAt: z.string().datetime(),
});
export type Vehicle = z.infer<typeof VehicleSchema>;

export const CreateVehicleFromVinSchema = z.object({
  userId: z.string().uuid(),
  vin: z.string().length(17),
  odometerKm: z.number().int().nonnegative(),
  usageType: UsageTypeSchema.default('mixed'),
});
export type CreateVehicleFromVinInput = z.infer<typeof CreateVehicleFromVinSchema>;

export const CreateVehicleManualSchema = z.object({
  userId: z.string().uuid(),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1980).max(2100),
  odometerKm: z.number().int().nonnegative(),
  usageType: UsageTypeSchema.default('mixed'),
});
export type CreateVehicleManualInput = z.infer<typeof CreateVehicleManualSchema>;

export const MaintenanceTaskSchema = z.object({
  id: z.string().uuid(),
  vehicleId: z.string().uuid(),
  templateTaskId: z.string().uuid().nullable(),
  name: z.string().min(1),
  description: z.string().nullable(),
  intervalKm: z.number().int().positive().nullable(),
  intervalMonths: z.number().int().positive().nullable(),
  priority: TaskPrioritySchema,
  isRecurring: z.boolean(),
  editedByUser: z.boolean(),
  notesForGarage: z.string().nullable(),
  groupWithTaskId: z.string().uuid().nullable(),
  status: TaskStatusSchema,
  estimatedCostMinCents: z.number().int().nonnegative().nullable(),
  estimatedCostMaxCents: z.number().int().nonnegative().nullable(),
});
export type MaintenanceTask = z.infer<typeof MaintenanceTaskSchema>;

export const MileageReadingSchema = z.object({
  id: z.string().uuid(),
  vehicleId: z.string().uuid(),
  valueKm: z.number().int().nonnegative(),
  source: MileageSourceSchema,
  recordedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});
export type MileageReading = z.infer<typeof MileageReadingSchema>;

export const CreateMileageReadingSchema = z.object({
  vehicleId: z.string().uuid(),
  valueKm: z.number().int().nonnegative(),
  source: MileageSourceSchema,
  recordedAt: z.string().datetime().optional(),
});
export type CreateMileageReadingInput = z.infer<typeof CreateMileageReadingSchema>;

export const TaskProjectionSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  projectedDueDate: z.string().datetime().nullable(),
  projectedDueKm: z.number().int().nonnegative().nullable(),
  avgKmPerMonthUsed: z.number().nonnegative().nullable(),
  lastRecalculatedAt: z.string().datetime(),
});
export type TaskProjection = z.infer<typeof TaskProjectionSchema>;

export const BreakdownReportSchema = z.object({
  id: z.string().uuid(),
  vehicleId: z.string().uuid(),
  descriptionText: z.string().min(1),
  tags: z.array(z.string()),
  urgent: z.boolean(),
  createdAt: z.string().datetime(),
});
export type BreakdownReport = z.infer<typeof BreakdownReportSchema>;

export const CreateBreakdownReportSchema = z.object({
  vehicleId: z.string().uuid(),
  descriptionText: z.string().min(1),
  tags: z.array(z.string()).default([]),
  urgent: z.boolean().default(false),
  attachmentIds: z.array(z.string().uuid()).default([]),
});
export type CreateBreakdownReportInput = z.infer<typeof CreateBreakdownReportSchema>;

export const AttachmentSchema = z.object({
  id: z.string().uuid(),
  ownerType: z.enum(['breakdown_report', 'vehicle', 'invoice']),
  ownerId: z.string().uuid(),
  type: AttachmentTypeSchema,
  url: z.string().url(),
  transcribedText: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type Attachment = z.infer<typeof AttachmentSchema>;

export const DiagnosisSchema = z.object({
  id: z.string().uuid(),
  reportId: z.string().uuid(),
  primaryCause: z.string().min(1),
  confidence: ConfidenceSchema,
  secondaryCauses: z.array(
    z.object({ cause: z.string().min(1), confidence: ConfidenceSchema }),
  ),
  recommendedDelay: z.string().min(1),
  costMinCents: z.number().int().nonnegative(),
  costMaxCents: z.number().int().nonnegative(),
  safetyNote: z.string().min(1),
  disclaimer: z.string().min(1),
  modelVersion: z.string().min(1),
  createdAt: z.string().datetime(),
});
export type Diagnosis = z.infer<typeof DiagnosisSchema>;

export const GarageSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  address: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  specialties: z.array(z.string()),
  rating: z.number().min(0).max(5).nullable(),
  reviewCount: z.number().int().nonnegative().nullable(),
  certifications: z.array(z.string()),
});
export type Garage = z.infer<typeof GarageSchema>;

export const QuoteRequestSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  taskId: z.string().uuid().nullable(),
  diagnosisId: z.string().uuid().nullable(),
  status: QuoteRequestStatusSchema,
  createdAt: z.string().datetime(),
});
export type QuoteRequest = z.infer<typeof QuoteRequestSchema>;

export const QuoteRequestGarageSchema = z.object({
  id: z.string().uuid(),
  quoteRequestId: z.string().uuid(),
  garageId: z.string().uuid(),
  contactMethod: ContactMethodSchema,
  sentAt: z.string().datetime().nullable(),
  messageContent: z.string().nullable(),
  language: LanguageSchema,
});
export type QuoteRequestGarage = z.infer<typeof QuoteRequestGarageSchema>;

export const GarageResponseSchema = z.object({
  id: z.string().uuid(),
  quoteRequestGarageId: z.string().uuid(),
  rawContent: z.string(),
  parsedSlots: z.array(z.object({ startsAt: z.string().datetime(), priceCents: z.number().int().nonnegative().nullable() })),
  priceCents: z.number().int().nonnegative().nullable(),
  receivedAt: z.string().datetime(),
  channel: z.enum(['email', 'voice_transcript']),
});
export type GarageResponse = z.infer<typeof GarageResponseSchema>;

export const BookingSchema = z.object({
  id: z.string().uuid(),
  quoteRequestId: z.string().uuid(),
  garageId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  confirmedSlotAt: z.string().datetime(),
  priceCents: z.number().int().nonnegative(),
  durationMinutes: z.number().int().positive(),
  status: BookingStatusSchema,
  confirmedByUserAt: z.string().datetime().nullable(),
  cancellationDeadlineAt: z.string().datetime().nullable(),
});
export type Booking = z.infer<typeof BookingSchema>;

/** A booking may only ever leave `pending_user_confirmation` via an explicit user action — never a scheduled job. */
export const ConfirmBookingSchema = z.object({
  bookingId: z.string().uuid(),
  confirmedByUserId: z.string().uuid(),
});
export type ConfirmBookingInput = z.infer<typeof ConfirmBookingSchema>;

export const ServiceHistoryEntrySchema = z.object({
  id: z.string().uuid(),
  vehicleId: z.string().uuid(),
  taskName: z.string().min(1),
  performedAt: z.string().datetime(),
  mileageAtServiceKm: z.number().int().nonnegative(),
  garageId: z.string().uuid().nullable(),
  costCents: z.number().int().nonnegative(),
  invoiceIds: z.array(z.string().uuid()),
});
export type ServiceHistoryEntry = z.infer<typeof ServiceHistoryEntrySchema>;

export const SubscriptionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  plan: PlanSchema,
  store: z.enum(['apple', 'google']).nullable(),
  revenueCatCustomerId: z.string().nullable(),
  status: z.enum(['active', 'expired', 'trialing', 'none']),
  currentPeriodEnd: z.string().datetime().nullable(),
});
export type Subscription = z.infer<typeof SubscriptionSchema>;
