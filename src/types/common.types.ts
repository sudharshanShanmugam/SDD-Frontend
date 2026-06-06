// ============================================================
// Common / Shared Types
// ============================================================

export type UUID = string;
export type ISO8601 = string;
export type URL = string;

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export interface Timestamps {
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export interface SoftDelete {
  deletedAt: Nullable<ISO8601>;
  isDeleted: boolean;
}

export interface Auditable extends Timestamps {
  createdBy: UUID;
  updatedBy: UUID;
}

// ============================================================
// Pagination
// ============================================================

export interface PaginationParams {
  page: number;
  pageSize: number;
  cursor?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ============================================================
// Sorting & Filtering
// ============================================================

export type SortOrder = 'asc' | 'desc';

export interface SortParams {
  field: string;
  order: SortOrder;
}

export type FilterOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'nin'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'isNull'
  | 'isNotNull';

export interface FilterParam {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | string[] | number[];
}

export interface QueryParams extends Partial<PaginationParams> {
  sort?: SortParams[];
  filters?: FilterParam[];
  search?: string;
  include?: string[];
}

// ============================================================
// API Response
// ============================================================

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    requestId?: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ============================================================
// Select Options
// ============================================================

export interface SelectOption<T = string> {
  label: string;
  value: T;
  description?: string;
  icon?: string;
  disabled?: boolean;
  group?: string;
}

export interface TreeSelectOption<T = string> extends SelectOption<T> {
  children?: TreeSelectOption<T>[];
  level?: number;
  parentValue?: T;
}

// ============================================================
// Status & Priority
// ============================================================

export type Status =
  | 'draft'
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'completed'
  | 'archived'
  | 'cancelled';

export type Priority = 'critical' | 'high' | 'medium' | 'low';

export type WorkflowState =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'in_review'
  | 'done'
  | 'cancelled';

// ============================================================
// File / Media
// ============================================================

export interface FileAttachment {
  id: UUID;
  name: string;
  size: number;
  mimeType: string;
  url: URL;
  thumbnailUrl?: URL;
  uploadedBy: UUID;
  uploadedAt: ISO8601;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// ============================================================
// Notifications
// ============================================================

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'ai_complete'
  | 'mention'
  | 'approval_request'
  | 'approval_decision'
  | 'comment';

export interface Notification {
  id: UUID;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  metadata?: Record<string, unknown>;
  createdAt: ISO8601;
}

// ============================================================
// Comments
// ============================================================

export interface Comment extends Auditable {
  id: UUID;
  content: string;
  entityType: string;
  entityId: UUID;
  parentId: Nullable<UUID>;
  replies?: Comment[];
  reactions: CommentReaction[];
  isEdited: boolean;
  mentions: UUID[];
}

export interface CommentReaction {
  emoji: string;
  count: number;
  users: UUID[];
  hasReacted: boolean;
}

// ============================================================
// Activity / Audit Log
// ============================================================

export type ActivityAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'approved'
  | 'rejected'
  | 'commented'
  | 'mentioned'
  | 'assigned'
  | 'status_changed'
  | 'priority_changed'
  | 'ai_generated'
  | 'exported'
  | 'imported';

export interface ActivityLog extends Timestamps {
  id: UUID;
  action: ActivityAction;
  entityType: string;
  entityId: UUID;
  entityName: string;
  userId: UUID;
  userName: string;
  userAvatar?: URL;
  changes?: ActivityChange[];
  metadata?: Record<string, unknown>;
}

export interface ActivityChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

// ============================================================
// Tags & Labels
// ============================================================

export interface Tag {
  id: UUID;
  name: string;
  color: string;
  description?: string;
}

// ============================================================
// Breadcrumb
// ============================================================

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
}

// ============================================================
// Table Column
// ============================================================

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  width?: number | string;
  minWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  pinned?: 'left' | 'right';
  hidden?: boolean;
  renderCell?: (value: unknown, row: T) => React.ReactNode;
}

// ============================================================
// Modal / Dialog
// ============================================================

export interface ModalState {
  isOpen: boolean;
  title?: string;
  data?: unknown;
}

// ============================================================
// Theme
// ============================================================

export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'indigo' | 'blue' | 'purple' | 'teal' | 'emerald';
