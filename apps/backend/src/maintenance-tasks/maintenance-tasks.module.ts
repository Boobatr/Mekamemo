import { Module } from '@nestjs/common';
import { MaintenanceTasksService } from './maintenance-tasks.service';
import { MaintenanceTasksController } from './maintenance-tasks.controller';
import { MileageModule } from '../mileage/mileage.module';

@Module({
  imports: [MileageModule],
  providers: [MaintenanceTasksService],
  controllers: [MaintenanceTasksController],
})
export class MaintenanceTasksModule {}
