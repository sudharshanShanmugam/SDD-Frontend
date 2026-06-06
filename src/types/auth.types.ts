import type { UUID, ISO8601 } from './common.types';

// ============================================================
// Permissions & Roles
// ============================================================

export type Permission =
  // Organization
  | 'org:read'
  | 'org:write'
  | 'org:admin'
  | 'org:billing'
  // Workspaces
  | 'workspace:read'
  | 'workspace:write'
  | 'workspace:delete'
  | 'workspace:admin'
  // Projects
  | 'project:read'
  | 'project:write'
  | 'project:delete'
  | 'project:admin'
  // Documents
  | 'document:read'
  | 'document:write'
  | 'document:delete'
  | 'document:publish'
  // Requirements
  | 'requirement:read'
  | 'requirement:write'
  | 'requirement:delete'
  | 'requirement:approve'
  // Epics
  | 'epic:read'
  | 'epic:write'
  | 'epic:delete'
  // Stories
  | 'story:read'
  | 'story:write'
  | 'story:delete'
  // Sprints
  | 'sprint:read'
  | 'sprint:write'
  | 'sprint:manage'
  // Tasks
  | 'task:read'
  | 'task:write'
  | 'task:delete'
  // Approvals
  | 'approval:read'
  | 'approval:approve'
  | 'approval:reject'
  // QA
  | 'qa:read'
  | 'qa:write'
  | 'qa:execute'
  // Releases
  | 'release:read'
  | 'release:write'
  | 'release:deploy'
  // AI
  | 'ai:use'
  | 'ai:admin'
  // Analytics
  | 'analytics:read'
  | 'analytics:export'
  // Members
  | 'member:read'
  | 'member:invite'
  | 'member:remove'
  | 'member:admin'
  // Settings
  | 'settings:read'
  | 'settings:write';

export type RoleName =
  | 'super_admin'
  | 'org_admin'
  | 'workspace_admin'
  | 'project_manager'
  | 'tech_lead'
  | 'developer'
  | 'qa_engineer'
  | 'business_analyst'
  | 'stakeholder'
  | 'viewer';

export interface Role {
  id: UUID;
  name: RoleName;
  displayName: string;
  description: string;
  permissions: Permission[];
  isCustom: boolean;
  color: string;
}

// ============================================================
// Auth Tokens
// ============================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: ISO8601;
  tokenType: 'Bearer';
}

export interface TokenPayload {
  sub: UUID;
  email: string;
  orgId: UUID;
  roles: RoleName[];
  permissions: Permission[];
  iat: number;
  exp: number;
  jti: string;
}

// ============================================================
// Auth Requests
// ============================================================

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  mfaCode?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
  inviteToken?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ============================================================
// Auth Responses
// ============================================================

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
  organization: AuthOrganization;
}

export interface AuthUser {
  id: UUID;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string;
  roles: Role[];
  permissions: Permission[];
  preferences: UserPreferences;
  mfaEnabled: boolean;
  emailVerified: boolean;
  lastLoginAt: ISO8601;
}

export interface AuthOrganization {
  id: UUID;
  name: string;
  slug: string;
  logo?: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  features: string[];
}

// ============================================================
// User Preferences
// ============================================================

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  notifications: NotificationPreferences;
  defaultWorkspaceId?: UUID;
  defaultProjectId?: UUID;
  sidebarCollapsed: boolean;
  densityMode: 'comfortable' | 'compact' | 'spacious';
}

export interface NotificationPreferences {
  email: boolean;
  inApp: boolean;
  mentions: boolean;
  approvals: boolean;
  statusChanges: boolean;
  aiCompletions: boolean;
  digest: 'none' | 'daily' | 'weekly';
}

// ============================================================
// MFA
// ============================================================

export interface MFASetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MFAVerifyRequest {
  code: string;
}

// ============================================================
// OAuth
// ============================================================

export type OAuthProvider = 'google' | 'github' | 'microsoft' | 'saml';

export interface OAuthCallbackRequest {
  provider: OAuthProvider;
  code: string;
  state: string;
}
