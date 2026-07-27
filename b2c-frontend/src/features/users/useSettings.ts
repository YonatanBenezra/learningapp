'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/src/store/authStore';
import * as usersApi from './usersApi';

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: usersApi.updatePreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data);
      setUser(data.user);
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data);
      setUser(data.user);
    },
  });
}

export function useUploadProfileAvatar() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: usersApi.uploadProfileAvatar,
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data);
      setUser(data.user);
    },
  });
}

export function useExportUserData() {
  return useMutation({ mutationFn: usersApi.exportUserData });
}

export function useDeleteAccount() {
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);
  return useMutation({
    mutationFn: usersApi.deleteAccount,
    onSuccess: () => {
      clear();
      router.push('/login');
    },
  });
}
