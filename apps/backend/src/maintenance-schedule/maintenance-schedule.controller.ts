import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { VehiclesService } from '../vehicles/vehicles.service';
import { MaintenanceScheduleService } from './maintenance-schedule.service';

@UseGuards(JwtAuthGuard)
@Controller('vehicles/:vehicleId/generate-calendar')
export class MaintenanceScheduleController {
  constructor(
    private readonly maintenanceScheduleService: MaintenanceScheduleService,
    private readonly vehiclesService: VehiclesService,
  ) {}

  @Post()
  async generate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('vehicleId') vehicleId: string,
  ) {
    await this.vehiclesService.getOwned(user.id, vehicleId);
    return this.maintenanceScheduleService.generateForVehicle(vehicleId);
  }
}
