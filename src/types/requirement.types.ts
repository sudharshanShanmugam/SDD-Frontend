import type { UUID, Nullable, Auditable, Priority, Status, Tag, FileAttachment } from './common.types';
import type { UserSummary } from './user.types';
import type { AIGenerationMeta } from './ai.types';

export type RequirementType =
  | 'functional'
  | 'non_functional'
  | 'business'
  | 'technical'
  | 'security'
  | 'performance'
  | 'usability'
  | 'regulatory'
  | 'interface';

export type RequirementStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'implemented'
  | 'deprecated';

export interface Requirement extends Auditable {
  id: UUID;
  projectId: UUID;
  documentId: Nullable<UUID>;
  storyId: Nullable<UUID>;
  identifier: string;             // e.g., "REQ-001"
  title: string;
  description: string;
  type: RequirementType;
  status: RequirementStatus;
  priority: Priority;
  source: string;
  rationale: Nullable<string>;
  acceptanceCriteria: string[];
  testCases: string[];
  dependencies: UUID[];
  relatedRequirements: UUID[];
  tags: Tag[];
  assignee: Nullable<UserSummary>;
  reviewer: Nullable<UserSummary>;
  approver: Nullable<UserSummary>;
  version: number;
  aiMeta: Nullable<AIGenerationMeta>;
  attachments: FileAttachment[];
  commentCount: number;
  isAiGenerated: boolean;
  isLocked: boolean;
  lockedBy: Nullable<UserSummary>;
  lockedAt: Nullable<string>;
}

export interface RequirementSummary {
  id: UUID;
  identifier: string;
  title: string;
  type: RequirementType;
  status: RequirementStatus;
  priority: Priority;
  assignee: Nullable<UserSummary>;
  aiMeta: Nullable<Pick<AIGenerationMeta, 'confidenceScore'>>;
}

export interface RequirementVersion {
  id: UUID;
  requirementId: UUID;
  version: number;
  title: string;
  description: string;
  changedBy: UserSummary;
  changedAt: string;
  changeNote: Nullable<string>;
  diff: RequirementDiff[];
}

export interface RequirementDiff {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}
