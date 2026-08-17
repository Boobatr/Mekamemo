import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface RevenueCatEvent {
  type: string;
  app_user_id: string;
  store?: 'APP_STORE' | 'PLAY_STORE';
  product_id?: string;
  expiration_at_ms?: number;
  original_app_user_id?: string;
}

const ACTIVATING_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'PRODUCT_CHANGE',
  'TRANSFER',
]);
const EXPIRING_EVENTS = new Set(['EXPIRATION']);

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getForUser(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!subscription) throw new NotFoundException('Abonnement introuvable.');
    return subscription;
  }

  async isPlus(userId: string): Promise<boolean> {
    const subscription = await this.prisma.subscription.findUnique({ where: { userId } });
    return subscription?.plan === 'mekamemo_plus' && subscription.status === 'active';
  }

  async handleRevenueCatEvent(event: RevenueCatEvent) {
    const userId = event.app_user_id;
    const subscription = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!subscription) return;

    if (ACTIVATING_EVENTS.has(event.type)) {
      await this.prisma.subscription.update({
        where: { userId },
        data: {
          plan: 'mekamemo_plus',
          status: 'active',
          store: event.store === 'APP_STORE' ? 'apple' : event.store === 'PLAY_STORE' ? 'google' : undefined,
          currentPeriodEnd: event.expiration_at_ms ? new Date(event.expiration_at_ms) : undefined,
        },
      });
    } else if (EXPIRING_EVENTS.has(event.type)) {
      await this.prisma.subscription.update({
        where: { userId },
        data: { plan: 'free', status: 'expired' },
      });
    } else if (event.type === 'CANCELLATION') {
      // Non-renewing but not yet expired — stays active/Plus until currentPeriodEnd.
      await this.prisma.subscription.update({ where: { userId }, data: { status: 'active' } });
    }
  }
}
