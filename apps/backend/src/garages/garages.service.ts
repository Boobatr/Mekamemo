import { randomUUID } from 'crypto';
import { BadRequestException, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GEOCODING_PROVIDER, GeocodingError, distanceKm } from '../geocoding/geocoding-provider.interface';
import type { GeocodingProvider, GeoPoint } from '../geocoding/geocoding-provider.interface';
import { GARAGE_DISCOVERY } from '../garage-discovery/garage-discovery.interface';
import type { GarageDiscovery } from '../garage-discovery/garage-discovery.interface';
import { pickNearestDistinct } from './distinct-garages';
import { formatPhone } from '../garage-import/overture-garage.mapper';
import type { AddGarageDto } from './dto/add-garage.dto';

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

export interface GarageSearch {
  origin: GeoPoint;
  /** The radius actually searched: larger than the one asked for when few garages were near. */
  radiusKm: number;
  results: GarageWithDistance[];
}

/** In a dense city a 50 km radius holds hundreds of garages; the nearest ones are what's useful. */
const MAX_RESULTS = 30;

/** Fewer garages than this within the radius: look further out instead of showing an empty screen. */
const MIN_RESULTS = 5;
const MAX_AUTO_RADIUS_KM = 100;

export const USER_GARAGE_SOURCE = 'user';
/** Garages one person may add per day: enough to fill gaps, too few to flood the search. */
const MAX_ADDED_PER_DAY = 10;
/** A garage this close to the typed one, with the same name or phone, is the same garage. */
const SAME_GARAGE_KM = 0.15;

const plain = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const digits = (text: string | null | undefined) => (text ?? '').replace(/\D/g, '').slice(-10);

@Injectable()
export class GaragesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(GEOCODING_PROVIDER) private readonly geocoding: GeocodingProvider,
    @Inject(GARAGE_DISCOVERY) private readonly discovery: GarageDiscovery,
  ) {}

  async searchNearPostalCode(postalCode: string, radiusKm: number, specialtyKeyword?: string): Promise<GarageSearch> {
    const origin = await this.geocoding.geocode(postalCode);
    return this.searchNear(origin, radiusKm, specialtyKeyword);
  }

  /**
   * The nearest garages around a point. Small towns and remote places may have none within the
   * chosen radius: the radius is doubled (up to 100 km) until a few garages turn up, and the
   * radius actually searched is returned so the app can say so.
   */
  async searchNear(origin: GeoPoint, radiusKm: number, specialtyKeyword?: string): Promise<GarageSearch> {
    let searchedKm = radiusKm;
    let found = await this.garagesWithin(origin, searchedKm, specialtyKeyword);
    while (found.length < MIN_RESULTS && searchedKm < MAX_AUTO_RADIUS_KM) {
      searchedKm = Math.min(searchedKm * 2, MAX_AUTO_RADIUS_KM);
      found = await this.garagesWithin(origin, searchedKm, specialtyKeyword);
    }
    return { origin, radiusKm: searchedKm, results: pickNearestDistinct(found, MAX_RESULTS) };
  }

  private async garagesWithin(origin: GeoPoint, radiusKm: number, specialtyKeyword?: string): Promise<GarageWithDistance[]> {
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

    return results;
  }

  /**
   * Lists a garage the open data is missing. The address is geocoded (so the pin is where the
   * garage really is); if that place is already listed — same name or phone within 150 m —
   * the existing garage is returned instead of a duplicate.
   */
  async addByUser(userId: string, dto: AddGarageDto) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const addedToday = await this.prisma.garage.count({
      where: { source: USER_GARAGE_SOURCE, externalPlaceId: { startsWith: `${userId}:` }, createdAt: { gte: since } },
    });
    if (addedToday >= MAX_ADDED_PER_DAY) {
      throw new HttpException('Trop de garages ajoutés aujourd’hui. Réessayez demain.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const postalCode = dto.postalCode?.trim().toUpperCase();
    const address = [dto.street.trim(), [dto.city.trim(), postalCode].filter(Boolean).join(' ')].join(', ');
    let point;
    try {
      point = await this.geocoding.geocode(`${dto.street.trim()}, ${dto.city.trim()}${postalCode ? ` ${postalCode}` : ''}, Canada`);
    } catch (err) {
      if (!(err instanceof GeocodingError)) throw err;
      throw new BadRequestException('Adresse introuvable. Vérifiez le numéro, la rue et la ville.');
    }

    const phone = formatPhone(dto.phone);
    const nearby = await this.prisma.garage.findMany({
      where: {
        lat: { gte: point.lat - 0.002, lte: point.lat + 0.002 },
        lng: { gte: point.lng - 0.003, lte: point.lng + 0.003 },
      },
    });
    const existing = nearby.find(
      (g) =>
        distanceKm(point, { lat: g.lat, lng: g.lng }) <= SAME_GARAGE_KM &&
        (plain(g.name) === plain(dto.name) || (digits(phone) !== '' && digits(g.phone) === digits(phone))),
    );
    if (existing) return { garage: existing, created: false };

    const garage = await this.prisma.garage.create({
      data: {
        name: dto.name.trim(),
        address,
        lat: point.lat,
        lng: point.lng,
        phone,
        email: dto.email?.trim().toLowerCase() || null,
        specialties: [],
        certifications: [],
        source: USER_GARAGE_SOURCE,
        externalPlaceId: `${userId}:${randomUUID()}`,
      },
    });
    return { garage, created: true };
  }

  async getById(id: string) {
    const garage = await this.prisma.garage.findUnique({ where: { id } });
    if (!garage) throw new NotFoundException('Garage introuvable.');
    return garage;
  }
}
