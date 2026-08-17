import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBreakdownReportDto } from './dto/create-breakdown-report.dto';

@Injectable()
export class BreakdownService {
  constructor(private readonly prisma: PrismaService) {}

  async createReport(userId: string, dto: CreateBreakdownReportDto) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle) throw new NotFoundException('Véhicule introuvable.');
    if (vehicle.userId !== userId) throw new ForbiddenException();

    return this.prisma.breakdownReport.create({
      data: {
        vehicleId: dto.vehicleId,
        descriptionText: dto.descriptionText,
        tags: dto.tags,
        urgent: dto.urgent,
        attachments: {
          create: dto.attachments.map((a) => ({
            ownerType: 'breakdown_report',
            type: a.type,
            url: a.url,
          })),
        },
      },
      include: { attachments: true },
    });
  }

  async getOwnedReport(userId: string, reportId: string) {
    const report = await this.prisma.breakdownReport.findUnique({
      where: { id: reportId },
      include: { attachments: true, vehicle: true, diagnosis: true },
    });
    if (!report) throw new NotFoundException('Signalement introuvable.');
    if (report.vehicle.userId !== userId) throw new ForbiddenException();
    return report;
  }
}
