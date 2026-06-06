import { get } from './client';

export interface SearchResult {
  id: string;
  type: 'project' | 'document' | 'requirement' | 'epic' | 'story' | 'task';
  title: string;
  description: string | null;
  projectName: string | null;
  projectId: string | null;
  url: string;
  icon: string;
  updatedAt: string;
  highlight?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  took: number;
}

export const searchApi = {
  global: (query: string, params?: { limit?: number; types?: string[] }) =>
    get<SearchResponse>('/search', { params: { q: query, ...params } }),

  inProject: (projectId: string, query: string, params?: { limit?: number; types?: string[] }) =>
    get<SearchResponse>(`/projects/${projectId}/search`, {
      params: { q: query, ...params },
    }),
};
