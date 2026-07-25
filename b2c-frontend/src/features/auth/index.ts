export * as authApi from './authApi';
export type { AuthResult, Credentials } from './authApi';
export { useLogin, useSignup, useGoogleLogin, useLogout, useMe } from './useAuth';
export { useAuthHydrated } from './useAuthHydrated';
export { RequireAuth, RedirectIfAuthed, RequireAdmin, RequireInstructor } from './guards';
export { AuthForm } from './AuthForm';
