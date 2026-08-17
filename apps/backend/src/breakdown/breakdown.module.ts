import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BreakdownService } from './breakdown.service';
import { DiagnosisService } from './diagnosis.service';
import { BreakdownController } from './breakdown.controller';
import { GenericDiagnosisProvider } from './generic-diagnosis.provider';
import { ClaudeDiagnosisProvider } from './claude-diagnosis.provider';
import { DIAGNOSIS_PROVIDER } from './diagnosis-provider.interface';

@Module({
  imports: [ConfigModule],
  providers: [
    BreakdownService,
    DiagnosisService,
    GenericDiagnosisProvider,
    ClaudeDiagnosisProvider,
    {
      provide: DIAGNOSIS_PROVIDER,
      inject: [ConfigService, GenericDiagnosisProvider, ClaudeDiagnosisProvider],
      useFactory: (
        config: ConfigService,
        generic: GenericDiagnosisProvider,
        claude: ClaudeDiagnosisProvider,
      ) => (config.get<string>('ANTHROPIC_API_KEY') ? claude : generic),
    },
  ],
  controllers: [BreakdownController],
  exports: [BreakdownService, DiagnosisService],
})
export class BreakdownModule {}
