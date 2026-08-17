import { useMutation, useQuery } from '@tanstack/react-query';
import * as garagesApi from '../services/garages';

export function useGarageSearch(query: string) {
  return useQuery({
    queryKey: ['garage-search', query],
    queryFn: () => garagesApi.searchGarages(query),
    enabled: query.trim().length > 0,
  });
}

export function useGarage(id: string) {
  return useQuery({ queryKey: ['garage', id], queryFn: () => garagesApi.getGarage(id), enabled: Boolean(id) });
}

export function useCreateQuoteRequest() {
  return useMutation({ mutationFn: garagesApi.createQuoteRequest });
}

export function useQuoteRequest(id: string) {
  return useQuery({
    queryKey: ['quote-request', id],
    queryFn: () => garagesApi.getQuoteRequest(id),
    enabled: Boolean(id),
    refetchInterval: 5000,
  });
}
