import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GEOCODING_PROVIDER, distanceKm } from '../geocoding/geocoding-provider.interface';
import type { GeocodingProvider, GeoPoint } from '../geocoding/geocoding-provider.interface';
import { GARAGE_DISCOVERY } from '../garage-discovery/garage-discovery.interface';
import type { GarageDiscovery } from '../garage-discovery/garage-discovery.interface';
import { pickNearestDistinct } from './distinct-garages';

export interface GarageWithDistance {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  lat: number;
  lng: number;
  rating: number | null;
  reviewCount: number | null;
  specialties: string[];
  email: string | null;
  phone: string | null;
  certifications: string[];
  hours: unknown;
}

/** In a dense city a 50 km radius holds hundreds of garages; the nearest ones are what's useful. */
const MAX_RESULTS = 30;

@Injectable()
export class GaragesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(GEOCODING_PROVIDER) private readonly geocoding: GeocodingProvider,
    @Inject(GARAGE_DISCOVERY) private readonly discovery: GarageDiscovery,
  ) {}

  async searchNearPostalCode(
    postalCode: string,
    radiusKm: number,
    specialtyKeyword?: string,
  ): Promise<{ origin: GeoPoint; results: GarageWithDistance[] }> {
    const origin = await this.geocoding.geocode(postalCode);
    await this.discovery.ensureNear(origin, radiusKm);

    // Cheap bounding box in SQL first, exact distance in memory after.
    const dLat = radiusKm / 111;
    const dLng = radiusKm / (111 * Math.max(Math.cos((origin.lat * Math.PI) / 180), 0.01));
    const garages = await this.prisma.garage.findMany({
      where: {
        lat: { gte: origin.lat - dLat, lte: origin.lat + dLat },
        lng: { gte: origin.lng - dLng, lte: origin.lng + dLng },
        // Sample garages are only for development: hide them once real garages are discovered.
        ...(this.discovery.usesRealGarageData ? { source: { not: 'demo' } } : {}),
      },
    });

    const keyword = specialtyKeyword?.toLowerCase();
    const results = garages
      .map((g) => ({
        id: g.id,
        name: g.name,
        address: g.address,
        distanceKm: Math.round(distanceKm(origin, { lat: g.lat, lng: g.lng }) * 10) / 10,
        lat: g.lat,
        lng: g.lng,
        rating: g.rating,
        reviewCount: g.reviewCount,
        specialties: g.specialties,
        email: g.email,
        phone: g.phone,
        certifications: g.certifications,
        hours: g.hours,
      }))
      .filter((g) => g.distanceKm <= radiusKm)
      // OpenStreetMap rarely lists services: a garage with none listed stays in, since
      // dropping it would hide most real garages from every specialty search.
      .filter((g) => !keyword || g.specialties.length === 0 || g.specialties.some((s) => s.toLowerCase().includes(keyword)))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return { origin, results: pickNearestDistinct(results, MAX_RESULTS) };
  }

  async getById(id: string) {
    const garage = await this.prisma.garage.findUnique({ where: { id } });
    if (!garage) throw new NotFoundException('Garage introuvable.');
    return garage;
  }
}
