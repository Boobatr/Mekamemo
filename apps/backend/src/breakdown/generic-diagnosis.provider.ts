import { Injectable } from '@nestjs/common';
import { DiagnosisInput, DiagnosisProvider, DiagnosisResult } from './diagnosis-provider.interface';

/**
 * Used when no ANTHROPIC_API_KEY is configured. Deliberately low-confidence
 * and generic — it never invents a specific mechanical cause without a real
 * model behind it, and always points the user to a garage.
 */
@Injectable()
export class GenericDiagnosisProvider implements DiagnosisProvider {
  async diagnose(input: DiagnosisInput): Promise<DiagnosisResult> {
    const isFr = input.language === 'fr';
    return {
      primaryCause: isFr
        ? 'Cause indéterminée sans analyse IA configurée'
        : 'Undetermined cause — AI analysis not configured',
      confidence: 'low',
      explanation: isFr
        ? 'Cette estimation est générique. Un diagnostic précis nécessite un service IA configuré ou une inspection en garage.'
        : 'This is a generic estimate. An accurate diagnosis needs a configured AI service or an in-person garage inspection.',
      secondaryCauses: [],
      recommendedDelay: isFr ? 'Dès que possible' : 'As soon as possible',
      costMinCents: 0,
      costMaxCents: 0,
      safetyNote: isFr
        ? 'Par prudence, faites inspecter le véhicule avant un long trajet.'
        : 'As a precaution, have the vehicle inspected before a long trip.',
    };
  }
}
