import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { GaragesService } from './garages.service';
import { SearchGaragesDto } from './dto/search-garages.dto';
import { buildFallbackSummary, extractSpecialtyKeyword } from './garage-search-summary.util';

@UseGuards(JwtAuthGuard)
@Controller('garages')
export class GaragesController {
  constructor(
    private readonly garagesService: GaragesService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('search')
  async search(@CurrentUser() user: AuthenticatedUser, @Query() dto: SearchGaragesDto) {
    const profile = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const specialty = extractSpecialtyKeyword(dto.query);
    const { origin, results } = await this.garagesService.searchNearPostalCode(
      profile.postalCode,
      profile.searchRadiusKm,
      specialty,
    );

    return {
      assistantSummary: buildFallbackSummary(results, profile.searchRadiusKm, profile.language),
      origin,
      results,
    };
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.garagesService.getById(id);
  }
}
