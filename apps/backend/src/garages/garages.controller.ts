import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { GaragesService } from './garages.service';
import { SearchGaragesDto } from './dto/search-garages.dto';
import { AddGarageDto } from './dto/add-garage.dto';
import { GeocodingError } from '../geocoding/geocoding-provider.interface';
import { MONTREAL_DOWNTOWN } from '../geocoding/fixed-geocoding.provider';
import {
  buildFallbackSummary,
  buildGeocodeFailureSummary,
  extractSpecialtyKeyword,
} from './garage-search-summary.util';

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

    let search;
    try {
      search = await this.garagesService.searchNearPostalCode(
        profile.postalCode,
        profile.searchRadiusKm,
        specialty,
      );
    } catch (err) {
      if (!(err instanceof GeocodingError)) throw err;
      // An unknown postal code isn't a server fault: say so in the chat instead of failing the screen.
      return {
        assistantSummary: buildGeocodeFailureSummary(profile.postalCode, profile.language),
        origin: MONTREAL_DOWNTOWN,
        results: [],
      };
    }
    const { origin, results } = search;

    return {
      assistantSummary: buildFallbackSummary(results, profile.searchRadiusKm, profile.language),
      origin,
      results,
    };
  }

  /** A garage the open data doesn't list yet. */
  @Post()
  add(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddGarageDto) {
    return this.garagesService.addByUser(user.id, dto);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.garagesService.getById(id);
  }
}
