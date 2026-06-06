import type { UUID, Nullable, Auditable, Priority, Status, Tag } from './common.types';
import type { UserSummary } from './user.types';

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived' | 'cancelled';
export type ProjectVisibility = 'public' | 'private' | 'internal';
export type ProjectMethodology = 'scrum' | 'kanban' | 'waterfall' | 'hybrid';

export interface Project extends Auditable {
  id: UUID;
  workspaceId: UUID;
  name: string;
  slug: string;
  key: string;              // e.g., "SDD", "PROJ"
  description: Nullable<string>;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  methodology: ProjectMethodology;
  priority: Priority;
  startDate: Nullable<string>;
  targetDate: Nullable<string>;
  completedDate: Nullable<string>;
  owner: UserSummary;
  members: ProjectMember[];
  tags: Tag[];
  settings: ProjectSettings;
  stats: ProjectStats;
  color: string;
  icon: Nullable<string>;
  isArchived: boolean;
  isFavorited: boolean;
}

export interface ProjectSummary {
  id: UUID;
  name: string;
  slug: string;
  key: string;
  status: ProjectStatus;
  color: string;
  icon: Nullable<string>;
  owner: UserSummary;
  stats: ProjectStats;
}

export interface ProjectMember {
  id: UUID;
  userId: UUID;
  user: UserSummary;
  projectId: UUID;
  role: 'admin' | 'contributor' | 'viewer';
  joinedAt: string;
}

export interface ProjectSettings {
  requireApprovalForEpics: boolean;
  requireApprovalForStories: boolean;
  requireApprovalForRequirements: boolean;
  sprintDurationDays: number;
  storyPointScale: 'fibonacci' | 'linear' | 'tshirt';
  defaultAssigneeId: Nullable<UUID>;
  aiAutoSuggest: boolean;
  notifyOnStatusChange: boolean;
  enableTimeTracking: boolean;
  workingDaysPerWeek: number;
}

export interface ProjectStats {
  totalEpics: number;
  totalStories: number;
  totalTasks: number;
  totalRequirements: number;
  completedStories: number;
  activeSprintId: Nullable<UUID>;
  velocity: number;
  completionPercentage: number;
}

// ============================================================
// Workspace
// ============================================================

export interface Workspace extends Auditable {
  id: UUID;
  organizationId: UUID;
  name: string;
  slug: string;
  description: Nullable<string>;
  color: string;
  icon: Nullable<string>;
  projects: ProjectSummary[];
  projectCount: number;
  memberCount: number;
  isDefault: boolean;
  status: Status;
}
