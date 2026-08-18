import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

const FREE_PLAN_VEHICLE_LIMIT = 1;

function withLatestOdometerKm<T extends { mileageReadings: { valueKm: number }[] }>(vehicle: T) {
  const { mileageReadings, ...rest } = vehicle;
  return { ...rest, latestOdometerKm: mileageReadings[0]?.valueKm ?? null };
}

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async create(userId: string, dto: CreateVehicleDto) {
    const isPlus = await this.subscriptionsService.isPlus(userId);
    if (!isPlus) {
      const existingCount = await this.prisma.vehicle.count({ where: { userId } });
      if (existingCount >= FREE_PLAN_VEHICLE_LIMIT) {
        throw new ForbiddenException(
          'Le plan gratuit est limité à un véhicule. Passez à MEKAMEMO+ pour en ajouter davantage.',
        );
      }
    }

    return this.prisma.vehicle.create({
      data: {
        userId,
        vin: dto.vin,
        make: dto.make,
        model: dto.model,
        trim: dto.trim,
        year: dto.year,
        engine: dto.engine,
        usageType: dto.usageType,
        mileageReadings: {
          create: {
            valueKm: dto.odometerKm,
            source: 'manual',
            recordedAt: new Date(),
          },
        },
      },
    });
  }

  async listForUser(userId: string) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: { mileageReadings: { orderBy: { recordedAt: 'desc' }, take: 1 } },
    });
    return vehicles.map(withLatestOdometerKm);
  }

  async getOwned(userId: string, vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { mileageReadings: { orderBy: { recordedAt: 'desc' }, take: 1 } },
    });
    if (!vehicle) throw new NotFoundException('Véhicule introuvable.');
    if (vehicle.userId !== userId) throw new ForbiddenException();
    return withLatestOdometerKm(vehicle);
  }

  async update(userId: string, vehicleId: string, dto: UpdateVehicleDto) {
    await this.getOwned(userId, vehicleId);
    return this.prisma.vehicle.update({ where: { id: vehicleId }, data: dto });
  }

  async remove(userId: string, vehicleId: string) {
    await this.getOwned(userId, vehicleId);
    await this.prisma.vehicle.delete({ where: { id: vehicleId } });
  }
}
