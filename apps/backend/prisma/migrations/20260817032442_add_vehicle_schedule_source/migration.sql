-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "scheduleGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "scheduleSource" TEXT DEFAULT 'oem_db';
