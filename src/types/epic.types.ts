import type { UUID, Nullable, Auditable, Priority, Tag } from './common.types';
import type { UserSummary } from './user.types';
import type { AIGenerationMeta } from './ai.types';

export type EpicStatus =
  | 'backlog'
  | 'planning'
  | 'in_progress'
  | 'review'
  | 'done'
  | 'cancelled';

export interface Epic extends Auditable {
  id: UUID;
  projectId: UUID;
  identifier: string;         // e.g., "EPIC-001"
  title: string;
  description: Nullable<string>;
  status: EpicStatus;
  priority: Priority;
  startDate: Nullable<string>;
  targetDate: Nullable<string>;
  completedDate: Nullable<string>;
  owner: UserSummary;
  assignees: UserSummary[];
  tags: Tag[];
  color: string;
  storyCount: number;
  completedStoryCount: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  completionPercentage: number;
  requirementCount: number;
  aiMeta: Nullable<AIGenerationMeta>;
  isAiGenerated: boolean;
  sortOrder: number;
  parentEpicId: Nullable<UUID>;
  childEpics: EpicSummary[];
}

export interface EpicSummary {
  id: UUID;
  identifier: string;
  title: string;
  status: EpicStatus;
  priority: Priority;
  color: string;
  completionPercentage: number;
  storyCount: number;
  owner: UserSummary;
}
