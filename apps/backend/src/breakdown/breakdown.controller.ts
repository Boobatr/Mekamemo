import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { BreakdownService } from './breakdown.service';
import { DiagnosisService } from './diagnosis.service';
import { CreateBreakdownReportDto } from './dto/create-breakdown-report.dto';

@UseGuards(JwtAuthGuard)
@Controller('breakdown-reports')
export class BreakdownController {
  constructor(
    private readonly breakdownService: BreakdownService,
    private readonly diagnosisService: DiagnosisService,
  ) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBreakdownReportDto) {
    return this.breakdownService.createReport(user.id, dto);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.breakdownService.getOwnedReport(user.id, id);
  }

  @Post(':id/analyze')
  analyze(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.diagnosisService.analyze(user.id, id);
  }
}
