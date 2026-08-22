import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GEOCODING_PROVIDER, distanceKm } from '../geocoding/geocoding-provider.interface';
import type { GeocodingProvider, GeoPoint } from '../geocoding/geocoding-provider.interface';

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

@Injectable()
export class GaragesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(GEOCODING_PROVIDER) private readonly geocoding: GeocodingProvider,
  ) {}

  async searchNearPostalCode(
    postalCode: string,
    radiusKm: number,
    specialtyKeyword?: string,
  ): Promise<{ origin: GeoPoint; results: GarageWithDistance[] }> {
    const origin = await this.geocoding.geocode(postalCode);
    const garages = await this.prisma.garage.findMany();

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
      .filter(
        (g) =>
          !specialtyKeyword ||
          g.specialties.some((s) => s.toLowerCase().includes(specialtyKeyword.toLowerCase())),
      )
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return { origin, results };
  }

  async getById(id: string) {
    const garage = await this.prisma.garage.findUnique({ where: { id } });
    if (!garage) throw new NotFoundException('Garage introuvable.');
    return garage;
  }
}
