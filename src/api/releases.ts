import { get, post, put, patch, del } from './client'
import type { PaginatedResponse, QueryParams, UserSummary } from '@/types'

const BASE = '/releases'

export type ReleaseStatus = 'planning' | 'in_development' | 'staging' | 'released' | 'cancelled'
export type DeploymentStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'rolled_back'
export type DeploymentEnvironment = 'development' | 'staging' | 'production'

export interface Release {
  id:           string
  projectId:    string
  name:         string
  version:      string
  status:       ReleaseStatus
  description?: string
  targetDate?:  string
  releasedAt?:  string
  storyIds:     string[]
  storyCount:   number
  completedStoryCount: number
  owner:        UserSummary
  deployments:  Deployment[]
  notes?:       string
  createdAt:    string
  updatedAt:    string
}

export interface Deployment {
  id:          string
  releaseId:   string
  environment: DeploymentEnvironment
  status:      DeploymentStatus
  version:     string
  triggeredBy: UserSummary
  startedAt:   string
  completedAt?: string
  logs?:       string[]
  rollbackId?: string
}

export const releasesApi = {
  list: (projectId: string, params?: QueryParams) =>
    get<PaginatedResponse<Release>>(`/projects/${projectId}/releases`, { params }),

  get: (id: string) =>
    get<Release>(`${BASE}/${id}`),

  create: (projectId: string, data: Partial<Release>) =>
    post<Release>(`/projects/${projectId}/releases`, data),

  update: (id: string, data: Partial<Release>) =>
    put<Release>(`${BASE}/${id}`, data),

  delete: (id: string) =>
    del<void>(`${BASE}/${id}`),

  addStory: (id: string, storyId: string) =>
    post<void>(`${BASE}/${id}/stories`, { storyId }),

  removeStory: (id: string, storyId: string) =>
    del<void>(`${BASE}/${id}/stories/${storyId}`),

  // Deployments
  deploy: (id: string, environment: DeploymentEnvironment) =>
    post<Deployment>(`${BASE}/${id}/deploy`, { environment }),

  rollback: (deploymentId: string) =>
    post<Deployment>(`${BASE}/deployments/${deploymentId}/rollback`),

  getDeployments: (releaseId: string) =>
    get<Deployment[]>(`${BASE}/${releaseId}/deployments`),
}
