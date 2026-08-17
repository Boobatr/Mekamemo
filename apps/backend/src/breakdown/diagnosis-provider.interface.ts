export const DIAGNOSIS_PROVIDER = 'DIAGNOSIS_PROVIDER';

export interface DiagnosisAttachment {
  type: 'photo' | 'video' | 'audio';
  url: string;
}

export interface DiagnosisInput {
  descriptionText: string;
  tags: string[];
  urgent: boolean;
  attachments: DiagnosisAttachment[];
  vehicle: { make: string; model: string; year: number };
  recentServiceHistory: { taskName: string; performedAt: Date; mileageAtServiceKm: number }[];
  language: 'fr' | 'en';
}

export interface DiagnosisSecondaryCause {
  cause: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface DiagnosisResult {
  primaryCause: string;
  confidence: 'low' | 'medium' | 'high';
  explanation: string;
  secondaryCauses: DiagnosisSecondaryCause[];
  recommendedDelay: string;
  costMinCents: number;
  costMaxCents: number;
  safetyNote: string;
}

export interface DiagnosisProvider {
  diagnose(input: DiagnosisInput): Promise<DiagnosisResult>;
}
