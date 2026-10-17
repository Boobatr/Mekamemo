-- Garages imported from OpenStreetMap are identified by (source, externalPlaceId).
-- NULL externalPlaceId values (hand-entered garages) never collide in a Postgres unique index.
CREATE UNIQUE INDEX "garages_source_externalPlaceId_key" ON "garages"("source", "externalPlaceId");

-- Which areas were already fetched, and when.
CREATE TABLE "garage_area_fetches" (
    "cellKey" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "partial" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "garage_area_fetches_pkey" PRIMARY KEY ("cellKey")
);

-- The three sample garages shipped by the seed script are demo data, not real businesses.
-- Re-label (never delete: quote requests and bookings may reference them).
UPDATE "garages" SET "source" = 'demo'
WHERE "source" = 'manual' AND "phone" IN ('+1 514 555 0100', '+1 514 555 0111', '+1 514 555 0122');
