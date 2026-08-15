import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMileageReadingDto } from './dto/create-mileage-reading.dto';
import {
  buildMonthlyBars,
  buildSuggestedReadings,
  computeAverageKmPerMonth,
  DEFAULT_ASSUMED_KM_PER_MONTH,
  projectDueDate,
} from './mileage-projection.util';

@Injectable()
export class MileageService {
  constructor(private readonly prisma: PrismaService) {}

  async recordReading(vehicleId: string, dto: CreateMileageReadingDto) {
    await this.assertVehicleExists(vehicleId);

    const reading = await this.prisma.mileageReading.create({
      data: {
        vehicleId,
        valueKm: dto.valueKm,
        source: dto.source,
        recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
      },
    });

    await this.recalculateProjections(vehicleId);
    return reading;
  }

  /**
   * Recalculates the projected DATE for every task on this vehicle from the
   * latest driving pace. The km target itself (`projectedDueKm`) is never
   * touched here — it only moves when a task is completed and rescheduled.
   */
  async recalculateProjections(vehicleId: string, today: Date = new Date()) {
    const readings = await this.prisma.mileageReading.findMany({ where: { vehicleId } });
    const avgKmPerMonth = computeAverageKmPerMonth(readings) ?? undefined;
    const currentKm = this.latestOdometerKm(readings);

    if (currentKm === null) return;

    const tasks = await this.prisma.maintenanceTask.findMany({
      where: { vehicleId, status: { in: ['upcoming', 'overdue'] } },
      include: { projection: true },
    });

    for (const task of tasks) {
      if (!task.projection?.projectedDueKm) continue;

      const { projectedDueDate, isOverdue } = projectDueDate({
        currentKm,
        dueAtKm: task.projection.projectedDueKm,
        avgKmPerMonth: avgKmPerMonth ?? DEFAULT_ASSUMED_KM_PER_MONTH,
        today,
      });

      await this.prisma.taskProjection.update({
        where: { taskId: task.id },
        data: {
          projectedDueDate,
          avgKmPerMonthUsed: avgKmPerMonth ?? null,
          lastRecalculatedAt: today,
        },
      });

      if (isOverdue && task.status !== 'overdue') {
        await this.prisma.maintenanceTask.update({
          where: { id: task.id },
          data: { status: 'overdue' },
        });
      } else if (!isOverdue && task.status === 'overdue') {
        await this.prisma.maintenanceTask.update({
          where: { id: task.id },
          data: { status: 'upcoming' },
        });
      }
    }
  }

  async getPaceSummary(vehicleId: string, today: Date = new Date()) {
    await this.assertVehicleExists(vehicleId);
    const readings = await this.prisma.mileageReading.findMany({ where: { vehicleId } });
    const currentKm = this.latestOdometerKm(readings) ?? 0;
    const avgKmPerMonth = computeAverageKmPerMonth(readings);

    return {
      currentKm,
      avgKmPerMonth: avgKmPerMonth ?? DEFAULT_ASSUMED_KM_PER_MONTH,
      isPaceEstimated: avgKmPerMonth === null,
      readingsCount: readings.length,
      monthlyBars: buildMonthlyBars(readings, today),
      suggestedReadings: buildSuggestedReadings(currentKm, avgKmPerMonth ?? DEFAULT_ASSUMED_KM_PER_MONTH),
    };
  }

  private latestOdometerKm(readings: { valueKm: number; recordedAt: Date }[]): number | null {
    if (readings.length === 0) return null;
    return readings.reduce((latest, r) => (r.recordedAt > latest.recordedAt ? r : latest)).valueKm;
  }

  private async assertVehicleExists(vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException('Véhicule introuvable.');
  }
}
