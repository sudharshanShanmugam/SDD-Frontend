import { get, post, del } from './client';
import type {
  AIRequest,
  AIContext,
  AITaskType,
  AIModel,
  AIChatSession,
  AIChatMessage,
  AISuggestion,
  AIUsageStats,
  AIStreamChunk,
} from '@/types';

const BASE = '/ai';

export const aiApi = {
  // ── Requests ────────────────────────────────────────────

  createRequest: (data: CreateAIRequestBody) =>
    post<AIRequest>(`${BASE}/requests`, data),

  getRequest: (requestId: string) =>
    get<AIRequest>(`${BASE}/requests/${requestId}`),

  listRequests: (projectId: string, params?: { page?: number; pageSize?: number }) =>
    get<{ data: AIRequest[]; total: number }>(`/projects/${projectId}/ai/requests`, { params }),

  cancelRequest: (requestId: string) =>
    post<void>(`${BASE}/requests/${requestId}/cancel`),

  // ── Chat ────────────────────────────────────────────────

  listChatSessions: (projectId?: string) =>
    get<AIChatSession[]>(`${BASE}/chat/sessions`, { params: { projectId } }),

  getChatSession: (sessionId: string) =>
    get<AIChatSession>(`${BASE}/chat/sessions/${sessionId}`),

  createChatSession: (data: { title?: string; projectId?: string; model?: AIModel }) =>
    post<AIChatSession>(`${BASE}/chat/sessions`, data),

  sendMessage: (sessionId: string, content: string, attachments?: Array<{ type: string; id: string }>) =>
    post<AIChatMessage>(`${BASE}/chat/sessions/${sessionId}/messages`, {
      content,
      attachments,
    }),

  deleteChatSession: (sessionId: string) =>
    del<void>(`${BASE}/chat/sessions/${sessionId}`),

  // ── Streaming ───────────────────────────────────────────

  streamRequest: (
    requestId: string,
    onChunk: (chunk: AIStreamChunk) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ) => {
    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_BASE_URL as string}/api/v1${BASE}/requests/${requestId}/stream`,
      { withCredentials: true }
    );

    eventSource.onmessage = (event: MessageEvent) => {
      try {
        const chunk = JSON.parse(event.data as string) as AIStreamChunk;
        onChunk(chunk);
        if (chunk.type === 'complete' || chunk.type === 'error') {
          eventSource.close();
          if (chunk.type === 'complete') onComplete?.();
          if (chunk.type === 'error') onError?.(new Error(chunk.error));
        }
      } catch {
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      onError?.(new Error('Stream connection failed'));
    };

    return () => eventSource.close();
  },

  // ── Suggestions ─────────────────────────────────────────

  getSuggestions: (projectId: string) =>
    get<AISuggestion[]>(`/projects/${projectId}/ai/suggestions`),

  dismissSuggestion: (suggestionId: string) =>
    post<void>(`${BASE}/suggestions/${suggestionId}/dismiss`),

  applySuggestion: (suggestionId: string) =>
    post<void>(`${BASE}/suggestions/${suggestionId}/apply`),

  // ── Generation shortcuts ─────────────────────────────────

  generateRequirements: (projectId: string, context: AIContext) =>
    post<AIRequest>(`/projects/${projectId}/ai/generate-requirements`, { context }),

  generateAcceptanceCriteria: (storyId: string) =>
    post<AIRequest>(`/stories/${storyId}/ai/generate-ac`),

  generateDocument: (projectId: string, type: string, context: AIContext) =>
    post<AIRequest>(`/projects/${projectId}/ai/generate-document`, { type, context }),

  analyzeGaps: (projectId: string) =>
    post<AIRequest>(`/projects/${projectId}/ai/analyze-gaps`),

  detectConflicts: (projectId: string) =>
    post<AIRequest>(`/projects/${projectId}/ai/detect-conflicts`),

  estimateEffort: (storyId: string) =>
    post<AIRequest>(`/stories/${storyId}/ai/estimate-effort`),

  // ── Usage & Analytics ───────────────────────────────────

  getUsageStats: (orgId: string, period?: { start: string; end: string }) =>
    get<AIUsageStats>(`/organizations/${orgId}/ai/usage`, { params: period }),

  // ── Models ──────────────────────────────────────────────

  listAvailableModels: () =>
    get<{ models: Array<{ id: AIModel; name: string; description: string; maxTokens: number }> }>(
      `${BASE}/models`
    ),
};

interface CreateAIRequestBody {
  taskType: AITaskType;
  model?: AIModel;
  context: AIContext;
  projectId: string;
  entityId?: string;
  entityType?: string;
}
