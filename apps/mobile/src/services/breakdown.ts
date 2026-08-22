import { apiPost, apiUpload } from './api-client';

export interface UploadedMedia {
  url: string;
  mimeType: string;
}

export function uploadMedia(file: { uri: string; name: string; type: string }): Promise<UploadedMedia> {
  return apiUpload('/media/upload', file);
}

export interface CreateBreakdownReportInput {
  vehicleId: string;
  descriptionText: string;
  tags: string[];
  urgent: boolean;
  attachments: { type: 'photo' | 'video' | 'audio'; url: string }[];
}

export interface BreakdownReport {
  id: string;
  vehicleId: string;
  descriptionText: string;
  tags: string[];
  urgent: boolean;
}

export function createBreakdownReport(input: CreateBreakdownReportInput): Promise<BreakdownReport> {
  return apiPost('/breakdown-reports', input);
}

export interface Diagnosis {
  id: string;
  reportId: string;
  primaryCause: string;
  explanation: string;
  confidence: 'low' | 'medium' | 'high';
  secondaryCauses: { cause: string; confidence: 'low' | 'medium' | 'high' }[];
  recommendedDelay: string;
  costMinCents: number;
  costMaxCents: number;
  safetyNote: string;
  disclaimer: string;
}

export function analyzeBreakdownReport(reportId: string): Promise<Diagnosis> {
  return apiPost(`/breakdown-reports/${reportId}/analyze`);
}
