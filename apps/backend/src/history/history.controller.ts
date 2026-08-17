import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { HistoryService } from './history.service';
import { ResaleDossierService } from './resale-dossier.service';
import { CreateHistoryEntryDto } from './dto/create-history-entry.dto';
import { AttachInvoiceDto } from './dto/attach-invoice.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class HistoryController {
  constructor(
    private readonly historyService: HistoryService,
    private readonly resaleDossierService: ResaleDossierService,
  ) {}

  @Get('vehicles/:vehicleId/history')
  list(@CurrentUser() user: AuthenticatedUser, @Param('vehicleId') vehicleId: string) {
    return this.historyService.listForVehicle(user.id, vehicleId);
  }

  @Post('vehicles/:vehicleId/history')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('vehicleId') vehicleId: string,
    @Body() dto: CreateHistoryEntryDto,
  ) {
    return this.historyService.create(user.id, vehicleId, dto);
  }

  @Post('history/:entryId/invoices')
  attachInvoice(
    @CurrentUser() user: AuthenticatedUser,
    @Param('entryId') entryId: string,
    @Body() dto: AttachInvoiceDto,
  ) {
    return this.historyService.attachInvoice(user.id, entryId, dto);
  }

  @Get('vehicles/:vehicleId/history/export')
  async export(
    @CurrentUser() user: AuthenticatedUser,
    @Param('vehicleId') vehicleId: string,
    @Res() res: Response,
  ) {
    const pdf = await this.resaleDossierService.build(user.id, vehicleId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="dossier-revente-${vehicleId}.pdf"`);
    res.send(pdf);
  }
}
