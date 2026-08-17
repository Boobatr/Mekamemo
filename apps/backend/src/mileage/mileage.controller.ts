import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { VehiclesService } from '../vehicles/vehicles.service';
import { MileageService } from './mileage.service';
import { CreateMileageReadingDto } from './dto/create-mileage-reading.dto';
import { ODOMETER_OCR_PROVIDER } from './odometer-ocr-provider.interface';
import type { OdometerOcrProvider } from './odometer-ocr-provider.interface';

@UseGuards(JwtAuthGuard)
@Controller('vehicles/:vehicleId/mileage')
export class MileageController {
  constructor(
    private readonly mileageService: MileageService,
    private readonly vehiclesService: VehiclesService,
    @Inject(ODOMETER_OCR_PROVIDER) private readonly odometerOcr: OdometerOcrProvider,
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

  @Post('ocr-odometer')
  @UseInterceptors(FileInterceptor('file'))
  async ocrOdometer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('vehicleId') vehicleId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    await this.vehiclesService.getOwned(user.id, vehicleId);
    const valueKm = await this.odometerOcr.read(file.buffer, file.mimetype);
    return { valueKm };
  }
}
