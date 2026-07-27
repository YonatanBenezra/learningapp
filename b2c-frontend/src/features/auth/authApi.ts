import { apiClient } from '@/src/infrastructure/apiClient';
import type { User } from '@/src/domain/user';

export interface Credentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends Credentials {
  name: string;
}

export interface AuthResult {
  user: User;
}

export function signup(input: SignupCredentials): Promise<AuthResult> {
  return apiClient<AuthResult>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function login(input: Credentials): Promise<AuthResult> {
  return apiClient<AuthResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function loginWithGoogle(idToken: string): Promise<AuthResult> {
  return apiClient<AuthResult>('/auth/oauth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
}

export function logout(): Promise<void> {
  return apiClient<void>('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function getMe(): Promise<{ user: User }> {
  return apiClient<{ user: User }>('/users/me');
}

export function getSession(): Promise<{ user: User }> {
  return apiClient<{ user: User }>('/auth/session');
}
