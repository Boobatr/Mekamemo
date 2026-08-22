import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHistoryEntryDto } from './dto/create-history-entry.dto';
import { AttachInvoiceDto } from './dto/attach-invoice.dto';

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOwnedVehicle(userId: string, vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException('Véhicule introuvable.');
    if (vehicle.userId !== userId) throw new ForbiddenException();
    return vehicle;
  }

  async listForVehicle(userId: string, vehicleId: string) {
    await this.getOwnedVehicle(userId, vehicleId);
    return this.prisma.serviceHistoryEntry.findMany({
      where: { vehicleId },
      include: { invoices: true, garage: { select: { name: true } } },
      orderBy: { performedAt: 'desc' },
    });
  }

  async yearSummaryForVehicle(userId: string, vehicleId: string) {
    await this.getOwnedVehicle(userId, vehicleId);
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const { _sum, _count } = await this.prisma.serviceHistoryEntry.aggregate({
      where: { vehicleId, performedAt: { gte: yearStart } },
      _sum: { costCents: true },
      _count: true,
    });
    return { totalThisYearCents: _sum.costCents ?? 0, interventionsCount: _count };
  }

  async create(userId: string, vehicleId: string, dto: CreateHistoryEntryDto) {
    await this.getOwnedVehicle(userId, vehicleId);
    return this.prisma.serviceHistoryEntry.create({
      data: {
        vehicleId,
        taskName: dto.taskName,
        performedAt: new Date(dto.performedAt),
        mileageAtServiceKm: dto.mileageAtServiceKm,
        garageId: dto.garageId,
        costCents: dto.costCents,
      },
    });
  }

  async attachInvoice(userId: string, entryId: string, dto: AttachInvoiceDto) {
    const entry = await this.prisma.serviceHistoryEntry.findUnique({
      where: { id: entryId },
      include: { vehicle: true },
    });
    if (!entry) throw new NotFoundException('Entrée introuvable.');
    if (entry.vehicle.userId !== userId) throw new ForbiddenException();

    return this.prisma.invoice.create({
      data: { vehicleId: entry.vehicleId, serviceHistoryEntryId: entryId, fileUrl: dto.fileUrl },
    });
  }
}
