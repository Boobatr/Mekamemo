import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { VehiclesService } from '../vehicles/vehicles.service';
import { MileageService } from './mileage.service';
import { CreateMileageReadingDto } from './dto/create-mileage-reading.dto';

@UseGuards(JwtAuthGuard)
@Controller('vehicles/:vehicleId/mileage')
export class MileageController {
  constructor(
    private readonly mileageService: MileageService,
    private readonly vehiclesService: VehiclesService,
  ) {}

  @Post('readings')
  async recordReading(
    @CurrentUser() user: AuthenticatedUser,
    @Param('vehicleId') vehicleId: string,
    @Body() dto: CreateMileageReadingDto,
  ) {
    await this.vehiclesService.getOwned(user.id, vehicleId);
    return this.mileageService.recordReading(vehicleId, dto);
  }

  @Get('pace')
  async getPace(@CurrentUser() user: AuthenticatedUser, @Param('vehicleId') vehicleId: string) {
    await this.vehiclesService.getOwned(user.id, vehicleId);
    return this.mileageService.getPaceSummary(vehicleId);
  }
}
