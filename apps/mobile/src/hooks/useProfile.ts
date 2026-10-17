import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as usersApi from '../services/users';

const profileKey = ['profile'] as const;
const subscriptionKey = ['subscription'] as const;

export function useProfile() {
  return useQuery({ queryKey: profileKey, queryFn: usersApi.getProfile });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKey }),
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.changePassword,
    // Refresh the profile so `hasChosenPassword` flips for accounts that just set their first one.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKey }),
  });
}

export function useSubscription() {
  return useQuery({ queryKey: subscriptionKey, queryFn: usersApi.getSubscription });
}
