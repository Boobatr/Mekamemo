import { useMutation } from '@tanstack/react-query';
import * as breakdownApi from '../services/breakdown';

export function useUploadMedia() {
  return useMutation({ mutationFn: breakdownApi.uploadMedia });
}

export function useCreateBreakdownReport() {
  return useMutation({ mutationFn: breakdownApi.createBreakdownReport });
}

export function useAnalyzeBreakdownReport() {
  return useMutation({ mutationFn: breakdownApi.analyzeBreakdownReport });
}
