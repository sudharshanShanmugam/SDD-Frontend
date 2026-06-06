import { get, post, put, patch, del } from './client';
import { apiClient } from './client';
import type { Epic, EpicSummary, PaginatedResponse, QueryParams } from '@/types';

const BASE = '/epics';

export const epicsApi = {
  // GET /epics?project_id=... (backend is registered at /epics, NOT /projects/:id/epics)
  list: (projectId: string, params?: QueryParams) =>
    get<PaginatedResponse<EpicSummary>>(`${BASE}`, {
      params: { project_id: projectId, page_size: 500, ...params },
    }),

  get: (id: string) =>
    get<Epic>(`${BASE}/${id}`),

  // POST /epics  — project_id goes in the body
  create: (projectId: string, data: CreateEpicRequest) =>
    post<Epic>(`${BASE}`, { ...data, project_id: projectId }),

  // PUT /epics/:id
  update: (id: string, data: Partial<CreateEpicRequest>) =>
    put<Epic>(`${BASE}/${id}`, data),

  // PATCH /epics/:id
  patch: (id: string, data: Partial<Epic>) =>
    patch<Epic>(`${BASE}/${id}`, data),

  delete: (id: string) =>
    del<void>(`${BASE}/${id}`),

  reorder: (projectId: string, orderedIds: string[]) =>
    patch<void>(`/projects/${projectId}/epics/reorder`, { orderedIds }),

  generateStories: (id: string) =>
    post<{ requestId: string }>(`${BASE}/${id}/ai-generate-stories`),

  // AI: generate epics from existing requirements
  // Uses a long timeout (10 min) because multi-pass LLM generation can take several minutes.
  generateFromRequirements: async (projectId: string, requirementIds?: string[]) => {
    const res = await apiClient.post<{ epics: object[]; count: number; requirements_used: number; chunks_processed: number }>(
      `${BASE}/generate-from-requirements`,
      { project_id: projectId, requirement_ids: requirementIds ?? null },
      { timeout: 600_000 },   // 10-minute timeout for long-running LLM calls
    );
    return res.data;
  },

  // Get requirements linked to an epic
  getRequirements: (epicId: string) =>
    get<{ items: object[]; total: number }>(`${BASE}/${epicId}/requirements`),

  // Delete ALL epics for a project (before clean regenerate)
  clearAll: (projectId: string) =>
    del<{ deleted: number }>(`${BASE}?project_id=${projectId}`),
};

interface CreateEpicRequest {
  title: string;
  description?: string;
  priority?: string;
  color?: string;
  startDate?: string;
  targetDate?: string;
  parentEpicId?: string;
  assigneeIds?: string[];
  tags?: string[];
}
