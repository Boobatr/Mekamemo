import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export function usePreviewQuoteEmail() {
  return useMutation({ mutationFn: garagesApi.previewQuoteEmail });
}

export function useAddGarage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: garagesApi.addGarage,
    // The new garage must show up in the next search without waiting for a refresh.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['garage-search'] }),
  });
}
