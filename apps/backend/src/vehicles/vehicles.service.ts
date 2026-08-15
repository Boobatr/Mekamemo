import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateVehicleDto) {
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
    return this.prisma.vehicle.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getOwned(userId: string, vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException('Véhicule introuvable.');
    if (vehicle.userId !== userId) throw new ForbiddenException();
    return vehicle;
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
