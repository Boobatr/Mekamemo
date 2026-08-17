import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { MaintenanceTasksService } from './maintenance-tasks.service';
import { UpdateMaintenanceTaskDto } from './dto/update-maintenance-task.dto';
import { CompleteMaintenanceTaskDto } from './dto/complete-maintenance-task.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class MaintenanceTasksController {
  constructor(private readonly maintenanceTasksService: MaintenanceTasksService) {}

  @Get('vehicles/:vehicleId/maintenance-tasks')
  listForVehicle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('vehicleId') vehicleId: string,
  ) {
    return this.maintenanceTasksService.listForVehicle(user.id, vehicleId);
  }

  @Patch('maintenance-tasks/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceTaskDto,
  ) {
    return this.maintenanceTasksService.update(user.id, id, dto);
  }

  @Delete('maintenance-tasks/:id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.maintenanceTasksService.remove(user.id, id);
  }

  @Post('maintenance-tasks/:id/complete')
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CompleteMaintenanceTaskDto,
  ) {
    return this.maintenanceTasksService.complete(user.id, id, dto);
  }
}
