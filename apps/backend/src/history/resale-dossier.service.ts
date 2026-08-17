import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import { HistoryService } from './history.service';

@Injectable()
export class ResaleDossierService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly historyService: HistoryService,
  ) {}

  async build(userId: string, vehicleId: string): Promise<Buffer> {
    const vehicle = await this.prisma.vehicle.findUniqueOrThrow({ where: { id: vehicleId } });
    const entries = await this.historyService.listForVehicle(userId, vehicleId);

    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    doc
      .fontSize(20)
      .text(`Dossier de revente — ${vehicle.make} ${vehicle.model} ${vehicle.year}`, { underline: true });
    if (vehicle.vin) doc.fontSize(10).fillColor('gray').text(`VIN : ${vehicle.vin}`);
    doc.moveDown(1.5);

    doc.fillColor('black').fontSize(12);
    if (entries.length === 0) {
      doc.text("Aucun entretien enregistré pour l'instant.");
    }

    for (const entry of entries) {
      doc
        .fontSize(13)
        .text(entry.taskName, { continued: false })
        .fontSize(10)
        .fillColor('gray')
        .text(
          `${entry.performedAt.toISOString().slice(0, 10)} · ${entry.mileageAtServiceKm.toLocaleString('fr-CA')} km · ${(entry.costCents / 100).toFixed(2)} $`,
        );

      if (entry.invoices.length > 0) {
        doc.text(`Factures jointes : ${entry.invoices.map((i) => i.fileUrl).join(', ')}`);
      }
      doc.fillColor('black').moveDown(0.8);
    }

    doc.end();
    return done;
  }
}
