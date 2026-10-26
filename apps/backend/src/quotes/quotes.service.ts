import { ForbiddenException, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { GEOCODING_PROVIDER, distanceKm } from '../geocoding/geocoding-provider.interface';
import type { GeocodingProvider } from '../geocoding/geocoding-provider.interface';
import { EMAIL_PROVIDER } from './email-provider.interface';
import type { EmailProvider } from './email-provider.interface';
import { VOICE_PROVIDER } from './voice-provider.interface';
import type { VoiceProvider } from './voice-provider.interface';
import type { CreateQuoteRequestDto } from './dto/create-quote-request.dto';
import type { PreviewQuoteEmailDto } from './dto/preview-quote-email.dto';
import type { RecordGarageResponseDto } from './dto/record-garage-response.dto';
import { buildQuoteMessage, buildQuoteSubject } from './quote-message';
import type { Language } from './quote-message';

/** Emails (or calls) one person can send to garages per day: a safety net, since the text is theirs. */
const MAX_GARAGE_MESSAGES_PER_DAY = 20;

const singleLine = (text: string) => text.replace(/\s+/g, ' ').trim();

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingsService: BookingsService,
    private readonly subscriptionsService: SubscriptionsService,
    @Inject(EMAIL_PROVIDER) private readonly emailProvider: EmailProvider,
    @Inject(VOICE_PROVIDER) private readonly voiceProvider: VoiceProvider,
    @Inject(GEOCODING_PROVIDER) private readonly geocoding: GeocodingProvider,
  ) {}

  /**
   * The message a quote request would send to one garage, without sending or saving anything,
   * so the user can read it before asking for an appointment.
   */
  async preview(userId: string, dto: PreviewQuoteEmailDto) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle) throw new NotFoundException('Véhicule introuvable.');
    if (vehicle.userId !== userId) throw new ForbiddenException();
    const garage = await this.prisma.garage.findUnique({ where: { id: dto.garageId } });
    if (!garage) throw new NotFoundException('Garage introuvable.');

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const { subject, body } = await this.compose(user, vehicle, dto.taskId, dto.diagnosisId);
    return {
      contactMethod: garage.email ? ('email' as const) : ('voice' as const),
      to: garage.email,
      phone: garage.phone,
      subject,
      body,
    };
  }

  /**
   * The standard subject and message for this vehicle and, when given, the maintenance item or the
   * reported breakdown it is about. Both must belong to the vehicle: someone else's can't be quoted.
   */
  private async compose(
    user: { fullName: string; language: string },
    vehicle: { id: string; make: string; model: string; year: number; trim: string | null; vin: string | null },
    taskId?: string,
    diagnosisId?: string,
  ) {
    const language: Language = user.language === 'en' ? 'en' : 'fr';
    const [task, diagnosis, reading] = await Promise.all([
      taskId
        ? this.prisma.maintenanceTask.findFirst({ where: { id: taskId, vehicleId: vehicle.id }, include: { projection: true } })
        : null,
      diagnosisId
        ? this.prisma.diagnosis.findFirst({ where: { id: diagnosisId, report: { vehicleId: vehicle.id } }, include: { report: true } })
        : null,
      this.prisma.mileageReading.findFirst({ where: { vehicleId: vehicle.id }, orderBy: { recordedAt: 'desc' } }),
    ]);
    if (taskId && !task) throw new NotFoundException('Entretien introuvable.');
    if (diagnosisId && !diagnosis) throw new NotFoundException('Diagnostic introuvable.');

    const input = {
      language,
      fullName: user.fullName,
      vehicle,
      odometerKm: reading?.valueKm,
      task: task && {
        name: task.name,
        description: task.description,
        notesForGarage: task.notesForGarage,
        dueKm: task.projection?.projectedDueKm,
        dueDate: task.projection?.projectedDueDate,
      },
      diagnosis: diagnosis && { description: diagnosis.report.descriptionText, primaryCause: diagnosis.primaryCause },
    };
    return { subject: buildQuoteSubject(input), body: buildQuoteMessage(input) };
  }

  async create(userId: string, dto: CreateQuoteRequestDto) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle) throw new NotFoundException('Véhicule introuvable.');
    if (vehicle.userId !== userId) throw new ForbiddenException();

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const garages = await this.prisma.garage.findMany({ where: { id: { in: dto.garageIds } } });

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sentToday = await this.prisma.quoteRequestGarage.count({
      where: { quoteRequest: { userId }, sentAt: { gte: since } },
    });
    if (sentToday + garages.length > MAX_GARAGE_MESSAGES_PER_DAY) {
      throw new HttpException('Trop de demandes envoyées aujourd’hui. Réessayez demain.', HttpStatus.TOO_MANY_REQUESTS);
    }

    // What the user saw and possibly edited wins over the standard text.
    const standard = await this.compose(user, vehicle, dto.taskId, dto.diagnosisId);
    const subject = singleLine(dto.subject ?? '') || standard.subject;
    const message = dto.message?.trim() || standard.body;

    const quoteRequest = await this.prisma.quoteRequest.create({
      data: {
        userId,
        vehicleId: dto.vehicleId,
        taskId: dto.taskId,
        diagnosisId: dto.diagnosisId,
        status: 'sent',
        garages: {
          create: garages.map((garage) => ({
            garageId: garage.id,
            contactMethod: garage.email ? 'email' : 'voice',
            language: user.language,
            sentAt: new Date(),
            messageContent: message,
          })),
        },
      },
      include: { garages: { include: { garage: true } } },
    });

    const isPlus = await this.subscriptionsService.isPlus(userId);
    for (const link of quoteRequest.garages) {
      await this.dispatch(link, user, isPlus, subject);
    }

    return quoteRequest;
  }

  private async dispatch(
    link: { id: string; contactMethod: string; messageContent: string | null; garage: { email: string | null; phone: string | null; name: string } },
    user: { voiceFallbackEnabled: boolean; language: string; phone: string },
    isPlus: boolean,
    subject: string,
  ) {
    if (link.contactMethod === 'email' && link.garage.email) {
      await this.emailProvider.send({
        to: link.garage.email,
        subject,
        body: link.messageContent ?? '',
      });
      return;
    }

    // Voice-call fallback is a MEKAMEMO+ feature, on top of the user's own toggle.
    if (isPlus && user.voiceFallbackEnabled && link.garage.phone) {
      await this.voiceProvider.call({
        toPhoneNumber: link.garage.phone,
        message: link.messageContent ?? '',
      });
    }
  }

  async recordResponse(dto: RecordGarageResponseDto) {
    const link = await this.prisma.quoteRequestGarage.findUnique({
      where: { id: dto.quoteRequestGarageId },
    });
    if (!link) throw new NotFoundException('Demande de soumission introuvable.');

    await this.prisma.quoteRequestGarage.update({
      where: { id: link.id },
      data: { quoteRequest: { update: { status: 'responded' } } },
    });

    const response = await this.prisma.garageResponse.create({
      data: {
        quoteRequestGarageId: dto.quoteRequestGarageId,
        rawContent: dto.rawContent,
        parsedSlots: dto.parsedSlots as unknown as Prisma.InputJsonValue,
        priceCents: dto.priceCents,
        receivedAt: new Date(),
        channel: dto.channel,
      },
    });

    await this.bookingsService.proposeBestOption(link.quoteRequestId);
    return response;
  }

  async getOwned(userId: string, quoteRequestId: string) {
    const quoteRequest = await this.prisma.quoteRequest.findUnique({
      where: { id: quoteRequestId },
      include: {
        garages: { include: { garage: true, responses: true } },
        bookings: true,
        vehicle: true,
      },
    });
    if (!quoteRequest) throw new NotFoundException('Demande introuvable.');
    if (quoteRequest.userId !== userId) throw new ForbiddenException();

    const [user, task] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      quoteRequest.taskId
        ? this.prisma.maintenanceTask.findUnique({ where: { id: quoteRequest.taskId } })
        : null,
    ]);

    const pendingBooking = quoteRequest.bookings.find((b) => b.status === 'pending_user_confirmation');
    const origin = await this.geocoding.geocode(user.postalCode);

    const candidates = quoteRequest.garages
      .flatMap((link) =>
        link.responses
          .filter((r) => r.parsedSlots && (r.parsedSlots as unknown as { startsAt: string }[]).length > 0)
          .map((r) => ({ link, response: r })),
      )
      .sort((a, b) => (a.response.priceCents ?? Infinity) - (b.response.priceCents ?? Infinity));

    const winningLink = pendingBooking
      ? quoteRequest.garages.find((l) => l.garageId === pendingBooking.garageId)
      : undefined;

    const distanceToGarage = (garage: { lat: number; lng: number }) =>
      Math.round(distanceKm(origin, garage) * 10) / 10;

    return {
      ...quoteRequest,
      taskName: task?.name ?? null,
      vehicleLabel: quoteRequest.vehicle
        ? `${quoteRequest.vehicle.make} ${quoteRequest.vehicle.model} ${quoteRequest.vehicle.year}`
        : null,
      distanceToBookingKm: winningLink ? distanceToGarage(winningLink.garage) : null,
      confirmedByChannel: winningLink?.contactMethod ?? null,
      otherSlots: candidates
        .filter((c) => c.link.garageId !== pendingBooking?.garageId)
        .slice(0, 2)
        .map((c) => ({
          garageId: c.link.garageId,
          garageName: c.link.garage.name,
          distanceKm: distanceToGarage(c.link.garage),
          priceCents: c.response.priceCents,
          startsAt: (c.response.parsedSlots as unknown as { startsAt: string }[])[0].startsAt,
        })),
    };
  }
}
