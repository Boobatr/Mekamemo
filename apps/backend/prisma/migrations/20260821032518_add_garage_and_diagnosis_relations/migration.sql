-- AlterTable
ALTER TABLE "diagnoses" ADD COLUMN     "explanation" TEXT NOT NULL DEFAULT '';

-- AddForeignKey
ALTER TABLE "service_history_entries" ADD CONSTRAINT "service_history_entries_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "garages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
