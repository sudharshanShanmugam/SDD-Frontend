import { get, post, put, del } from './client';
import type { Workspace, PaginatedResponse } from '@/types';

const BASE = '/workspaces';

export const workspacesApi = {
  // Backend: GET /workspaces?organization_id={orgId}
  list: (orgId: string) =>
    get<PaginatedResponse<Workspace>>(BASE, { params: { organization_id: orgId, page_size: 100 } }),

  get: (id: string) =>
    get<Workspace>(`${BASE}/${id}`),

  getBySlug: (orgSlug: string, workspaceSlug: string) =>
    get<Workspace>(`/organizations/${orgSlug}/workspaces/${workspaceSlug}`),

  // Backend: POST /workspaces  (organization_id goes in the body)
  create: (orgId: string, data: { name: string; description?: string; color?: string }) =>
    post<Workspace>(BASE, { organization_id: orgId, ...data }),

  update: (id: string, data: Partial<{ name: string; description: string; color: string; icon: string }>) =>
    put<Workspace>(`${BASE}/${id}`, data),

  delete: (id: string) =>
    del<void>(`${BASE}/${id}`),

  listMembers: (id: string) =>
    get<any[]>(`${BASE}/${id}/members`),

  addMember: (id: string, userId: string, role = 'member') =>
    post<any>(`${BASE}/${id}/members?user_id=${encodeURIComponent(userId)}&role=${encodeURIComponent(role)}`),

  removeMember: (id: string, userId: string) =>
    del<void>(`${BASE}/${id}/members/${encodeURIComponent(userId)}`),
};
