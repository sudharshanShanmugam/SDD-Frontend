import type { UUID, Nullable, Auditable } from './common.types';
import type { UserSummary } from './user.types';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';
export type ApprovalEntityType = 'document' | 'requirement' | 'epic' | 'story' | 'release';
export type ApprovalDecision = 'approved' | 'rejected' | 'abstained';

export interface Approval extends Auditable {
  id: UUID;
  entityType: ApprovalEntityType;
  entityId: UUID;
  entityName: string;
  entityVersion: Nullable<string>;
  status: ApprovalStatus;
  requester: UserSummary;
  approvers: ApproverStatus[];
  requiredApprovals: number;
  receivedApprovals: number;
  comment: Nullable<string>;
  dueDate: Nullable<string>;
  completedAt: Nullable<string>;
  workflow: ApprovalWorkflow;
  history: ApprovalHistoryEntry[];
}

export interface ApproverStatus {
  id: UUID;
  user: UserSummary;
  decision: Nullable<ApprovalDecision>;
  comment: Nullable<string>;
  decidedAt: Nullable<string>;
  isRequired: boolean;
  order: number;
}

export interface ApprovalWorkflow {
  id: UUID;
  name: string;
  type: 'sequential' | 'parallel' | 'majority';
  steps: ApprovalWorkflowStep[];
}

export interface ApprovalWorkflowStep {
  id: UUID;
  order: number;
  name: string;
  approvers: UUID[];
  requiredCount: number;
  status: ApprovalStatus;
}

export interface ApprovalHistoryEntry {
  id: UUID;
  userId: UUID;
  user: UserSummary;
  action: 'requested' | 'approved' | 'rejected' | 'cancelled' | 'reassigned' | 'reminded';
  comment: Nullable<string>;
  timestamp: string;
}

export interface SubmitApprovalRequest {
  entityType: ApprovalEntityType;
  entityId: UUID;
  approverIds: UUID[];
  comment?: string;
  dueDate?: string;
  workflowId?: UUID;
}

export interface ApprovalDecisionRequest {
  approvalId: UUID;
  decision: ApprovalDecision;
  comment?: string;
}
