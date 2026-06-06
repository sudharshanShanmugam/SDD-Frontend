import { get, post, put, del } from './client';
import type { Sprint, SprintSummary, PaginatedResponse } from '@/types';

const BASE = '/sprints';

export const sprintsApi = {
  list: (projectId: string) =>
    get<PaginatedResponse<SprintSummary>>(`${BASE}`, { params: { project_id: projectId } }),

  get: (id: string) =>
    get<Sprint>(`${BASE}/${id}`),

  /** POST /sprints — backend expects snake_case body fields */
  create: (projectId: string, data: CreateSprintRequest) =>
    post<Sprint>(`${BASE}`, {
      project_id:      projectId,
      name:            data.name,
      goal:            data.goal,
      start_date:      data.startDate,
      end_date:        data.endDate,
      capacity_points: data.capacityPoints,
    }),

  update: (id: string, data: Partial<CreateSprintRequest>) =>
    put<Sprint>(`${BASE}/${id}`, data),

  delete: (id: string) =>
    del<void>(`${BASE}/${id}`),

  // Backend uses POST (not PATCH) for start and complete
  start: (id: string) =>
    post<Sprint>(`${BASE}/${id}/start`, {}),

  // Backend pattern: backlog | next_sprint  (not move_backlog / move_next_sprint)
  complete: (id: string, unfinishedStoryAction: 'backlog' | 'next_sprint' = 'backlog') =>
    post<Sprint>(`${BASE}/${id}/complete`, { incomplete_story_action: unfinishedStoryAction }),

  /** POST /sprints/{id}/stories — backend reads { storyId } via Pydantic alias */
  addStory: (id: string, storyId: string) =>
    post<void>(`${BASE}/${id}/stories`, { storyId }),

  removeStory: (id: string, storyId: string) =>
    del<void>(`${BASE}/${id}/stories/${storyId}`),

  getBurndown: (id: string) =>
    get<Sprint['burndownData']>(`${BASE}/${id}/burndown`),

  /** POST /sprints/clear-plan?project_id=xxx — deletes all planning sprints + unassigns stories */
  clearPlan: (projectId: string) =>
    post<{ cleared_sprints: number; unassigned_stories: number }>(
      `${BASE}/clear-plan?project_id=${encodeURIComponent(projectId)}`,
    ),
};

export interface CreateSprintRequest {
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  capacityPoints?: number;
}
