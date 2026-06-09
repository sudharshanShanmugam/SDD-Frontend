import React from 'react';
import { Box, Typography, Chip, Paper, Tooltip } from '@mui/material';
import {
  BugReport,
  Bolt,
  Build,
  Assignment,
  FiberManualRecord,
  DragIndicator,
} from '@mui/icons-material';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { StorySummary, Priority } from '@/types';

// ─── Static maps ──────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<
  Priority,
  { color: 'error' | 'warning' | 'primary' | 'default'; label: string }
> = {
  critical: { color: 'error',   label: 'Critical' },
  high:     { color: 'warning', label: 'High'     },
  medium:   { color: 'primary', label: 'Medium'   },
  low:      { color: 'default', label: 'Low'      },
};

const STORY_TYPE_ICON: Record<string, React.ReactNode> = {
  user_story: <Assignment sx={{ fontSize: 14 }} />,
  bug:        <BugReport  sx={{ fontSize: 14 }} />,
  spike:      <Bolt       sx={{ fontSize: 14 }} />,
  chore:      <Build      sx={{ fontSize: 14 }} />,
  task:       <FiberManualRecord sx={{ fontSize: 12 }} />,
  feature:    <Assignment sx={{ fontSize: 14 }} />,
};

// ─── Props ────────────────────────────────────────────────────────────────

export interface BacklogItemProps {
  story: StorySummary;
  onClick?: (story: StorySummary) => void;
  /** Rendered inside DragOverlay – no drag hooks, just visual */
  isOverlay?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────

const BacklogItem: React.FC<BacklogItemProps> = ({
  story,
  onClick,
  isOverlay = false,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: story.id,
    data: { story },
    disabled: isOverlay, // overlay clone never initiates a drag
  });

  const priorityCfg = PRIORITY_CONFIG[story.priority] ?? PRIORITY_CONFIG.medium;

  // ── card-level inline style ───────────────────────────────────────────
  // DnD Kit moves the card by injecting a CSS translate; we apply it here.
  // During active drag the original stays faded in-place; the overlay floats.
  const cardStyle: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging && !isOverlay ? 0.35 : 1,
    // skip MUI's box-shadow transition while floating so elevation is instant
    transition: isDragging
      ? 'opacity 0.1s ease'
      : 'box-shadow 0.15s ease, border-color 0.15s ease, opacity 0.1s ease',
    willChange: 'transform',       // GPU layer hint
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <Paper
      ref={setNodeRef}
      style={cardStyle}
      // ── entire card surface receives drag pointer events ──────────────
      {...attributes}
      {...listeners}
      elevation={isDragging || isOverlay ? 10 : 1}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: isOverlay
          ? 'primary.main'
          : isDragging
          ? 'primary.light'
          : 'divider',
        bgcolor: 'background.paper',
        userSelect: 'none',
        touchAction: 'none',   // required for PointerSensor on touch devices
        // Overlay gets a subtle tilt + scale to look "lifted"
        ...(isOverlay && {
          transform: 'rotate(1.5deg) scale(1.04)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
        }),
        '&:hover': !isDragging
          ? { borderColor: 'primary.light', boxShadow: 3 }
          : {},
      }}
    >
      {/* Drag affordance — purely visual */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          color: isDragging ? 'primary.main' : 'text.disabled',
          mt: 0.25,
          flexShrink: 0,
          transition: 'color 0.15s',
        }}
      >
        <DragIndicator sx={{ fontSize: 18 }} />
      </Box>

      {/* Content area
          Note: we do NOT call stopPropagation on pointerDown here —
          that would swallow the event that DnD Kit needs to start the drag.
          onClick fires on pointerUp and never interferes with drag. */}
      <Box
        sx={{ flex: 1, minWidth: 0 }}
        onClick={() => !isDragging && onClick?.(story)}
      >
        {/* identifier + type icon */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
          <Box sx={{ color: 'text.disabled', display: 'flex', alignItems: 'center' }}>
            {STORY_TYPE_ICON[story.type] ?? STORY_TYPE_ICON['feature']}
          </Box>
          <Typography
            variant="caption"
            sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 600, letterSpacing: 0.5 }}
          >
            {story.identifier}
          </Typography>
        </Box>

        {/* Title */}
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            lineHeight: 1.4,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            mb: 1,
          }}
        >
          {story.title}
        </Typography>

        {/* Priority · points */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          <Chip
            label={priorityCfg.label}
            size="small"
            color={priorityCfg.color}
            variant="outlined"
            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600, pointerEvents: 'none' }}
          />

          <Box sx={{ ml: 'auto' }}>
            {story.storyPoints != null ? (
              <Tooltip title="Story points" disableInteractive>
                <Chip
                  label={story.storyPoints}
                  size="small"
                  sx={{
                    height: 22,
                    minWidth: 28,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    pointerEvents: 'none',
                  }}
                />
              </Tooltip>
            ) : (
              <Chip
                label="?"
                size="small"
                sx={{
                  height: 22,
                  minWidth: 28,
                  fontSize: '0.75rem',
                  bgcolor: 'action.hover',
                  color: 'text.disabled',
                  pointerEvents: 'none',
                }}
              />
            )}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default BacklogItem;
