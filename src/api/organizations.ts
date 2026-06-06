import { get, post, put, patch, del } from './client';
import type { Organization, OrgMember, UserInvite, PaginatedResponse, QueryParams } from '@/types';

const BASE = '/organizations';

export const organizationsApi = {
  get: (id: string) =>
    get<Organization>(`${BASE}/${id}`),

  getCurrent: () =>
    get<Organization>(`${BASE}/current`),

  update: (id: string, data: UpdateOrgRequest) =>
    put<Organization>(`${BASE}/${id}`, data),

  updateSettings: (id: string, settings: Partial<Organization['settings']>) =>
    patch<Organization>(`${BASE}/${id}/settings`, settings),

  uploadLogo: (id: string, formData: FormData) =>
    post<{ logoUrl: string }>(`${BASE}/${id}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Members
  listMembers: (id: string, params?: QueryParams) =>
    get<PaginatedResponse<OrgMember>>(`${BASE}/${id}/members`, { params }),

  updateMember: (orgId: string, userId: string, role: string) =>
    put<OrgMember>(`${BASE}/${orgId}/members/${userId}`, { role }),

  removeMember: (orgId: string, userId: string) =>
    del<void>(`${BASE}/${orgId}/members/${userId}`),

  // Invitations
  listInvites: (orgId: string) =>
    get<UserInvite[]>(`${BASE}/${orgId}/invites`),

  inviteUser: (orgId: string, email: string, role: string) =>
    post<UserInvite>(`${BASE}/${orgId}/invites`, { email, role }),

  resendInvite: (orgId: string, inviteId: string) =>
    post<void>(`${BASE}/${orgId}/invites/${inviteId}/resend`),

  cancelInvite: (orgId: string, inviteId: string) =>
    del<void>(`${BASE}/${orgId}/invites/${inviteId}`),

  acceptInvite: (token: string) =>
    post<{ organization: Organization }>('/invites/accept', { token }),
};

interface UpdateOrgRequest {
  name?: string;
  website?: string;
  description?: string;
}
