import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_DURATION_MINUTES = 45;
const CANCELLATION_WINDOW_HOURS = 24;

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Refreshes the proposed (not-yet-confirmed) booking from the best response
   * received so far. Never touches a booking that the user already confirmed —
   * that transition is exclusively owned by `confirm()` below.
   */
  async proposeBestOption(quoteRequestId: string) {
    const quoteRequest = await this.prisma.quoteRequest.findUnique({
      where: { id: quoteRequestId },
      include: { garages: { include: { garage: true, responses: true } } },
    });
    if (!quoteRequest) return;

    const candidates = quoteRequest.garages.flatMap((link) =>
      link.responses
        .filter((r) => r.parsedSlots && (r.parsedSlots as unknown as { startsAt: string }[]).length > 0)
        .map((r) => ({ link, response: r })),
    );
    if (candidates.length === 0) return;

    candidates.sort((a, b) => (a.response.priceCents ?? Infinity) - (b.response.priceCents ?? Infinity));
    const best = candidates[0];
    const firstSlot = (best.response.parsedSlots as unknown as { startsAt: string }[])[0];

    const existing = await this.prisma.booking.findFirst({
      where: { quoteRequestId, status: 'pending_user_confirmation' },
    });

    const data = {
      quoteRequestId,
      garageId: best.link.garageId,
      vehicleId: quoteRequest.vehicleId,
      confirmedSlotAt: new Date(firstSlot.startsAt),
      priceCents: best.response.priceCents ?? 0,
      durationMinutes: DEFAULT_DURATION_MINUTES,
    };

    if (existing) {
      await this.prisma.booking.update({ where: { id: existing.id }, data });
    } else {
      await this.prisma.booking.create({ data: { ...data, status: 'pending_user_confirmation' } });
    }
  }

  /**
   * The ONLY path that ever sets a booking to `confirmed` — always an
   * explicit, authenticated user action. Nothing scheduled or automatic may
   * call this.
   */
  async confirm(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { quoteRequest: true },
    });
    if (!booking) throw new NotFoundException('Réservation introuvable.');
    if (booking.quoteRequest.userId !== userId) throw new ForbiddenException();

    const cancellationDeadlineAt = new Date(
      booking.confirmedSlotAt.getTime() - CANCELLATION_WINDOW_HOURS * 60 * 60 * 1000,
    );

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'confirmed',
        confirmedByUserId: userId,
        confirmedByUserAt: new Date(),
        cancellationDeadlineAt,
      },
    });
  }

  async getOwned(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { quoteRequest: true, garage: true },
    });
    if (!booking) throw new NotFoundException('Réservation introuvable.');
    if (booking.quoteRequest.userId !== userId) throw new ForbiddenException();
    return booking;
  }
}
