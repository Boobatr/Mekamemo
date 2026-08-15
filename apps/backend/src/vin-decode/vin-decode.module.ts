import { Module } from '@nestjs/common';
import { VinDecodeService } from './vin-decode.service';
import { VinDecodeController } from './vin-decode.controller';

@Module({
  providers: [VinDecodeService],
  controllers: [VinDecodeController],
  exports: [VinDecodeService],
})
export class VinDecodeModule {}
