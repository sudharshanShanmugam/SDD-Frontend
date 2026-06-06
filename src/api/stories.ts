import { get, post, put, patch, del } from './client';
import { apiClient } from './client';
import type { Story, StorySummary, PaginatedResponse, QueryParams } from '@/types';

const BASE = '/stories';

export const storiesApi = {
  // List stories by project (using direct /stories?project_id= endpoint)
  list: (projectId: string, params?: QueryParams & { sprint_id?: string }) =>
    get<PaginatedResponse<StorySummary>>(`${BASE}`, {
      params: { project_id: projectId, page_size: 500, ...params },
    }),

  get: (id: string) =>
    get<Story>(`${BASE}/${id}`),

  create: (projectId: string, data: CreateStoryRequest) =>
    post<Story>(`${BASE}`, { ...data, project_id: projectId }),

  update: (id: string, data: Partial<CreateStoryRequest>) =>
    put<Story>(`${BASE}/${id}`, data),

  patch: (id: string, data: Partial<Story>) =>
    patch<Story>(`${BASE}/${id}`, data),

  delete: (id: string) =>
    del<void>(`${BASE}/${id}`),

  move: (id: string, sprintId: string | null) =>
    patch<Story>(`${BASE}/${id}/sprint`, { sprint_id: sprintId }),

  generateTests: (id: string) =>
    post<TestGenerationResult>(`${BASE}/${id}/generate-tests`, {}, { timeout: 180_000 }),

  generateAC: (id: string) =>
    post<{ requestId: string }>(`${BASE}/${id}/ai-generate-ac`),

  estimateEffort: (id: string) =>
    post<{ requestId: string }>(`${BASE}/${id}/ai-estimate`),

  // AI: generate stories from requirements (long timeout — LLM can take several minutes)
  generateFromRequirements: async (
    projectId: string,
    requirementIds?: string[],
  ) => {
    const res = await apiClient.post<{
      stories: object[];
      count: number;
      requirements_used: number;
      batches_processed: number;
    }>(
      `${BASE}/generate-from-requirements`,
      { project_id: projectId, requirement_ids: requirementIds ?? null },
      { timeout: 600_000 },  // 10-minute timeout for long-running LLM calls
    );
    return res.data;
  },

  // Delete ALL stories for a project (before clean regenerate)
  clearAll: (projectId: string) =>
    del<{ deleted: number }>(`${BASE}?project_id=${projectId}`),
};

interface CreateStoryRequest {
  title: string;
  description?: string;
  type?: Story['type'];
  priority?: Story['priority'];
  storyPoints?: number;
  asA?: string;
  iWant?: string;
  soThat?: string;
  epicId?: string;
  sprintId?: string;
  assigneeId?: string;
  tags?: string[];
  dueDate?: string;
}

export interface QATestScenario {
  id: string
  type: string
  scenario_type: string
  title: string
  description: string
  preconditions: string[]
  steps: string[]
  expected_result: string
  risk_level: string
  traceability: string
}

export interface QAGherkinCase {
  feature: string
  scenario_title: string
  tags: string[]
  given: string[]
  when: string[]
  then: string[]
}

export interface TestGenerationResult {
  story: { id: string; identifier: string; title: string; status: string; priority: string }
  brain1: {
    nodes: Array<{ id: string; type: string; label: string; data: Record<string, unknown> }>
    edges: Array<{ from: string; to: string; relation: string }>
    summary: string
  }
  brain2: Record<string, unknown>
  brain3: {
    feature_name?: string
    detected_module?: string
    detected_priority?: string
    overall_risk?: string
    complexity_level?: string
    feature_status?: string
    feature_status_reason?: string
    feature_understanding?: string
    impacted_modules?: Array<{ id: string; name: string; impact_type: string; criticality: number; description?: string }>
    event_flow?: Array<{ step: number; layer: string; component: string; action: string; data?: string; validation_point: string }>
    risk_areas?: Array<{ feature: string; module: string; risk_score: number; priority: string; reasons: string[]; past_bug_count: number }>
    heads_up_warnings?: Array<{ warning: string; recommendation: string; severity?: string }>
    test_scenarios?: QATestScenario[]
    gherkin_test_cases?: QAGherkinCase[]
    regression_suite?: Array<{ test_case_name: string; priority: string; module: string; reason: string }>
    missing_coverage?: Array<{ area: string; description: string; recommendation?: string }>
    api_event_validation?: Array<{ endpoint: string; method: string; validations: string[]; event_triggers: string[]; db_impacts: string[] }>
    rag_chunks_used?: number
    error?: string
    raw?: string
    parse_error?: string
  }
}
