import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MileageService } from '../mileage/mileage.service';
import { MAINTENANCE_FALLBACK_PROVIDER } from './maintenance-fallback.interface';
import type { MaintenanceFallbackProvider, TaskSuggestion } from './maintenance-fallback.interface';

@Injectable()
export class MaintenanceScheduleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mileageService: MileageService,
    @Inject(MAINTENANCE_FALLBACK_PROVIDER) private readonly fallback: MaintenanceFallbackProvider,
  ) {}

  async generateForVehicle(vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException('Véhicule introuvable.');

    const user = await this.prisma.user.findUnique({ where: { id: vehicle.userId } });
    const language = user?.language ?? 'fr';

    const template = await this.prisma.maintenanceScheduleTemplate.findFirst({
      where: {
        make: { equals: vehicle.make, mode: 'insensitive' },
        model: { equals: vehicle.model, mode: 'insensitive' },
        yearRangeStart: { lte: vehicle.year },
        yearRangeEnd: { gte: vehicle.year },
      },
      include: { tasks: true },
      orderBy: { version: 'desc' },
    });

    const suggestions: TaskSuggestion[] = template
      ? template.tasks.map((t) => ({
          name: t.name,
          description: t.description,
          intervalKm: t.intervalKm,
          intervalMonths: t.intervalMonths,
          estimatedCostMinCents: t.estimatedCostMinCents,
          estimatedCostMaxCents: t.estimatedCostMaxCents,
        }))
      : await this.fallback.suggest({
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          language,
        });

    const scheduleSource = template ? template.source : this.fallback.providerName;
    await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { scheduleSource, scheduleGeneratedAt: new Date() },
    });

    const pace = await this.mileageService.getPaceSummary(vehicleId);

    const createdTasks = await this.prisma.$transaction(
      suggestions.map((task) =>
        this.prisma.maintenanceTask.create({
          data: {
            vehicleId,
            name: task.name,
            description: task.description,
            intervalKm: task.intervalKm,
            intervalMonths: task.intervalMonths,
            estimatedCostMinCents: task.estimatedCostMinCents,
            estimatedCostMaxCents: task.estimatedCostMaxCents,
            projection: task.intervalKm
              ? { create: { projectedDueKm: pace.currentKm + task.intervalKm } }
              : undefined,
          },
          include: { projection: true },
        }),
      ),
    );

    await this.mileageService.recalculateProjections(vehicleId);

    return this.prisma.maintenanceTask.findMany({
      where: { id: { in: createdTasks.map((t) => t.id) } },
      include: { projection: true },
    });
  }
}
