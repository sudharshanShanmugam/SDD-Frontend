import type { UUID, Nullable, Auditable, Priority } from './common.types';
import type { UserSummary } from './user.types';

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
export type TaskType = 'development' | 'design' | 'testing' | 'documentation' | 'devops' | 'other';

export interface Task extends Auditable {
  id: UUID;
  storyId: UUID;
  projectId: UUID;
  identifier: string;
  title: string;
  description: Nullable<string>;
  type: TaskType;
  status: TaskStatus;
  priority: Priority;
  assignee: Nullable<UserSummary>;
  reporter: UserSummary;
  estimatedHours: Nullable<number>;
  loggedHours: number;
  dueDate: Nullable<string>;
  startedAt: Nullable<string>;
  completedAt: Nullable<string>;
  sortOrder: number;
  isBlocked: boolean;
  blockedBy: UUID[];
  subTasks: TaskSummary[];
  parentTaskId: Nullable<UUID>;
  tags: string[];
  checklist: ChecklistItem[];
}

export interface TaskSummary {
  id: UUID;
  identifier: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  assignee: Nullable<UserSummary>;
  estimatedHours: Nullable<number>;
}

export interface ChecklistItem {
  id: UUID;
  text: string;
  isCompleted: boolean;
  completedAt: Nullable<string>;
  completedBy: Nullable<UserSummary>;
}

export interface TimeLog extends Auditable {
  id: UUID;
  taskId: UUID;
  userId: UUID;
  user: UserSummary;
  hours: number;
  description: Nullable<string>;
  loggedDate: string;
}
