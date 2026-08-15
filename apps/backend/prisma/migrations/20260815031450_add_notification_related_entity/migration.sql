-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "relatedEntityId" TEXT;

-- CreateIndex
CREATE INDEX "notifications_type_relatedEntityId_idx" ON "notifications"("type", "relatedEntityId");
