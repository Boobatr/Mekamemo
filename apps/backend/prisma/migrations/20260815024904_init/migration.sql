-- CreateEnum
CREATE TYPE "Language" AS ENUM ('fr', 'en');

-- CreateEnum
CREATE TYPE "Units" AS ENUM ('km', 'mi');

-- CreateEnum
CREATE TYPE "UsageType" AS ENUM ('city', 'highway', 'mixed');

-- CreateEnum
CREATE TYPE "MileageSource" AS ENUM ('manual', 'ocr', 'estimate_tap', 'gps');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('low', 'normal', 'critical');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('upcoming', 'done', 'skipped', 'overdue');

-- CreateEnum
CREATE TYPE "Confidence" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('photo', 'video', 'audio', 'invoice');

-- CreateEnum
CREATE TYPE "AttachmentOwnerType" AS ENUM ('breakdown_report', 'vehicle', 'invoice');

-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('email', 'voice');

-- CreateEnum
CREATE TYPE "QuoteRequestStatus" AS ENUM ('draft', 'sent', 'responded', 'confirmed', 'cancelled');

-- CreateEnum
CREATE TYPE "GarageResponseChannel" AS ENUM ('email', 'voice_transcript');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending_user_confirmation', 'confirmed', 'cancelled');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('mileage_prompt', 'maintenance_reminder_7d', 'maintenance_reminder_due', 'garage_response');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('free', 'mekamemo_plus');

-- CreateEnum
CREATE TYPE "Store" AS ENUM ('apple', 'google');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'expired', 'trialing', 'none');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "searchRadiusKm" INTEGER NOT NULL DEFAULT 15,
    "language" "Language" NOT NULL DEFAULT 'fr',
    "units" "Units" NOT NULL DEFAULT 'km',
    "autoContactGarages" BOOLEAN NOT NULL DEFAULT true,
    "voiceFallbackEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'free',
    "store" "Store",
    "revenueCatCustomerId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'none',
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vin" TEXT,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trim" TEXT,
    "year" INTEGER NOT NULL,
    "engine" TEXT,
    "usageType" "UsageType" NOT NULL DEFAULT 'mixed',
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_schedule_templates" (
    "id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "yearRangeStart" INTEGER NOT NULL,
    "yearRangeEnd" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'oem_db',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_schedule_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_task_template_items" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "intervalKm" INTEGER,
    "intervalMonths" INTEGER,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "estimatedCostMinCents" INTEGER,
    "estimatedCostMaxCents" INTEGER,

    CONSTRAINT "maintenance_task_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_tasks" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "templateTaskId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "intervalKm" INTEGER,
    "intervalMonths" INTEGER,
    "priority" "TaskPriority" NOT NULL DEFAULT 'normal',
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "editedByUser" BOOLEAN NOT NULL DEFAULT false,
    "notesForGarage" TEXT,
    "groupWithTaskId" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'upcoming',
    "estimatedCostMinCents" INTEGER,
    "estimatedCostMaxCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mileage_readings" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "valueKm" INTEGER NOT NULL,
    "source" "MileageSource" NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mileage_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_projections" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "projectedDueDate" TIMESTAMP(3),
    "projectedDueKm" INTEGER,
    "avgKmPerMonthUsed" DOUBLE PRECISION,
    "lastRecalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_projections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "type" "NotificationType" NOT NULL,
    "payload" JSONB NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "locale" "Language" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "breakdown_reports" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "descriptionText" TEXT NOT NULL,
    "tags" TEXT[],
    "urgent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "breakdown_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "ownerType" "AttachmentOwnerType" NOT NULL,
    "breakdownReportId" TEXT,
    "type" "AttachmentType" NOT NULL,
    "url" TEXT NOT NULL,
    "transcribedText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnoses" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "primaryCause" TEXT NOT NULL,
    "confidence" "Confidence" NOT NULL,
    "secondaryCauses" JSONB NOT NULL,
    "recommendedDelay" TEXT NOT NULL,
    "costMinCents" INTEGER NOT NULL,
    "costMaxCents" INTEGER NOT NULL,
    "safetyNote" TEXT NOT NULL,
    "disclaimer" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "specialties" TEXT[],
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "hours" JSONB,
    "certifications" TEXT[],
    "source" TEXT NOT NULL DEFAULT 'manual',
    "externalPlaceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "garages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "taskId" TEXT,
    "diagnosisId" TEXT,
    "status" "QuoteRequestStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_request_garages" (
    "id" TEXT NOT NULL,
    "quoteRequestId" TEXT NOT NULL,
    "garageId" TEXT NOT NULL,
    "contactMethod" "ContactMethod" NOT NULL,
    "sentAt" TIMESTAMP(3),
    "messageContent" TEXT,
    "language" "Language" NOT NULL,

    CONSTRAINT "quote_request_garages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garage_responses" (
    "id" TEXT NOT NULL,
    "quoteRequestGarageId" TEXT NOT NULL,
    "rawContent" TEXT NOT NULL,
    "parsedSlots" JSONB NOT NULL,
    "priceCents" INTEGER,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "channel" "GarageResponseChannel" NOT NULL,

    CONSTRAINT "garage_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "quoteRequestId" TEXT NOT NULL,
    "garageId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "confirmedSlotAt" TIMESTAMP(3) NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending_user_confirmation',
    "confirmedByUserId" TEXT,
    "confirmedByUserAt" TIMESTAMP(3),
    "cancellationDeadlineAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_history_entries" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "mileageAtServiceKm" INTEGER NOT NULL,
    "garageId" TEXT,
    "costCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_history_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "serviceHistoryEntryId" TEXT,
    "fileUrl" TEXT NOT NULL,
    "ocrExtracted" JSONB,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "vehicles_userId_idx" ON "vehicles"("userId");

-- CreateIndex
CREATE INDEX "maintenance_schedule_templates_make_model_idx" ON "maintenance_schedule_templates"("make", "model");

-- CreateIndex
CREATE INDEX "maintenance_tasks_vehicleId_idx" ON "maintenance_tasks"("vehicleId");

-- CreateIndex
CREATE INDEX "mileage_readings_vehicleId_recordedAt_idx" ON "mileage_readings"("vehicleId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "task_projections_taskId_key" ON "task_projections"("taskId");

-- CreateIndex
CREATE INDEX "notifications_userId_scheduledFor_idx" ON "notifications"("userId", "scheduledFor");

-- CreateIndex
CREATE INDEX "attachments_breakdownReportId_idx" ON "attachments"("breakdownReportId");

-- CreateIndex
CREATE UNIQUE INDEX "diagnoses_reportId_key" ON "diagnoses"("reportId");

-- CreateIndex
CREATE INDEX "quote_request_garages_quoteRequestId_idx" ON "quote_request_garages"("quoteRequestId");

-- CreateIndex
CREATE INDEX "service_history_entries_vehicleId_idx" ON "service_history_entries"("vehicleId");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_task_template_items" ADD CONSTRAINT "maintenance_task_template_items_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "maintenance_schedule_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_tasks" ADD CONSTRAINT "maintenance_tasks_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mileage_readings" ADD CONSTRAINT "mileage_readings_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_projections" ADD CONSTRAINT "task_projections_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "maintenance_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "breakdown_reports" ADD CONSTRAINT "breakdown_reports_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_breakdownReportId_fkey" FOREIGN KEY ("breakdownReportId") REFERENCES "breakdown_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "breakdown_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_request_garages" ADD CONSTRAINT "quote_request_garages_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "quote_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_request_garages" ADD CONSTRAINT "quote_request_garages_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "garages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garage_responses" ADD CONSTRAINT "garage_responses_quoteRequestGarageId_fkey" FOREIGN KEY ("quoteRequestGarageId") REFERENCES "quote_request_garages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "quote_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "garages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_history_entries" ADD CONSTRAINT "service_history_entries_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_serviceHistoryEntryId_fkey" FOREIGN KEY ("serviceHistoryEntryId") REFERENCES "service_history_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
