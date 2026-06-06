import type { UUID, ISO8601, Nullable, Auditable } from './common.types';
import type { Role, UserPreferences } from './auth.types';

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'invited' | 'pending';

export interface User extends Auditable {
  id: UUID;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  username: string;
  avatar: Nullable<string>;
  bio: Nullable<string>;
  jobTitle: Nullable<string>;
  department: Nullable<string>;
  phone: Nullable<string>;
  timezone: string;
  locale: string;
  status: UserStatus;
  roles: Role[];
  preferences: UserPreferences;
  mfaEnabled: boolean;
  emailVerified: boolean;
  lastActiveAt: Nullable<ISO8601>;
  lastLoginAt: Nullable<ISO8601>;
}

export interface UserSummary {
  id: UUID;
  displayName: string;
  email: string;
  avatar: Nullable<string>;
  jobTitle: Nullable<string>;
  status: UserStatus;
  isOnline?: boolean;
}

export interface UserInvite {
  id: UUID;
  email: string;
  role: string;
  invitedBy: UserSummary;
  invitedAt: ISO8601;
  expiresAt: ISO8601;
  acceptedAt: Nullable<ISO8601>;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  jobTitle?: string;
  department?: string;
  phone?: string;
  timezone?: string;
  locale?: string;
}

export interface OnlinePresence {
  userId: UUID;
  isOnline: boolean;
  lastSeen: ISO8601;
  currentView?: string;
}
