import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BreakdownService } from './breakdown.service';
import { DIAGNOSIS_PROVIDER } from './diagnosis-provider.interface';
import type { DiagnosisProvider } from './diagnosis-provider.interface';

const DISCLAIMER = {
  fr: 'Estimation indicative : le garage confirme au diagnostic.',
  en: 'Indicative estimate: the garage confirms at diagnosis.',
} as const;

const MODEL_VERSION = 'diagnosis-v1';

@Injectable()
export class DiagnosisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly breakdownService: BreakdownService,
    @Inject(DIAGNOSIS_PROVIDER) private readonly provider: DiagnosisProvider,
  ) {}

  async analyze(userId: string, reportId: string) {
    const report = await this.breakdownService.getOwnedReport(userId, reportId);
    const vehicle = report.vehicle;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const language = user?.language ?? 'fr';

    const recentServiceHistory = await this.prisma.serviceHistoryEntry.findMany({
      where: { vehicleId: vehicle.id },
      orderBy: { performedAt: 'desc' },
      take: 5,
    });

    const result = await this.provider.diagnose({
      descriptionText: report.descriptionText,
      tags: report.tags,
      urgent: report.urgent,
      attachments: report.attachments.map((a) => ({ type: a.type as 'photo' | 'video' | 'audio', url: a.url })),
      vehicle: { make: vehicle.make, model: vehicle.model, year: vehicle.year },
      recentServiceHistory,
      language,
    });

    return this.prisma.diagnosis.upsert({
      where: { reportId },
      create: {
        reportId,
        primaryCause: result.primaryCause,
        explanation: result.explanation,
        confidence: result.confidence,
        secondaryCauses: result.secondaryCauses as unknown as Prisma.InputJsonValue,
        recommendedDelay: result.recommendedDelay,
        costMinCents: result.costMinCents,
        costMaxCents: result.costMaxCents,
        safetyNote: result.safetyNote,
        disclaimer: DISCLAIMER[language],
        modelVersion: MODEL_VERSION,
      },
      update: {
        primaryCause: result.primaryCause,
        explanation: result.explanation,
        confidence: result.confidence,
        secondaryCauses: result.secondaryCauses as unknown as Prisma.InputJsonValue,
        recommendedDelay: result.recommendedDelay,
        costMinCents: result.costMinCents,
        costMaxCents: result.costMaxCents,
        safetyNote: result.safetyNote,
        disclaimer: DISCLAIMER[language],
        modelVersion: MODEL_VERSION,
      },
    });
  }
}
