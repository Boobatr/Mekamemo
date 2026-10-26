import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as garagesApi from '../services/garages';

/**
 * `home` (postal code and radius) is only there to key the cache: the server reads them from the
 * profile, so a search made for another postal code or radius must never be served from memory.
 * Pass `undefined` to hold the search until the profile is known.
 */
export function useGarageSearch(
  query: string,
  position?: { lat: number; lng: number },
  home?: { postalCode: string; searchRadiusKm: number },
) {
  return useQuery({
    queryKey: ['garage-search', query, position?.lat, position?.lng, home?.postalCode, home?.searchRadiusKm],
    queryFn: () => garagesApi.searchGarages(query, position),
    enabled: query.trim().length > 0 && Boolean(home),
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
