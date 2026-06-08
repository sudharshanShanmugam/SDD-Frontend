import { get, post, put, patch, del } from './client';
import type { Task, TaskSummary, TimeLog, PaginatedResponse, QueryParams } from '@/types';

const BASE = '/tasks';

export const tasksApi = {
  list: (storyId: string, params?: QueryParams) =>
    get<PaginatedResponse<TaskSummary>>(`/stories/${storyId}/tasks`, { params }),

  // Lists all tasks for a project — uses GET /tasks?project_id=... (no nested route needed)
  listByProject: (projectId: string, params?: QueryParams & { sprint_id?: string }) =>
    get<PaginatedResponse<Task>>(`${BASE}`, {
      params: { project_id: projectId, page_size: 200, ...params },
    }),

  get: (id: string) =>
    get<Task>(`${BASE}/${id}`),

  create: (storyId: string, data: CreateTaskRequest) =>
    post<Task>(`/stories/${storyId}/tasks`, data),

  update: (id: string, data: Partial<CreateTaskRequest>) =>
    put<Task>(`${BASE}/${id}`, data),

  patch: (id: string, data: Partial<Task> & { assigneeId?: string | null; reporterId?: string | null }) => {
    const { assigneeId, reporterId, ...rest } = data as any;
    const payload = {
      ...rest,
      ...(assigneeId !== undefined ? { assignee_id: assigneeId } : {}),
      ...(reporterId !== undefined ? { reporter_id: reporterId } : {}),
    };
    return patch<Task>(`${BASE}/${id}`, payload);
  },

  delete: (id: string) =>
    del<void>(`${BASE}/${id}`),

  reorder: (storyId: string, orderedIds: string[]) =>
    patch<void>(`/stories/${storyId}/tasks/reorder`, { orderedIds }),

  // Time logs
  logTime: (id: string, data: LogTimeRequest) =>
    post<TimeLog>(`${BASE}/${id}/time-logs`, data),

  getTimeLogs: (id: string) =>
    get<TimeLog[]>(`${BASE}/${id}/time-logs`),

  deleteTimeLog: (taskId: string, logId: string) =>
    del<void>(`${BASE}/${taskId}/time-logs/${logId}`),
};

interface CreateTaskRequest {
  title: string;
  description?: string;
  type?: Task['type'];
  priority?: Task['priority'];
  assigneeId?: string;
  estimatedHours?: number;
  dueDate?: string;
  tags?: string[];
}

interface LogTimeRequest {
  hours: number;
  description?: string;
  loggedDate: string;
}
