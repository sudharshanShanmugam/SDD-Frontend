import type { UUID, Nullable, Auditable } from './common.types';
import type { UserSummary } from './user.types';
import type { StorySummary } from './story.types';

export type SprintStatus = 'planning' | 'active' | 'review' | 'retrospective' | 'completed' | 'cancelled';

export interface Sprint extends Auditable {
  id: UUID;
  projectId: UUID;
  name: string;
  goal: Nullable<string>;
  status: SprintStatus;
  startDate: string;
  endDate: string;
  completedDate: Nullable<string>;
  stories: StorySummary[];
  storyCount: number;
  completedStoryCount: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  velocity: number;
  burndownData: BurndownPoint[];
  capacity: SprintCapacity[];
  retrospective: Nullable<SprintRetrospective>;
  owner: UserSummary;
  isActive: boolean;
}

export interface SprintSummary {
  id: UUID;
  name: string;
  status: SprintStatus;
  startDate: string;
  endDate: string;
  storyCount: number;
  completedStoryPoints: number;
  totalStoryPoints: number;
  /** AI-generated sprint goal — persisted to DB by plan-sprints */
  goal: Nullable<string>;
  /** Sprint number within the project */
  sprintNumber: number;
  capacityPoints: Nullable<number>;
  committedPoints: number;
}

export interface BurndownPoint {
  date: string;
  remaining: number;
  ideal: number;
  completed: number;
}

export interface SprintCapacity {
  userId: UUID;
  user: UserSummary;
  availableHours: number;
  allocatedHours: number;
}

export interface SprintRetrospective {
  id: UUID;
  sprintId: UUID;
  wentWell: string[];
  improvements: string[];
  actionItems: RetroActionItem[];
  facilitatedBy: UserSummary;
  completedAt: string;
}

export interface RetroActionItem {
  id: UUID;
  description: string;
  owner: UserSummary;
  dueDate: Nullable<string>;
  isCompleted: boolean;
}
