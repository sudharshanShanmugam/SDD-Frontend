import type { UUID, ISO8601, Nullable } from './common.types';

// ============================================================
// AI Meta - attached to AI-generated items
// ============================================================

export interface AIGenerationMeta {
  generatedAt: ISO8601;
  model: string;
  promptVersion: string;
  confidenceScore: number;         // 0-1
  confidenceBreakdown: ConfidenceBreakdown;
  tokens: AITokenUsage;
  suggestedImprovements: string[];
  relatedContext: string[];
  requiresHumanReview: boolean;
  reviewedBy: Nullable<UUID>;
  reviewedAt: Nullable<ISO8601>;
}

export interface ConfidenceBreakdown {
  completeness: number;
  clarity: number;
  technicalAccuracy: number;
  businessAlignment: number;
  testability: number;
}

export interface AITokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

// ============================================================
// AI Request Types
// ============================================================

export type AITaskType =
  | 'generate_requirements'
  | 'generate_stories'
  | 'generate_acceptance_criteria'
  | 'generate_test_cases'
  | 'generate_document'
  | 'summarize'
  | 'improve_quality'
  | 'analyze_gaps'
  | 'suggest_dependencies'
  | 'estimate_effort'
  | 'detect_conflicts'
  | 'translate_language'
  | 'chat';

export type AIModel =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'claude-3-5-sonnet'
  | 'claude-3-haiku'
  | 'gemini-1.5-pro';

export type AIStatus = 'idle' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface AIRequest {
  id: UUID;
  taskType: AITaskType;
  model: AIModel;
  status: AIStatus;
  context: AIContext;
  result: Nullable<AIResult>;
  error: Nullable<string>;
  progress: number;                // 0-100
  startedAt: Nullable<ISO8601>;
  completedAt: Nullable<ISO8601>;
  createdAt: ISO8601;
  userId: UUID;
  projectId: UUID;
  tokens: Nullable<AITokenUsage>;
}

export interface AIContext {
  projectDescription?: string;
  existingRequirements?: string[];
  businessGoals?: string[];
  technicalConstraints?: string[];
  targetUsers?: string[];
  entityId?: UUID;
  entityType?: string;
  additionalContext?: string;
  language?: string;
  tone?: 'formal' | 'technical' | 'business' | 'casual';
  detailLevel?: 'brief' | 'standard' | 'detailed';
}

export interface AIResult {
  taskType: AITaskType;
  data: unknown;
  confidenceScore: number;
  suggestions: string[];
  warnings: string[];
}

// ============================================================
// AI Chat
// ============================================================

export interface AIChatMessage {
  id: UUID;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: ISO8601;
  tokens?: AITokenUsage;
  isStreaming?: boolean;
  attachments?: AIChatAttachment[];
}

export interface AIChatAttachment {
  type: 'requirement' | 'story' | 'document' | 'epic';
  id: UUID;
  name: string;
}

export interface AIChatSession {
  id: UUID;
  title: string;
  messages: AIChatMessage[];
  projectId: Nullable<UUID>;
  model: AIModel;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

// ============================================================
// AI Suggestions
// ============================================================

export interface AISuggestion {
  id: UUID;
  type: 'improvement' | 'missing' | 'conflict' | 'duplicate' | 'dependency';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  entityType: string;
  entityId: UUID;
  suggestedAction: Nullable<string>;
  isApplied: boolean;
  isDismissed: boolean;
  confidenceScore: number;
  generatedAt: ISO8601;
}

// ============================================================
// AI Analytics
// ============================================================

export interface AIUsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  totalCostUsd: number;
  averageConfidenceScore: number;
  requestsByTask: Record<AITaskType, number>;
  requestsByModel: Record<AIModel, number>;
  requestsByDay: AIUsageByDay[];
}

export interface AIUsageByDay {
  date: string;
  requests: number;
  tokens: number;
  costUsd: number;
}

// ============================================================
// Streaming
// ============================================================

export interface AIStreamChunk {
  requestId: UUID;
  type: 'content' | 'progress' | 'complete' | 'error';
  content?: string;
  progress?: number;
  result?: AIResult;
  error?: string;
}
