export type UserRole = "learner" | "tutor" | "org_admin" | "admin";

export type User = {
  id: string;
  email: string;
  role: UserRole;
  displayName?: string;
};
