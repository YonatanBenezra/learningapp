export * as authApi from './authApi';
export type { AuthResult, Credentials } from './authApi';
export { useLogin, useSignup, useGoogleLogin, useLogout, useMe, AuthSessionSync } from './useAuth';
export { useAuthHydrated } from './useAuthHydrated';
export { RequireAuth, RedirectIfAuthed, RequireAdmin, RequireInstructor, RequireLearnerDashboard } from './guards';
export { defaultDashboardPath, isLearnerDashboardPath } from './dashboardRoutes';
export {
  createCoursePath,
  learnerCoursePath,
  learnerCourseStructurePath,
  marketplaceCatalogPath,
  marketplaceCoursePath,
  myCoursesPath,
} from './learnerRoutes';
export { AuthForm } from './AuthForm';
