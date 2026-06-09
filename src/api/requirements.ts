import { get, post, put, patch, del } from './client';
import type {
  Requirement,
  RequirementSummary,
  RequirementVersion,
  PaginatedResponse,
  QueryParams,
} from '@/types';

const BASE = '/requirements';

export const requirementsApi = {
  list: (projectId: string, params?: QueryParams) =>
    get<PaginatedResponse<RequirementSummary>>(`/requirements`, { params: { project_id: projectId, page_size: 500, ...params } }),

  get: (id: string) =>
    get<Requirement>(`${BASE}/${id}`),

  create: (projectId: string, data: CreateRequirementRequest) =>
    post<Requirement>(`${BASE}`, {
      title:                data.title,
      description:          data.description,
      type:                 data.type,
      priority:             data.priority,
      project_id:           projectId,
      acceptance_criteria:  data.acceptanceCriteria ?? [],
      tags:                 data.tags ?? [],
    }),

  update: (id: string, data: Partial<CreateRequirementRequest>) =>
    put<Requirement>(`${BASE}/${id}`, data),

  patch: (id: string, data: Partial<Requirement>) =>
    patch<Requirement>(`${BASE}/${id}`, data),

  delete: (id: string) =>
    del<void>(`${BASE}/${id}`),

  bulkUpdate: (ids: string[], data: BulkUpdateRequirementRequest) =>
    patch<{ updated: number }>(`${BASE}/bulk`, { ids, ...data }),

  bulkApprove: (ids: string[]) =>
    patch<{ updated: number }>(`${BASE}/bulk-status`, { ids, status: 'approved' }),

  /** POST /requirements/clear?project_id=xxx — soft-deletes all requirements */
  clear: (projectId: string) =>
    post<{ deleted: number }>(`${BASE}/clear?project_id=${encodeURIComponent(projectId)}`),

  /** POST /requirements/consolidate?project_id=xxx — AI groups similar requirements (merge N→1) */
  consolidate: (projectId: string) =>
    post<ConsolidateResult>(
      `${BASE}/consolidate?project_id=${encodeURIComponent(projectId)}`,
      {},
      { timeout: 300_000 },
    ),

  /**
   * POST /requirements/group-topics?project_id=xxx
   * AI groups requirements by topic and adds group:<topic> tags — requirements stay individual.
   * Generates E#-US# numbered stories when "Generate Stories" is run afterwards.
   */
  groupTopics: (projectId: string) =>
    post<GroupTopicsResult>(
      `${BASE}/group-topics?project_id=${encodeURIComponent(projectId)}`,
      {},
      { timeout: 300_000 },
    ),

  bulkDelete: (ids: string[]) =>
    post<{ deleted: number }>(`${BASE}/bulk-delete`, { ids }),

  // Versions
  getVersions: (id: string) =>
    get<RequirementVersion[]>(`${BASE}/${id}/versions`),

  getVersion: (id: string, version: number) =>
    get<RequirementVersion>(`${BASE}/${id}/versions/${version}`),

  restoreVersion: (id: string, version: number) =>
    post<Requirement>(`${BASE}/${id}/versions/${version}/restore`),

  // Status transitions
  submitForReview: (id: string) =>
    patch<Requirement>(`${BASE}/${id}/submit-review`),

  approve: (id: string, comment?: string) =>
    patch<Requirement>(`${BASE}/${id}/approve`, { comment }),

  reject: (id: string, reason: string) =>
    patch<Requirement>(`${BASE}/${id}/reject`, { reason }),

  // Locking
  lock: (id: string) =>
    patch<Requirement>(`${BASE}/${id}/lock`),

  unlock: (id: string) =>
    patch<Requirement>(`${BASE}/${id}/unlock`),

  // AI
  generateFromDescription: (projectId: string, data: AIGenerateRequirementsRequest) =>
    post<Requirement[]>(`/projects/${projectId}/requirements/ai-generate`, data),

  improveQuality: (id: string) =>
    post<Requirement>(`${BASE}/${id}/ai-improve`),

  // Import/Export
  import: (projectId: string, formData: FormData) =>
    post<{ imported: number; errors: string[] }>(
      `/projects/${projectId}/requirements/import`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ),

  export: (projectId: string, format: 'csv' | 'excel' | 'pdf', ids?: string[]) =>
    get<Blob>(`/projects/${projectId}/requirements/export`, {
      params: { format, ids: ids?.join(',') },
      responseType: 'blob',
    }),
};

interface CreateRequirementRequest {
  title: string;
  description: string;
  type: Requirement['type'];
  priority: Requirement['priority'];
  source?: string;
  rationale?: string;
  acceptanceCriteria?: string[];
  storyId?: string;
  assigneeId?: string;
  reviewerId?: string;
  tags?: string[];
}

interface BulkUpdateRequirementRequest {
  status?: Requirement['status'];
  priority?: Requirement['priority'];
  assigneeId?: string;
  tags?: string[];
}

export interface ConsolidateResult {
  original_count: number;
  consolidated_count: number;
  groups_created: number;
  merged: number;
  skipped: number;
  message?: string;
  /** Each group includes the synthesized title (and original topic for reference) */
  groups?: Array<{ topic: string; count: number; title?: string }>;
}

export interface GroupTopicsResult {
  groups_created: number;
  tagged: number;
  message?: string;
  groups: Array<{ topic: string; count: number }>;
}

interface AIGenerateRequirementsRequest {
  description: string;
  type?: Requirement['type'];
  count?: number;
  context?: string;
}
