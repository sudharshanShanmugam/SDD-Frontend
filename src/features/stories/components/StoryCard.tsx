import React, { useState } from 'react';
import { Box, Typography, IconButton, Tooltip, Avatar, Menu, MenuItem, Stack } from '@mui/material';
import { MoreVert, Edit, Delete, CheckCircle, Cancel, AutoAwesome } from '@mui/icons-material';

export type StoryStatus = 'backlog' | 'ready' | 'in_progress' | 'review' | 'done' | 'approved' | 'rejected';
export type StoryType   = 'feature' | 'bug' | 'tech_debt' | 'spike';

export interface InvestScore {
  independent: number; negotiable: number; valuable: number;
  estimable: number; small: number; testable: number;
}
export interface Story {
  id: string; storyId: string; title: string; asA: string;
  iWant: string; soThat: string; type: StoryType; status: StoryStatus;
  priority: 'critical' | 'high' | 'medium' | 'low';
  points?: number; sprintId?: string;
  assignee?: { id: string; name: string; avatar?: string };
  acceptanceCriteria?: string[]; aiConfidence?: number;
  investScore?: InvestScore; tags?: string[];
  isAiGenerated?: boolean; requirementId?: string; createdAt: string;
}

export const STATUS_CONFIG: Record<StoryStatus, { label: string; color: string; bg: string }> = {
  backlog:     { label: 'Backlog',     color: '#64748b', bg: '#f1f5f9' },
  ready:       { label: 'Ready',       color: '#6366f1', bg: '#eef2ff' },
  in_progress: { label: 'In Progress', color: '#3b82f6', bg: '#eff6ff' },
  review:      { label: 'Review',      color: '#f59e0b', bg: '#fffbeb' },
  done:        { label: 'Done',        color: '#10b981', bg: '#f0fdf4' },
  approved:    { label: 'Accepted',    color: '#10b981', bg: '#f0fdf4' },
  rejected:    { label: 'Rejected',    color: '#ef4444', bg: '#fef2f2' },
};

export const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  critical: { color: '#ef4444', label: 'Critical' },
  high:     { color: '#f97316', label: 'High' },
  medium:   { color: '#6366f1', label: 'Medium' },
  low:      { color: '#94a3b8', label: 'Low' },
};

interface StoryRowProps {
  story: Story;
  onEdit?: (story: Story) => void;
  onDelete?: (id: string) => void;
  onView?: (story: Story) => void;
  onStatusChange?: (id: string, status: StoryStatus) => void;
}

const StoryRow: React.FC<StoryRowProps> = ({ story, onEdit, onDelete, onView, onStatusChange }) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const stCfg   = STATUS_CONFIG[story.status] ?? STATUS_CONFIG.backlog;
  const priColor = (PRIORITY_CONFIG[story.priority] ?? PRIORITY_CONFIG['medium'])!.color;
  const isSettled = story.status === 'approved' || story.status === 'rejected';

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onView?.(story)}
      sx={{
        display: 'grid',
        gridTemplateColumns: '4px 80px 1fr 100px 52px 32px 80px 32px',
        alignItems: 'center', gap: 2,
        px: 2, py: 1.25,
        borderBottom: '1px solid', borderColor: 'divider',
        cursor: 'pointer',
        '&:hover': { bgcolor: 'action.hover' },
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      {/* Priority bar */}
      <Box sx={{ height: 28, borderRadius: 1, bgcolor: priColor, opacity: hovered ? 0.9 : 0.5, transition: 'opacity 0.15s' }} />

      {/* ID */}
      <Typography variant="caption" fontFamily="monospace" fontWeight={700}
        sx={{ color: 'text.disabled', fontSize: '0.68rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {story.storyId}
      </Typography>

      {/* Title + sub */}
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>{story.title}</Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', lineHeight: 1.3 }}>
          As a <strong>{story.asA}</strong> · {story.iWant}
        </Typography>
      </Box>

      {/* Status */}
      <Box sx={{ px: 1, py: 0.3, borderRadius: 10, bgcolor: stCfg.bg, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: stCfg.color, lineHeight: 1.4 }}>{stCfg.label}</Typography>
      </Box>

      {/* Points */}
      <Typography variant="caption" fontWeight={700} textAlign="center"
        sx={{ color: story.points !== undefined ? 'text.primary' : 'text.disabled' }}>
        {story.points !== undefined ? `${story.points}p` : '—'}
      </Typography>

      {/* AI */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        {story.isAiGenerated && (
          <Tooltip title="AI generated">
            <AutoAwesome sx={{ fontSize: 13, color: 'secondary.main', opacity: 0.7 }} />
          </Tooltip>
        )}
      </Box>

      {/* Assignee + hover actions */}
      <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.25}
        onClick={(e) => e.stopPropagation()}>
        {hovered && onStatusChange && !isSettled ? (
          <>
            <Tooltip title="Accept">
              <IconButton size="small" onClick={() => onStatusChange(story.id, 'approved')}
                sx={{ color: '#10b981', p: 0.4 }}>
                <CheckCircle sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Decline">
              <IconButton size="small" onClick={() => onStatusChange(story.id, 'rejected')}
                sx={{ color: '#ef4444', p: 0.4 }}>
                <Cancel sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          </>
        ) : story.assignee ? (
          <Tooltip title={story.assignee.name}>
            <Avatar {...(story.assignee.avatar ? { src: story.assignee.avatar } : {})}
              sx={{ width: 24, height: 24, fontSize: '0.6rem' }}>
              {story.assignee.name[0]}
            </Avatar>
          </Tooltip>
        ) : null}
      </Stack>

      {/* Menu */}
      <Box onClick={(e) => e.stopPropagation()}>
        <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}
          sx={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.15s', color: 'text.secondary', p: 0.4 }}>
          <MoreVert sx={{ fontSize: 15 }} />
        </IconButton>
      </Box>

      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}
        onClick={(e) => e.stopPropagation()}>
        <MenuItem dense onClick={() => { onEdit?.(story); setMenuAnchor(null); }}>
          <Edit fontSize="small" sx={{ mr: 1.5, fontSize: 16 }} /> Edit
        </MenuItem>
        {onStatusChange && !isSettled && [
          <MenuItem dense key="acc" onClick={() => { onStatusChange(story.id, 'approved'); setMenuAnchor(null); }}>
            <CheckCircle sx={{ mr: 1.5, fontSize: 16, color: '#10b981' }} /> Accept
          </MenuItem>,
          <MenuItem dense key="dec" onClick={() => { onStatusChange(story.id, 'rejected'); setMenuAnchor(null); }}>
            <Cancel sx={{ mr: 1.5, fontSize: 16, color: '#ef4444' }} /> Decline
          </MenuItem>,
        ]}
        <MenuItem dense sx={{ color: 'error.main' }} onClick={() => { onDelete?.(story.id); setMenuAnchor(null); }}>
          <Delete sx={{ mr: 1.5, fontSize: 16 }} /> Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default StoryRow;
