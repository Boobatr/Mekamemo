import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MileageService } from '../mileage/mileage.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { UpdateMaintenanceTaskDto } from './dto/update-maintenance-task.dto';
import { CompleteMaintenanceTaskDto } from './dto/complete-maintenance-task.dto';

@Injectable()
export class MaintenanceTasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mileageService: MileageService,
    private readonly vehiclesService: VehiclesService,
  ) {}

  async listForVehicle(userId: string, vehicleId: string) {
    await this.vehiclesService.getOwned(userId, vehicleId);
    return this.prisma.maintenanceTask.findMany({
      where: { vehicleId },
      include: { projection: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async getOwned(userId: string, taskId: string) {
    const task = await this.prisma.maintenanceTask.findUnique({
      where: { id: taskId },
      include: { vehicle: true, projection: true },
    });
    if (!task) throw new NotFoundException('Tâche introuvable.');
    if (task.vehicle.userId !== userId) throw new ForbiddenException();
    return task;
  }

  async update(userId: string, taskId: string, dto: UpdateMaintenanceTaskDto) {
    const task = await this.getOwned(userId, taskId);

    const updated = await this.prisma.maintenanceTask.update({
      where: { id: taskId },
      data: {
        intervalKm: dto.intervalKm,
        intervalMonths: dto.intervalMonths,
        priority: dto.priority,
        notesForGarage: dto.notesForGarage,
        groupWithTaskId: dto.groupWithTaskId,
        editedByUser: true,
      },
    });

    // Interval changed: the km target should reflect it going forward.
    if (dto.intervalKm && task.projection) {
      const pace = await this.mileageService.getPaceSummary(task.vehicleId);
      await this.prisma.taskProjection.update({
        where: { taskId },
        data: { projectedDueKm: pace.currentKm + dto.intervalKm },
      });
      await this.mileageService.recalculateProjections(task.vehicleId);
    }

    return updated;
  }

  async remove(userId: string, taskId: string) {
    await this.getOwned(userId, taskId);
    await this.prisma.maintenanceTask.delete({ where: { id: taskId } });
  }

  /**
   * Marks the task done, records it in the service history, and — if
   * recurring — reschedules it from the odometer reading at service time
   * rather than from today's projected pace.
   */
  async complete(userId: string, taskId: string, dto: CompleteMaintenanceTaskDto) {
    const task = await this.getOwned(userId, taskId);

    const historyEntry = await this.prisma.serviceHistoryEntry.create({
      data: {
        vehicleId: task.vehicleId,
        taskName: task.name,
        performedAt: new Date(dto.performedAt),
        mileageAtServiceKm: dto.mileageAtServiceKm,
        garageId: dto.garageId,
        costCents: dto.costCents,
      },
    });

    if (task.isRecurring && task.intervalKm) {
      await this.prisma.maintenanceTask.update({
        where: { id: taskId },
        data: { status: 'upcoming' },
      });
      await this.prisma.taskProjection.update({
        where: { taskId },
        data: { projectedDueKm: dto.mileageAtServiceKm + task.intervalKm },
      });
      await this.mileageService.recalculateProjections(task.vehicleId);
    } else {
      await this.prisma.maintenanceTask.update({ where: { id: taskId }, data: { status: 'done' } });
    }

    return historyEntry;
  }
}
