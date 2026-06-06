import React from 'react'
import { Chip, type ChipProps } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'

// ============================================================
// Types
// ============================================================

export type StatusValue =
  | 'approved'
  | 'published'
  | 'completed'
  | 'done'
  | 'passed'
  | 'active'
  | 'pending'
  | 'in_progress'
  | 'in_review'
  | 'review'
  | 'running'
  | 'queued'
  | 'rejected'
  | 'failed'
  | 'blocked'
  | 'error'
  | 'cancelled'
  | 'archived'
  | 'deprecated'
  | 'draft'
  | 'backlog'
  | 'todo'
  | 'planning'
  | 'on_hold'
  | string

interface StatusConfig {
  color: ChipProps['color']
  label?: string
  dotColor: string
}

// ============================================================
// Status Map
// ============================================================

const STATUS_MAP: Record<string, StatusConfig> = {
  // Success states
  approved:    { color: 'success', dotColor: '#10B981' },
  published:   { color: 'success', dotColor: '#10B981' },
  completed:   { color: 'success', dotColor: '#10B981' },
  done:        { color: 'success', dotColor: '#10B981' },
  passed:      { color: 'success', dotColor: '#10B981' },
  active:      { color: 'success', dotColor: '#10B981' },

  // Info / In-progress states
  pending:     { color: 'info', dotColor: '#3B82F6' },
  in_progress: { color: 'info', dotColor: '#3B82F6' },
  in_review:   { color: 'info', dotColor: '#3B82F6' },
  review:      { color: 'info', dotColor: '#3B82F6' },
  running:     { color: 'info', dotColor: '#3B82F6' },
  queued:      { color: 'info', dotColor: '#3B82F6' },
  planning:    { color: 'info', dotColor: '#3B82F6' },

  // Warning states
  on_hold:     { color: 'warning', dotColor: '#F59E0B' },

  // Error states
  rejected:    { color: 'error', dotColor: '#EF4444' },
  failed:      { color: 'error', dotColor: '#EF4444' },
  blocked:     { color: 'error', dotColor: '#EF4444' },
  error:       { color: 'error', dotColor: '#EF4444' },

  // Neutral / Default states
  draft:       { color: 'default', dotColor: '#64748B' },
  backlog:     { color: 'default', dotColor: '#64748B' },
  todo:        { color: 'default', dotColor: '#94A3B8' },
  cancelled:   { color: 'default', dotColor: '#94A3B8' },
  archived:    { color: 'default', dotColor: '#94A3B8' },
  deprecated:  { color: 'default', dotColor: '#94A3B8' },
}

const DISPLAY_LABELS: Record<string, string> = {
  in_progress: 'In Progress',
  in_review:   'In Review',
  on_hold:     'On Hold',
}

function getStatusConfig(status: string): StatusConfig {
  return STATUS_MAP[status.toLowerCase()] ?? { color: 'default', dotColor: '#94A3B8' }
}

function formatLabel(status: string): string {
  if (DISPLAY_LABELS[status.toLowerCase()]) {
    return DISPLAY_LABELS[status.toLowerCase()]
  }
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ============================================================
// Status Badge Component
// ============================================================

export interface StatusBadgeProps {
  status: StatusValue
  /** Override label */
  label?: string
  size?: 'small' | 'medium'
  /** Show colored dot before label */
  showDot?: boolean
  sx?: SxProps<Theme>
  variant?: 'filled' | 'outlined'
}

export function StatusBadge({
  status,
  label,
  size = 'small',
  showDot = false,
  sx,
  variant = 'filled',
}: StatusBadgeProps): React.JSX.Element {
  const config = getStatusConfig(status)
  const displayLabel = label ?? formatLabel(status)

  return (
    <Chip
      label={
        showDot ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: config.dotColor,
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            {displayLabel}
          </span>
        ) : displayLabel
      }
      color={config.color}
      size={size}
      variant={variant}
      sx={{
        fontWeight: 500,
        letterSpacing: '0.01em',
        borderRadius: 999,
        ...sx,
      }}
    />
  )
}

export default StatusBadge
