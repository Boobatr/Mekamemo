import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GEOCODING_PROVIDER, distanceKm } from '../geocoding/geocoding-provider.interface';
import type { GeocodingProvider } from '../geocoding/geocoding-provider.interface';

export interface GarageWithDistance {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  rating: number | null;
  reviewCount: number | null;
  specialties: string[];
  email: string | null;
  phone: string | null;
  certifications: string[];
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
  ): Promise<GarageWithDistance[]> {
    const origin = await this.geocoding.geocode(postalCode);
    const garages = await this.prisma.garage.findMany();

    return garages
      .map((g) => ({
        id: g.id,
        name: g.name,
        address: g.address,
        distanceKm: Math.round(distanceKm(origin, { lat: g.lat, lng: g.lng }) * 10) / 10,
        rating: g.rating,
        reviewCount: g.reviewCount,
        specialties: g.specialties,
        email: g.email,
        phone: g.phone,
        certifications: g.certifications,
      }))
      .filter((g) => g.distanceKm <= radiusKm)
      .filter(
        (g) =>
          !specialtyKeyword ||
          g.specialties.some((s) => s.toLowerCase().includes(specialtyKeyword.toLowerCase())),
      )
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  async getById(id: string) {
    const garage = await this.prisma.garage.findUnique({ where: { id } });
    if (!garage) throw new NotFoundException('Garage introuvable.');
    return garage;
  }
}
