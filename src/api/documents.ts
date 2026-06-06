import { get, post, put, patch, del } from './client';
import type { Document, DocumentVersion, DocumentTemplate, PaginatedResponse, QueryParams } from '@/types';

const BASE = '/documents';

export const documentsApi = {
  list: (projectId?: string, params?: QueryParams) =>
    get<PaginatedResponse<Document>>(`/documents`, { params: { ...(projectId ? { project_id: projectId } : {}), ...params } }),

  get: (id: string) =>
    get<Document>(`${BASE}/${id}`),

  create: (projectId: string, data: CreateDocumentRequest) =>
    post<Document>(`/projects/${projectId}/documents`, data),

  update: (id: string, data: Partial<CreateDocumentRequest>) =>
    put<Document>(`${BASE}/${id}`, data),

  patch: (id: string, data: Partial<Document>) =>
    patch<Document>(`${BASE}/${id}`, data),

  delete: (id: string) =>
    del<void>(`${BASE}/${id}`),

  process: (id: string) =>
    post<{ document_id: string; status: string; page_count: number | null; chunk_count: number; word_count: number }>(
      `${BASE}/${id}/process`, {}
    ),

  extractRequirements: (id: string, projectId?: string) =>
    post<{ document_id: string; requirements_extracted: number; project_id: string; method: string; requirements: Array<{ id: string; req_number: string; title: string; type: string; priority: string }> }>(
      `${BASE}/${id}/extract-requirements${projectId ? `?project_id=${projectId}` : ''}`,
      {},
      { timeout: 900_000 }, // 15-min timeout — full doc (40 chunks × 8k tokens) can take several minutes
    ),

  publish: (id: string) =>
    patch<Document>(`${BASE}/${id}/publish`),

  archive: (id: string) =>
    patch<Document>(`${BASE}/${id}/archive`),

  // Versions
  getVersions: (id: string) =>
    get<DocumentVersion[]>(`${BASE}/${id}/versions`),

  getVersion: (id: string, version: number) =>
    get<DocumentVersion>(`${BASE}/${id}/versions/${version}`),

  // Templates
  listTemplates: () =>
    get<DocumentTemplate[]>(`${BASE}/templates`),

  createFromTemplate: (templateId: string, projectId: string, name: string) =>
    post<Document>(`${BASE}/templates/${templateId}/create`, { projectId, name }),

  // AI
  generateDocument: (projectId: string, type: string) =>
    post<Document>(`/projects/${projectId}/documents/ai-generate`, { type }),

  // Export
  export: (id: string, format: 'pdf' | 'docx' | 'markdown') =>
    get<Blob>(`${BASE}/${id}/export`, { params: { format }, responseType: 'blob' }),
};

interface CreateDocumentRequest {
  title: string;
  type: Document['type'];
  content?: Document['content'];
  summary?: string;
  templateId?: string;
}
