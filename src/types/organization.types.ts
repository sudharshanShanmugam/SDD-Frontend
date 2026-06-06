import type { UUID, ISO8601, Nullable, Auditable, Timestamps } from './common.types';
import type { UserSummary } from './user.types';
import type { RoleName } from './auth.types';

export type OrgPlan = 'free' | 'starter' | 'professional' | 'enterprise';
export type OrgStatus = 'active' | 'suspended' | 'trial' | 'cancelled';

export interface Organization extends Auditable {
  id: UUID;
  name: string;
  slug: string;
  logo: Nullable<string>;
  website: Nullable<string>;
  description: Nullable<string>;
  plan: OrgPlan;
  status: OrgStatus;
  features: string[];
  settings: OrgSettings;
  billing: OrgBilling;
  stats: OrgStats;
  memberCount: number;
  workspaceCount: number;
  trialEndsAt: Nullable<ISO8601>;
}

export interface OrgSettings {
  allowPublicProjects: boolean;
  requireApprovalForPublish: boolean;
  defaultProjectVisibility: 'public' | 'private' | 'internal';
  aiEnabled: boolean;
  ssoEnabled: boolean;
  mfaRequired: boolean;
  auditLogRetentionDays: number;
  allowedDomains: string[];
  webhooksEnabled: boolean;
  apiRateLimit: number;
}

export interface OrgBilling extends Timestamps {
  id: UUID;
  plan: OrgPlan;
  billingEmail: string;
  currency: string;
  interval: 'monthly' | 'annual';
  currentPeriodStart: ISO8601;
  currentPeriodEnd: ISO8601;
  seats: number;
  usedSeats: number;
  storageGB: number;
  usedStorageGB: number;
  nextBillingDate: ISO8601;
  amount: number;
}

export interface OrgStats {
  totalProjects: number;
  totalDocuments: number;
  totalRequirements: number;
  totalStories: number;
  aiRequestsThisMonth: number;
  aiRequestsLimit: number;
}

export interface OrgMember extends Timestamps {
  id: UUID;
  userId: UUID;
  user: UserSummary;
  organizationId: UUID;
  role: RoleName;
  status: 'active' | 'inactive' | 'invited';
  invitedAt: Nullable<ISO8601>;
  joinedAt: Nullable<ISO8601>;
}
