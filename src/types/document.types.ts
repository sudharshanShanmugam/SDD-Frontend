import type { UUID, Nullable, Auditable, Tag, FileAttachment } from './common.types';
import type { UserSummary } from './user.types';
import type { AIGenerationMeta } from './ai.types';

export type DocumentType =
  | 'sdd'
  | 'brd'
  | 'prd'
  | 'technical_spec'
  | 'architecture'
  | 'api_spec'
  | 'test_plan'
  | 'user_manual'
  | 'release_notes'
  | 'custom';

export type DocumentStatus = 'draft' | 'in_review' | 'approved' | 'published' | 'archived' | 'deprecated';

export interface Document extends Auditable {
  id: UUID;
  projectId: UUID;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  content: DocumentContent;
  summary: Nullable<string>;
  version: string;
  versionNumber: number;
  owner: UserSummary;
  contributors: UserSummary[];
  reviewers: UserSummary[];
  approvers: UserSummary[];
  tags: Tag[];
  attachments: FileAttachment[];
  isTemplate: boolean;
  templateId: Nullable<UUID>;
  parentDocumentId: Nullable<UUID>;
  aiMeta: Nullable<AIGenerationMeta>;
  isAiGenerated: boolean;
  isLocked: boolean;
  lockedBy: Nullable<UserSummary>;
  lockedAt: Nullable<string>;
  publishedAt: Nullable<string>;
  archivedAt: Nullable<string>;
  stats: DocumentStats;
}

export interface DocumentContent {
  format: 'markdown' | 'tiptap' | 'html';
  body: string;
  outline: DocumentOutlineItem[];
  metadata: Record<string, unknown>;
}

export interface DocumentOutlineItem {
  id: string;
  level: number;
  title: string;
  children: DocumentOutlineItem[];
}

export interface DocumentStats {
  wordCount: number;
  readingTimeMinutes: number;
  requirementCount: number;
  commentCount: number;
  viewCount: number;
  lastViewedAt: Nullable<string>;
}

export interface DocumentVersion {
  id: UUID;
  documentId: UUID;
  version: string;
  versionNumber: number;
  title: string;
  summary: Nullable<string>;
  changedBy: UserSummary;
  changedAt: string;
  changeNote: Nullable<string>;
  isCurrentVersion: boolean;
}

export interface DocumentTemplate {
  id: UUID;
  name: string;
  description: string;
  type: DocumentType;
  content: DocumentContent;
  isDefault: boolean;
  isCustom: boolean;
  tags: Tag[];
  usageCount: number;
  previewImageUrl: Nullable<string>;
}
