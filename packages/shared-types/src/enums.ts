import { z } from 'zod';

export const LanguageSchema = z.enum(['fr', 'en']);
export type Language = z.infer<typeof LanguageSchema>;

export const UnitsSchema = z.enum(['km', 'mi']);
export type Units = z.infer<typeof UnitsSchema>;

export const MileageSourceSchema = z.enum(['manual', 'ocr', 'estimate_tap', 'gps']);
export type MileageSource = z.infer<typeof MileageSourceSchema>;

export const TaskPrioritySchema = z.enum(['low', 'normal', 'critical']);
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;

export const TaskStatusSchema = z.enum(['upcoming', 'done', 'skipped', 'overdue']);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const ConfidenceSchema = z.enum(['low', 'medium', 'high']);
export type Confidence = z.infer<typeof ConfidenceSchema>;

export const AttachmentTypeSchema = z.enum(['photo', 'video', 'audio', 'invoice']);
export type AttachmentType = z.infer<typeof AttachmentTypeSchema>;

export const ContactMethodSchema = z.enum(['email', 'voice']);
export type ContactMethod = z.infer<typeof ContactMethodSchema>;

export const QuoteRequestStatusSchema = z.enum([
  'draft',
  'sent',
  'responded',
  'confirmed',
  'cancelled',
]);
export type QuoteRequestStatus = z.infer<typeof QuoteRequestStatusSchema>;

export const BookingStatusSchema = z.enum([
  'pending_user_confirmation',
  'confirmed',
  'cancelled',
]);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

export const NotificationTypeSchema = z.enum([
  'mileage_prompt',
  'maintenance_reminder_7d',
  'maintenance_reminder_due',
  'garage_response',
]);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const PlanSchema = z.enum(['free', 'mekamemo_plus']);
export type Plan = z.infer<typeof PlanSchema>;

export const UsageTypeSchema = z.enum(['city', 'highway', 'mixed']);
export type UsageType = z.infer<typeof UsageTypeSchema>;
