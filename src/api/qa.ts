import { get, post, put, patch, del } from './client'
import type { PaginatedResponse, QueryParams } from '@/types'

const BASE = '/qa'

export interface TestCase {
  id:           string
  projectId:    string
  requirementId?: string
  storyId?:     string
  identifier:   string
  title:        string
  description:  string
  type:         'manual' | 'automated' | 'integration' | 'e2e'
  status:       'draft' | 'ready' | 'running' | 'passed' | 'failed' | 'blocked' | 'skipped'
  priority:     'critical' | 'high' | 'medium' | 'low'
  steps:        TestStep[]
  expectedResult: string
  actualResult?:  string
  automationScript?: string
  tags:         string[]
  createdAt:    string
  updatedAt:    string
}

export interface TestStep {
  id:     string
  order:  number
  action: string
  expected: string
  actual?:  string
  status?:  'pass' | 'fail' | 'skip'
}

export interface TestRun {
  id:          string
  projectId:   string
  name:        string
  status:      'pending' | 'running' | 'passed' | 'failed' | 'cancelled'
  environment: string
  testCaseIds: string[]
  results:     TestResult[]
  startedAt?:  string
  completedAt?: string
  triggeredBy: string
  stats: {
    total:   number
    passed:  number
    failed:  number
    skipped: number
  }
}

export interface TestResult {
  id:         string
  testCaseId: string
  status:     'passed' | 'failed' | 'skipped' | 'blocked'
  duration:   number
  error?:     string
  logs?:      string[]
  executedAt: string
}

export const qaApi = {
  listTestCases: (projectId: string, params?: QueryParams) =>
    get<PaginatedResponse<TestCase>>(`/projects/${projectId}/test-cases`, { params }),

  getTestCase: (id: string) =>
    get<TestCase>(`${BASE}/test-cases/${id}`),

  createTestCase: (projectId: string, data: Partial<TestCase>) =>
    post<TestCase>(`/projects/${projectId}/test-cases`, data),

  updateTestCase: (id: string, data: Partial<TestCase>) =>
    put<TestCase>(`${BASE}/test-cases/${id}`, data),

  deleteTestCase: (id: string) =>
    del<void>(`${BASE}/test-cases/${id}`),

  // Runs
  listTestRuns: (projectId: string) =>
    get<PaginatedResponse<TestRun>>(`/projects/${projectId}/test-runs`),

  createTestRun: (projectId: string, testCaseIds: string[], name: string, environment: string) =>
    post<TestRun>(`/projects/${projectId}/test-runs`, { testCaseIds, name, environment }),

  getTestRun: (id: string) =>
    get<TestRun>(`${BASE}/test-runs/${id}`),

  executeTestRun: (id: string) =>
    patch<TestRun>(`${BASE}/test-runs/${id}/execute`),

  submitResult: (runId: string, result: Omit<TestResult, 'id' | 'executedAt'>) =>
    post<TestResult>(`${BASE}/test-runs/${runId}/results`, result),

  // AI
  generateTestCases: (requirementId: string) =>
    post<{ requestId: string }>(`/requirements/${requirementId}/ai-generate-tests`),
}
