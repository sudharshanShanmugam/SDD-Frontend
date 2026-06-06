import React, { useState } from 'react'
import {
  Box,
  Collapse,
  IconButton,
  LinearProgress,
  Tooltip,
  Typography,
  type SxProps,
  type Theme,
} from '@mui/material'
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import type { ConfidenceBreakdown } from '@/types/ai.types'

// ============================================================
// Types
// ============================================================

export interface AIConfidenceScoreProps {
  /** 0 to 100 */
  score: number
  breakdown?: ConfidenceBreakdown
  showLabel?: boolean
  showBreakdown?: boolean
  compact?: boolean
  sx?: SxProps<Theme>
}

// ============================================================
// Helpers
// ============================================================

function getScoreColor(score: number): 'error' | 'warning' | 'success' {
  if (score >= 75) return 'success'
  if (score >= 50) return 'warning'
  return 'error'
}

function getScoreLabel(score: number): string {
  if (score >= 85) return 'Very High'
  if (score >= 75) return 'High'
  if (score >= 60) return 'Medium'
  if (score >= 40) return 'Low'
  return 'Very Low'
}

const BREAKDOWN_LABELS: Record<keyof ConfidenceBreakdown, string> = {
  completeness:      'Completeness',
  clarity:           'Clarity',
  technicalAccuracy: 'Technical Accuracy',
  businessAlignment: 'Business Alignment',
  testability:       'Testability',
}

const BREAKDOWN_TOOLTIPS: Record<keyof ConfidenceBreakdown, string> = {
  completeness:      'How complete and comprehensive the generated content is',
  clarity:           'How clear and unambiguous the language and requirements are',
  technicalAccuracy: 'How technically correct and feasible the content is',
  businessAlignment: 'How well aligned with business goals and objectives',
  testability:       'How testable and verifiable the requirements/stories are',
}

// ============================================================
// Breakdown Bar
// ============================================================

interface BreakdownBarProps {
  label: string
  tooltip: string
  value: number // 0-1
}

function BreakdownBar({ label, tooltip, value }: BreakdownBarProps): React.JSX.Element {
  const score = Math.round(value * 100)
  const color = getScoreColor(score)

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: 160, flexShrink: 0 }}>
        <Typography variant="caption" color="text.secondary" noWrap>
          {label}
        </Typography>
        <Tooltip title={tooltip} placement="top">
          <HelpCircle size={11} style={{ color: '#94A3B8', cursor: 'help' }} />
        </Tooltip>
      </Box>
      <LinearProgress
        variant="determinate"
        value={score}
        color={color}
        sx={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          bgcolor: `${color}.100`,
          '& .MuiLinearProgress-bar': { borderRadius: 3 },
        }}
      />
      <Typography
        variant="caption"
        fontWeight={600}
        color={`${color}.main`}
        sx={{ width: 32, textAlign: 'right', flexShrink: 0 }}
      >
        {score}
      </Typography>
    </Box>
  )
}

// ============================================================
// Main Component
// ============================================================

export function AIConfidenceScore({
  score,
  breakdown,
  showLabel = true,
  showBreakdown = true,
  compact = false,
  sx,
}: AIConfidenceScoreProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const color = getScoreColor(score)
  const label = getScoreLabel(score)

  const hasBreakdown = showBreakdown && breakdown !== undefined

  if (compact) {
    return (
      <Tooltip
        title={`AI Confidence: ${score}% (${label})`}
        placement="top"
        arrow
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            cursor: 'default',
            ...sx,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: `${color}.main`,
              flexShrink: 0,
            }}
          />
          <Typography variant="caption" color={`${color}.main`} fontWeight={600}>
            {score}%
          </Typography>
        </Box>
      </Tooltip>
    )
  }

  return (
    <Box sx={sx}>
      {/* Score Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
          AI Confidence
        </Typography>
        <Tooltip
          title="How confident the AI is in the quality and accuracy of this content."
          placement="top"
          arrow
        >
          <HelpCircle size={12} style={{ color: '#94A3B8', cursor: 'help' }} />
        </Tooltip>
        <Box sx={{ flex: 1 }} />
        {showLabel && (
          <Typography variant="caption" color={`${color}.main`} fontWeight={700}>
            {label}
          </Typography>
        )}
        <Typography variant="caption" color={`${color}.main`} fontWeight={700}>
          {score}%
        </Typography>
        {hasBreakdown && (
          <IconButton
            size="small"
            onClick={() => setExpanded((v) => !v)}
            sx={{ width: 20, height: 20 }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </IconButton>
        )}
      </Box>

      {/* Main Progress Bar */}
      <LinearProgress
        variant="determinate"
        value={score}
        color={color}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: `${color}.50`,
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            transition: 'width 600ms ease',
          },
        }}
      />

      {/* Expandable Breakdown */}
      {hasBreakdown && breakdown && (
        <Collapse in={expanded} timeout={250}>
          <Box
            sx={{
              mt: 1.5,
              pt: 1.5,
              borderTop: '1px dashed',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={600} mb={0.5}>
              Score Breakdown
            </Typography>
            {(Object.keys(BREAKDOWN_LABELS) as Array<keyof ConfidenceBreakdown>).map((key) => (
              <BreakdownBar
                key={key}
                label={BREAKDOWN_LABELS[key]}
                tooltip={BREAKDOWN_TOOLTIPS[key]}
                value={breakdown[key]}
              />
            ))}

            {/* Suggestions placeholder */}
          </Box>
        </Collapse>
      )}
    </Box>
  )
}

export default AIConfidenceScore
