import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { AuthUser, AuthTokens, AuthOrganization, UserPreferences, Permission } from '@/types';

// ── Role → permissions mapping (mirrors backend ROLE_PERMISSIONS) ─────────────

export type AppRole = 'super_admin' | 'business_analyst' | 'developer' | 'qa_engineer' | 'org_admin' | 'project_manager' | 'tech_lead' | 'stakeholder' | 'viewer' | 'member';

const ALL_PERMISSIONS: Permission[] = [
  'org:read','org:write','org:admin','org:billing',
  'workspace:read','workspace:write','workspace:delete','workspace:admin',
  'project:read','project:write','project:delete','project:admin',
  'document:read','document:write','document:delete','document:publish',
  'requirement:read','requirement:write','requirement:delete','requirement:approve',
  'epic:read','epic:write','epic:delete',
  'story:read','story:write','story:delete',
  'sprint:read','sprint:write','sprint:manage',
  'task:read','task:write','task:delete',
  'approval:read','approval:approve','approval:reject',
  'qa:read','qa:write','qa:execute',
  'release:read','release:write','release:deploy',
  'ai:use','ai:admin',
  'analytics:read','analytics:export',
  'member:read','member:invite','member:remove','member:admin',
  'settings:read','settings:write',
] as Permission[];

export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  super_admin:      ALL_PERMISSIONS,
  org_admin:        ALL_PERMISSIONS.filter(p => !p.startsWith('org:billing')),
  project_manager:  ['workspace:read','project:read','project:write','document:read','document:write','requirement:read','requirement:write','epic:read','epic:write','story:read','story:write','sprint:read','sprint:write','sprint:manage','task:read','task:write','approval:read','qa:read','qa:write','release:read','release:write','ai:use','analytics:read','member:read'] as Permission[],
  business_analyst: ['workspace:read','project:read','project:write','document:read','document:write','document:publish','requirement:read','requirement:write','requirement:approve','epic:read','epic:write','story:read','story:write','sprint:read','sprint:write','task:read','approval:read','approval:approve','qa:read','qa:write','release:read','release:write','ai:use','analytics:read','member:read'] as Permission[],
  tech_lead:        ['workspace:read','project:read','project:write','document:read','requirement:read','requirement:write','epic:read','epic:write','story:read','story:write','sprint:read','sprint:write','sprint:manage','task:read','task:write','task:delete','approval:read','qa:read','ai:use','analytics:read','member:read'] as Permission[],
  developer:        ['workspace:read','project:read','document:read','requirement:read','epic:read','story:read','sprint:read','sprint:write','task:read','task:write','ai:use','member:read'] as Permission[],
  qa_engineer:      ['workspace:read','project:read','document:read','requirement:read','epic:read','story:read','sprint:read','task:read','task:write','qa:read','qa:write','qa:execute','release:read','ai:use','member:read'] as Permission[],
  stakeholder:      ['workspace:read','project:read','document:read','requirement:read','epic:read','story:read','sprint:read','task:read','approval:read','approval:approve','member:read'] as Permission[],
  viewer:           ['workspace:read','project:read','document:read','requirement:read','epic:read','story:read','sprint:read','task:read','member:read'] as Permission[],
  member:           ['workspace:read','project:read','document:read','requirement:read','epic:read','story:read','sprint:read','task:read','member:read'] as Permission[],
};

// Which nav pages each role can access
export const ROLE_NAV_ACCESS: Record<AppRole, string[]> = {
  super_admin:      ['*'],
  org_admin:        ['*'],
  project_manager:  ['dashboard','workspaces','documents','requirements','stories','sprints','tasks','qa','releases','approvals','ai-workflow'],
  business_analyst: ['dashboard','workspaces','documents','requirements','stories','sprints','tasks','qa','releases','approvals','ai-workflow'],
  tech_lead:        ['dashboard','workspaces','documents','requirements','stories','sprints','tasks','qa','releases','ai-workflow'],
  developer:        ['workspaces','sprints','tasks'],
  qa_engineer:      ['workspaces','sprints','tasks','qa','releases'],
  stakeholder:      ['workspaces','requirements','stories','sprints','tasks'],
  viewer:           ['workspaces','requirements','stories','sprints','tasks'],
  member:           ['workspaces','sprints','tasks'],
};

export function canAccessNav(role: AppRole, page: string): boolean {
  const access = ROLE_NAV_ACCESS[role] ?? [];
  return access.includes('*') || access.includes(page);
}

function roleToAuthUser(roleData: { id: string; email: string; full_name: string; role: string; organization_id?: string | null }): AuthUser {
  const role = (roleData.role || 'viewer') as AppRole;
  const permissions = ROLE_PERMISSIONS[role] ?? [];
  return {
    id: roleData.id,
    email: roleData.email,
    firstName: roleData.full_name?.split(' ')[0] ?? '',
    lastName: roleData.full_name?.split(' ').slice(1).join(' ') ?? '',
    displayName: roleData.full_name,
    username: roleData.email.split('@')[0],
    avatar: null,
    bio: null,
    jobTitle: null,
    department: null,
    phone: null,
    timezone: 'UTC',
    locale: 'en',
    status: 'active' as any,
    roles: [{
      id: role,
      name: role as any,
      displayName: role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      description: '',
      permissions: [],
      isCustom: false,
      color: '#6366f1',
    }],
    permissions,
    preferences: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      notifications: { email: true, inApp: true, mentions: true, approvals: true, statusChanges: true, aiCompletions: true, digest: 'none' },
      sidebarCollapsed: false,
      densityMode: 'comfortable',
    },
    mfaEnabled: false,
    emailVerified: true,
    lastLoginAt: new Date().toISOString(),
    lastActiveAt: null,
  } as any;
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface AuthState {
  user:            AuthUser | null;
  tokens:          AuthTokens | null;
  organization:    AuthOrganization | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  isInitialized:   boolean;
  error:           string | null;

  setAuth:         (user: AuthUser, tokens: AuthTokens, org: AuthOrganization) => void;
  setAuthFromLogin:(loginResp: { access_token: string; refresh_token: string; expires_in: number; user?: any }) => void;
  setUser:         (user: AuthUser) => void;
  updateProfile:   (updates: Partial<AuthUser>) => void;
  updatePreferences:(prefs: Partial<UserPreferences>) => void;
  logout:          () => void;
  setLoading:      (loading: boolean) => void;
  setError:        (error: string | null) => void;
  setInitialized:  (initialized: boolean) => void;

  hasPermission:     (permission: Permission) => boolean;
  hasAnyPermission:  (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  hasRole:           (role: string) => boolean;
  hasAnyRole:        (roles: string[]) => boolean;
  isOrgAdmin:        () => boolean;
  isSuperAdmin:      () => boolean;
  canAccess:         (page: string) => boolean;
  currentRole:       () => AppRole;
}

const STORAGE_KEY = 'sdd_auth_v2';

const DEFAULT_ORG: AuthOrganization = {
  id:       '00000000-0000-0000-0000-000000000020',
  name:     'My Organization',
  slug:     'my-org',
  plan:     'enterprise',
  features: ['ai', 'collaboration', 'analytics', 'gantt', 'export_pdf'],
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      immer((set, get) => ({
        user:            null,
        tokens:          null,
        organization:    null,
        isAuthenticated: false,
        isLoading:       false,
        isInitialized:   true,
        error:           null,

        setAuth: (user, tokens, organization) => {
          set((state) => {
            state.user            = user;
            state.tokens          = tokens;
            state.organization    = organization;
            state.isAuthenticated = true;
            state.isLoading       = false;
            state.error           = null;
          });
        },

        setAuthFromLogin: (loginResp) => {
          const tokens: AuthTokens = {
            accessToken:  loginResp.access_token,
            refreshToken: loginResp.refresh_token,
            expiresAt:    new Date(Date.now() + loginResp.expires_in * 1000).toISOString(),
            tokenType:    'Bearer',
          };
          const userData = loginResp.user;
          if (!userData) {
            // Token refresh response — update tokens only, preserve existing user/org
            set((state) => { state.tokens = tokens; });
            return;
          }
          const user = roleToAuthUser(userData);
          set((state) => {
            state.user            = user;
            state.tokens          = tokens;
            state.organization    = DEFAULT_ORG;
            state.isAuthenticated = true;
            state.isLoading       = false;
            state.error           = null;
          });
        },

        setUser: (user) => { set((state) => { state.user = user; }); },

        updateProfile: (updates) => {
          set((state) => { if (state.user) Object.assign(state.user, updates); });
        },

        updatePreferences: (prefs) => {
          set((state) => { if (state.user) Object.assign(state.user.preferences, prefs); });
        },

        logout: () => {
          set((state) => {
            state.user            = null;
            state.tokens          = null;
            state.organization    = null;
            state.isAuthenticated = false;
            state.error           = null;
          });
          localStorage.removeItem(STORAGE_KEY);
        },

        setLoading:     (loading)     => { set((state) => { state.isLoading = loading; }); },
        setError:       (error)       => { set((state) => { state.error = error; state.isLoading = false; }); },
        setInitialized: (initialized) => { set((state) => { state.isInitialized = initialized; }); },

        hasPermission: (permission) => {
          const { user } = get();
          if (!user) return false;
          if (user.roles.some(r => r.name === 'super_admin')) return true;
          return user.permissions.includes(permission);
        },

        hasAnyPermission: (permissions) => {
          const { hasPermission } = get();
          return permissions.some(p => hasPermission(p));
        },

        hasAllPermissions: (permissions) => {
          const { hasPermission } = get();
          return permissions.every(p => hasPermission(p));
        },

        hasRole: (role) => {
          const { user } = get();
          if (!user) return false;
          return user.roles.some(r => r.name === role);
        },

        hasAnyRole: (roles) => {
          const { user } = get();
          if (!user) return false;
          return roles.some(role => user.roles.some(r => r.name === role));
        },

        isOrgAdmin: () => {
          const { user } = get();
          if (!user) return false;
          return user.roles.some(r => r.name === 'super_admin' || r.name === 'org_admin');
        },

        isSuperAdmin: () => {
          const { user } = get();
          if (!user) return false;
          return user.roles.some(r => r.name === 'super_admin');
        },

        canAccess: (page) => {
          const { user } = get();
          if (!user) return false;
          const role = (user.roles[0]?.name ?? 'viewer') as AppRole;
          return canAccessNav(role, page);
        },

        currentRole: () => {
          const { user } = get();
          return ((user?.roles[0]?.name ?? 'viewer') as AppRole);
        },
      })),
      {
        name:    STORAGE_KEY,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          user:            state.user,
          organization:    state.organization,
          isAuthenticated: state.isAuthenticated,
          tokens:          state.tokens,
        }),
        version: 3,
      }
    ),
    { name: 'AuthStore' }
  )
);

// ── Selectors ─────────────────────────────────────────────────────────────────

export const selectUser         = (state: AuthState) => state.user;
export const selectTokens       = (state: AuthState) => state.tokens;
export const selectOrganization = (state: AuthState) => state.organization;
export const selectIsAuth       = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading    = (state: AuthState) => state.isLoading;

export function useCurrentUser()  { return useAuthStore(s => s.user); }
export function useIsAuthenticated() { return useAuthStore(s => s.isAuthenticated); }
export function usePermission(permission: Permission) { return useAuthStore(s => s.hasPermission(permission)); }
export function useCanAccess(page: string) { return useAuthStore(s => s.canAccess(page)); }
