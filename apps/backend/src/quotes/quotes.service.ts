import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { EMAIL_PROVIDER } from './email-provider.interface';
import type { EmailProvider } from './email-provider.interface';
import { VOICE_PROVIDER } from './voice-provider.interface';
import type { VoiceProvider } from './voice-provider.interface';
import type { CreateQuoteRequestDto } from './dto/create-quote-request.dto';
import type { RecordGarageResponseDto } from './dto/record-garage-response.dto';

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingsService: BookingsService,
    private readonly subscriptionsService: SubscriptionsService,
    @Inject(EMAIL_PROVIDER) private readonly emailProvider: EmailProvider,
    @Inject(VOICE_PROVIDER) private readonly voiceProvider: VoiceProvider,
  ) {}

  async create(userId: string, dto: CreateQuoteRequestDto) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle) throw new NotFoundException('Véhicule introuvable.');
    if (vehicle.userId !== userId) throw new ForbiddenException();

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const garages = await this.prisma.garage.findMany({ where: { id: { in: dto.garageIds } } });

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
            messageContent: this.buildMessage(user.fullName, vehicle, user.language),
          })),
        },
      },
      include: { garages: { include: { garage: true } } },
    });

    const isPlus = await this.subscriptionsService.isPlus(userId);
    for (const link of quoteRequest.garages) {
      await this.dispatch(link, user, isPlus);
    }

    return quoteRequest;
  }

  private buildMessage(
    fullName: string,
    vehicle: { make: string; model: string; year: number },
    language: 'fr' | 'en',
  ): string {
    return language === 'fr'
      ? `Bonjour, je suis ${fullName}. Pourriez-vous me faire une soumission pour l'entretien de mon ${vehicle.make} ${vehicle.model} ${vehicle.year} ? Merci.`
      : `Hello, I'm ${fullName}. Could you provide a quote for servicing my ${vehicle.make} ${vehicle.model} ${vehicle.year}? Thank you.`;
  }

  private async dispatch(
    link: { id: string; contactMethod: string; messageContent: string | null; garage: { email: string | null; phone: string | null; name: string } },
    user: { voiceFallbackEnabled: boolean; language: string; phone: string },
    isPlus: boolean,
  ) {
    if (link.contactMethod === 'email' && link.garage.email) {
      await this.emailProvider.send({
        to: link.garage.email,
        subject: user.language === 'fr' ? 'Demande de soumission — MekaMemo' : 'Quote request — MekaMemo',
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
      },
    });
    if (!quoteRequest) throw new NotFoundException('Demande introuvable.');
    if (quoteRequest.userId !== userId) throw new ForbiddenException();
    return quoteRequest;
  }
}
