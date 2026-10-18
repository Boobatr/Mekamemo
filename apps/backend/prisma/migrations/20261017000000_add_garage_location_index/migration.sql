-- Every garage search starts with a latitude/longitude bounding box; the table is about to hold
-- tens of thousands of garages.
CREATE INDEX "garages_lat_lng_idx" ON "garages"("lat", "lng");
