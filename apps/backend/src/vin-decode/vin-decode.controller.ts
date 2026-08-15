import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VinDecodeService } from './vin-decode.service';
import { DecodeVinDto } from './dto/decode-vin.dto';

@UseGuards(JwtAuthGuard)
@Controller('vin-decode')
export class VinDecodeController {
  constructor(private readonly vinDecodeService: VinDecodeService) {}

  @Post()
  decode(@Body() dto: DecodeVinDto) {
    return this.vinDecodeService.decode(dto.vin);
  }
}
