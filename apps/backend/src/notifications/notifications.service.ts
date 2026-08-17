import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PUSH_PROVIDER } from './push-provider.interface';
import type { PushProvider } from './push-provider.interface';
import { LoggingPushProvider } from './logging-push.provider';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MILEAGE_PROMPT_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly loggingFallback = new LoggingPushProvider();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PUSH_PROVIDER) private readonly pushProvider: PushProvider,
  ) {}

  async registerPushToken(userId: string, pushToken: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { pushToken } });
  }

  /**
   * Re-plans the two maintenance reminders (7 days before, then on the due
   * date) from a task's current projection. Called after every projection
   * recalculation so reminders always track the latest projected date —
   * removed entirely if the task no longer has one (overdue, or no pace yet).
   */
  async upsertMaintenanceReminders(taskId: string) {
    const task = await this.prisma.maintenanceTask.findUnique({
      where: { id: taskId },
      include: { projection: true, vehicle: { include: { user: true } } },
    });
    if (!task) return;

    const { vehicle } = task;
    const dueDate = task.projection?.projectedDueDate;

    if (!dueDate) {
      await this.prisma.notification.deleteMany({
        where: {
          relatedEntityId: taskId,
          type: { in: ['maintenance_reminder_7d', 'maintenance_reminder_due'] },
          sentAt: null,
        },
      });
      return;
    }

    await this.upsertReminder({
      userId: vehicle.userId,
      vehicleId: vehicle.id,
      relatedEntityId: taskId,
      type: 'maintenance_reminder_7d',
      scheduledFor: new Date(dueDate.getTime() - SEVEN_DAYS_MS),
      locale: vehicle.user.language,
      payload: { taskName: task.name, vehicleLabel: `${vehicle.make} ${vehicle.model}` },
    });

    await this.upsertReminder({
      userId: vehicle.userId,
      vehicleId: vehicle.id,
      relatedEntityId: taskId,
      type: 'maintenance_reminder_due',
      scheduledFor: dueDate,
      locale: vehicle.user.language,
      payload: { taskName: task.name, vehicleLabel: `${vehicle.make} ${vehicle.model}` },
    });
  }

  private async upsertReminder(params: {
    userId: string;
    vehicleId: string;
    relatedEntityId: string;
    type: 'maintenance_reminder_7d' | 'maintenance_reminder_due';
    scheduledFor: Date;
    locale: 'fr' | 'en';
    payload: Record<string, unknown>;
  }) {
    const existing = await this.prisma.notification.findFirst({
      where: { relatedEntityId: params.relatedEntityId, type: params.type, sentAt: null },
    });

    const payload = params.payload as Prisma.InputJsonValue;

    if (existing) {
      await this.prisma.notification.update({
        where: { id: existing.id },
        data: { scheduledFor: params.scheduledFor, payload },
      });
    } else {
      await this.prisma.notification.create({
        data: {
          userId: params.userId,
          vehicleId: params.vehicleId,
          relatedEntityId: params.relatedEntityId,
          type: params.type,
          scheduledFor: params.scheduledFor,
          locale: params.locale,
          payload,
        },
      });
    }
  }

  /** Prompts once a month per vehicle for a fresh odometer reading. */
  async scheduleDueMileagePrompts(now: Date = new Date()) {
    const vehicles = await this.prisma.vehicle.findMany({ include: { user: true } });

    for (const vehicle of vehicles) {
      const lastPrompt = await this.prisma.notification.findFirst({
        where: { vehicleId: vehicle.id, type: 'mileage_prompt' },
        orderBy: { createdAt: 'desc' },
      });

      const dueForPrompt =
        !lastPrompt || now.getTime() - lastPrompt.createdAt.getTime() >= MILEAGE_PROMPT_INTERVAL_MS;

      if (dueForPrompt) {
        await this.prisma.notification.create({
          data: {
            userId: vehicle.userId,
            vehicleId: vehicle.id,
            type: 'mileage_prompt',
            scheduledFor: now,
            locale: vehicle.user.language,
            payload: { vehicleLabel: `${vehicle.make} ${vehicle.model}` },
          },
        });
      }
    }
  }

  /** Sends every notification whose scheduled time has arrived. */
  async dispatchDue(now: Date = new Date()) {
    const due = await this.prisma.notification.findMany({
      where: { sentAt: null, scheduledFor: { lte: now } },
      include: { user: true },
    });

    for (const notification of due) {
      const provider = notification.user.pushToken ? this.pushProvider : this.loggingFallback;
      const { title, body } = this.renderContent(notification);

      try {
        await provider.send({
          pushToken: notification.user.pushToken ?? notification.userId,
          title,
          body,
          data: { type: notification.type, notificationId: notification.id },
        });
      } catch (err) {
        this.logger.error(`Failed to dispatch notification ${notification.id}`, err as Error);
        continue;
      }

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { sentAt: now },
      });
    }

    return due.length;
  }

  async listForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { scheduledFor: 'desc' },
    });
  }

  async markRead(userId: string, notificationId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    });
  }

  private renderContent(notification: { type: string; locale: string; payload: unknown }): {
    title: string;
    body: string;
  } {
    const payload = (notification.payload ?? {}) as Record<string, string>;
    const isFr = notification.locale === 'fr';

    switch (notification.type) {
      case 'mileage_prompt':
        return isFr
          ? { title: 'Relevé du kilométrage', body: `Quel est le kilométrage de ${payload.vehicleLabel} ?` }
          : { title: 'Mileage check-in', body: `What's the mileage on ${payload.vehicleLabel}?` };
      case 'maintenance_reminder_7d':
        return isFr
          ? { title: `${payload.taskName} dans 7 jours`, body: payload.vehicleLabel }
          : { title: `${payload.taskName} in 7 days`, body: payload.vehicleLabel };
      case 'maintenance_reminder_due':
        return isFr
          ? { title: `${payload.taskName} — échéance aujourd'hui`, body: payload.vehicleLabel }
          : { title: `${payload.taskName} — due today`, body: payload.vehicleLabel };
      case 'garage_response':
        return isFr
          ? { title: 'Un garage a répondu', body: (payload.garageName as string) ?? '' }
          : { title: 'A garage replied', body: (payload.garageName as string) ?? '' };
      default:
        return { title: 'MekaMemo', body: '' };
    }
  }
}
