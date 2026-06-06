import { get, post } from './client';
import type { Approval, SubmitApprovalRequest, ApprovalDecisionRequest, PaginatedResponse, QueryParams } from '@/types';

const BASE = '/approvals';

export const approvalsApi = {
  list: (params?: QueryParams) =>
    get<PaginatedResponse<Approval>>(BASE, { params }),

  listForProject: (projectId: string, params?: QueryParams) =>
    get<PaginatedResponse<Approval>>(`/projects/${projectId}/approvals`, { params }),

  get: (id: string) =>
    get<Approval>(`${BASE}/${id}`),

  submit: (data: SubmitApprovalRequest) =>
    post<Approval>(`${BASE}/submit`, data),

  decide: (data: ApprovalDecisionRequest) =>
    post<Approval>(`${BASE}/decide`, data),

  remind: (id: string) =>
    post<void>(`${BASE}/${id}/remind`),

  cancel: (id: string, reason?: string) =>
    post<void>(`${BASE}/${id}/cancel`, { reason }),

  getPendingCount: () =>
    get<{ count: number }>(`${BASE}/pending/count`),
};
