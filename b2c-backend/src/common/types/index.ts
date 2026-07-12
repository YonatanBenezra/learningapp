export type Tier = 'free' | 'premium';
export type Role = 'user' | 'admin';
export type Domain = 'programming' | 'networking' | 'cybersecurity' | 'os' | 'general';
export type CourseStatus = 'generating' | 'ready' | 'failed' | 'archived' | 'completed';

// Identity attached to `req.user` by the auth middleware.
export interface AuthUser {
  id: string;
  role: Role;
  tier: Tier;
}
