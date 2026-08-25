import { UserRole } from '../constants/roles';

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
};
