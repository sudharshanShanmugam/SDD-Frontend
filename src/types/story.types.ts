import type { UUID, Nullable, Auditable, Priority, Tag } from './common.types';
import type { UserSummary } from './user.types';
import type { AIGenerationMeta } from './ai.types';

export type StoryStatus =
  | 'backlog'
  | 'ready'
  | 'in_progress'
  | 'in_review'
  | 'testing'
  | 'done'
  | 'cancelled';

export type StoryType = 'user_story' | 'bug' | 'spike' | 'chore' | 'task';

export interface Story extends Auditable {
  id: UUID;
  projectId: UUID;
  epicId: Nullable<UUID>;
  sprintId: Nullable<UUID>;
  identifier: string;             // e.g., "STORY-001"
  title: string;
  description: Nullable<string>;
  type: StoryType;
  status: StoryStatus;
  priority: Priority;
  storyPoints: Nullable<number>;
  // User story format
  asA: Nullable<string>;
  iWant: Nullable<string>;
  soThat: Nullable<string>;
  acceptanceCriteria: AcceptanceCriterion[];
  assignee: Nullable<UserSummary>;
  reporter: UserSummary;
  reviewers: UserSummary[];
  tags: Tag[];
  taskCount: number;
  completedTaskCount: number;
  requirementCount: number;
  aiMeta: Nullable<AIGenerationMeta>;
  isAiGenerated: boolean;
  isBlocked: boolean;
  blockedBy: UUID[];
  sortOrder: number;
  estimatedHours: Nullable<number>;
  loggedHours: number;
  dueDate: Nullable<string>;
  startedAt: Nullable<string>;
  completedAt: Nullable<string>;
}

export interface StorySummary {
  id: UUID;
  identifier: string;
  title: string;
  type: StoryType;
  status: StoryStatus;
  priority: Priority;
  storyPoints: Nullable<number>;
  assignee: Nullable<UserSummary>;
  epicId: Nullable<UUID>;
  /** Sprint assignment — populated by the backend serializer */
  sprintId: Nullable<UUID>;
}

export interface AcceptanceCriterion {
  id: UUID;
  description: string;
  isCompleted: boolean;
  completedAt: Nullable<string>;
  completedBy: Nullable<UserSummary>;
}
