import { get, post, put, patch, del } from './client';
import type {
  Project,
  ProjectSummary,
  ProjectMember,
  ProjectSettings,
  PaginatedResponse,
  QueryParams,
  ActivityLog,
} from '@/types';

const BASE = '/projects';

export const projectsApi = {
  list: (workspaceId: string, params?: QueryParams) =>
    get<PaginatedResponse<ProjectSummary>>(BASE, {
      params: { workspace_id: workspaceId, ...params },
    }),

  get: (projectId: string) =>
    get<Project>(`${BASE}/${projectId}`),

  getBySlug: (workspaceSlug: string, projectSlug: string) =>
    get<Project>(`/workspaces/${workspaceSlug}/projects/${projectSlug}`),

  create: (workspaceId: string, data: CreateProjectRequest) =>
    post<Project>(BASE, { workspace_id: workspaceId, ...data }),

  update: (projectId: string, data: UpdateProjectRequest) =>
    put<Project>(`${BASE}/${projectId}`, data),

  updateSettings: (projectId: string, settings: Partial<ProjectSettings>) =>
    patch<Project>(`${BASE}/${projectId}/settings`, settings),

  archive: (projectId: string) =>
    patch<Project>(`${BASE}/${projectId}/archive`),

  restore: (projectId: string) =>
    patch<Project>(`${BASE}/${projectId}/restore`),

  delete: (projectId: string) =>
    del<void>(`${BASE}/${projectId}`),

  duplicate: (projectId: string, name: string) =>
    post<Project>(`${BASE}/${projectId}/duplicate`, { name }),

  // Members
  listMembers: (projectId: string) =>
    get<ProjectMember[]>(`${BASE}/${projectId}/members`),

  /** Returns workspace members for this project — used for the assignee picker */
  listWorkspaceMembers: (projectId: string) =>
    get<any[]>(`${BASE}/${projectId}/workspace-members`),

  addMember: (projectId: string, userId: string, role: string) =>
    post<ProjectMember>(`${BASE}/${projectId}/members`, { user_id: userId, role }),

  updateMember: (projectId: string, userId: string, role: string) =>
    put<ProjectMember>(`${BASE}/${projectId}/members/${userId}`, { user_id: userId, role }),

  removeMember: (projectId: string, userId: string) =>
    del<void>(`${BASE}/${projectId}/members/${userId}`),

  // Activity
  getActivity: (projectId: string, params?: QueryParams) =>
    get<PaginatedResponse<ActivityLog>>(`${BASE}/${projectId}/activity`, { params }),

  // Stats
  getStats: (projectId: string) =>
    get<Project['stats']>(`${BASE}/${projectId}/stats`),

  // Favorites
  favorite: (projectId: string) =>
    post<void>(`${BASE}/${projectId}/favorite`),

  unfavorite: (projectId: string) =>
    del<void>(`${BASE}/${projectId}/favorite`),
};

interface CreateProjectRequest {
  name: string;
  key: string;
  description?: string;
  methodology?: Project['methodology'];
  visibility?: Project['visibility'];
  color?: string;
  icon?: string;
  startDate?: string;
  targetDate?: string;
}

interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: Project['status'];
  priority?: Project['priority'];
  ownerId?: string;
}
