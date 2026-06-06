import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  Visibility,
  AutoAwesome,
  FlagOutlined,
  CalendarTodayOutlined,
  BookmarkBorderOutlined,
  AssignmentOutlined,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

export type EpicStatus = 'backlog' | 'in_progress' | 'review' | 'done';

export interface Epic {
  id: string;
  epicId: string;
  title: string;
  description: string;
  status: EpicStatus;
  priority: 'critical' | 'high' | 'medium' | 'low';
  storyCount: number;
  completedStories: number;
  requirementCount?: number;
  aiConfidence?: number;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  assignees?: Array<{ id: string; name: string; avatar?: string }>;
  requirementIds?: string[];
  startDate?: string;
  endDate?: string;
  tags?: string[];
  color?: string;
  isAiGenerated?: boolean;
}

// ── Config maps ──────────────────────────────────────────────────────────────

const priorityConfig: Record<Epic['priority'], { label: string; color: string; bg: string }> = {
  critical: { label: 'Critical', color: '#dc2626', bg: '#fef2f2' },
  high:     { label: 'High',     color: '#ea580c', bg: '#fff7ed' },
  medium:   { label: 'Medium',   color: '#2563eb', bg: '#eff6ff' },
  low:      { label: 'Low',      color: '#16a34a', bg: '#f0fdf4' },
};

const statusConfig: Record<EpicStatus, { label: string; color: string; bg: string; dot: string }> = {
  backlog:     { label: 'Backlog',     color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' },
  in_progress: { label: 'In Progress', color: '#1d4ed8', bg: '#dbeafe', dot: '#3b82f6' },
  review:      { label: 'In Review',   color: '#92400e', bg: '#fef3c7', dot: '#f59e0b' },
  done:        { label: 'Done',        color: '#065f46', bg: '#d1fae5', dot: '#10b981' },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Strip HTML tags from AI-generated descriptions. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Format an ISO date string to "DD MMM YYYY". */
function fmtDate(iso?: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return '';
  }
}

// ── Component ────────────────────────────────────────────────────────────────

interface EpicCardProps {
  epic: Epic;
  onEdit?: (epic: Epic) => void;
  onDelete?: (id: string) => void;
  onView?: (epic: Epic) => void;
  isDragging?: boolean;
}

const EpicCard: React.FC<EpicCardProps> = ({
  epic,
  onEdit,
  onDelete,
  onView,
  isDragging = false,
}) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const sCfg = statusConfig[epic.status] ?? statusConfig.backlog;
  const pCfg = priorityConfig[epic.priority] ?? priorityConfig.medium;
  const description = stripHtml(epic.description || '');
  const progress = epic.storyCount > 0
    ? Math.round((epic.completedStories / epic.storyCount) * 100)
    : 0;

  return (
    <motion.div
      layout
      animate={{ scale: isDragging ? 1.02 : 1, opacity: isDragging ? 0.8 : 1 }}
      transition={{ duration: 0.15 }}
    >
      <Card
        variant="outlined"
        sx={{
          borderRadius: 2,
          borderLeft: `4px solid ${pCfg.color}`,
          cursor: 'grab',
          bgcolor: 'background.paper',
          transition: 'box-shadow 0.15s, transform 0.1s',
          '&:hover': { boxShadow: 6, transform: 'translateY(-1px)' },
          '&:active': { cursor: 'grabbing' },
        }}
        elevation={isDragging ? 10 : 0}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>

          {/* ── Row 1: Epic ID  +  AI badge  +  Menu ── */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              {/* Epic ID */}
              <Typography
                variant="caption"
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  color: 'text.disabled',
                  letterSpacing: 0.5,
                }}
              >
                {epic.epicId}
              </Typography>

              {/* AI-generated badge */}
              {epic.isAiGenerated && (
                <Tooltip title="AI-generated epic">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    <AutoAwesome sx={{ fontSize: 11, color: 'secondary.main' }} />
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'secondary.main', fontWeight: 600 }}>
                      AI
                    </Typography>
                  </Box>
                </Tooltip>
              )}
            </Box>

            <IconButton
              size="small"
              sx={{ p: 0.25 }}
              onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }}
            >
              <MoreVert sx={{ fontSize: 16, color: 'text.disabled' }} />
            </IconButton>
          </Box>

          {/* ── Row 2: Title ── */}
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{
              mb: 0.75,
              fontSize: '0.875rem',
              lineHeight: 1.35,
              cursor: 'pointer',
              '&:hover': { color: 'primary.main' },
            }}
            onClick={() => onView?.(epic)}
          >
            {epic.title}
          </Typography>

          {/* ── Row 3: Description ── */}
          {description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: '0.78rem',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                mb: 1.25,
              }}
            >
              {description}
            </Typography>
          )}

          <Divider sx={{ my: 1 }} />

          {/* ── Row 4: Requirement count (if any) ── */}
          {(epic.requirementCount ?? 0) > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <AssignmentOutlined sx={{ fontSize: 13, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                {epic.requirementCount} requirement{epic.requirementCount === 1 ? '' : 's'} linked
              </Typography>
            </Box>
          )}

          {/* ── Row 5: Priority  +  Status ── */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            {/* Priority pill */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.4,
                px: 0.75,
                py: 0.2,
                borderRadius: 1,
                bgcolor: pCfg.bg,
              }}
            >
              <FlagOutlined sx={{ fontSize: 12, color: pCfg.color }} />
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: pCfg.color }}>
                {pCfg.label}
              </Typography>
            </Box>

            {/* Status pill */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 0.75,
                py: 0.2,
                borderRadius: 1,
                bgcolor: sCfg.bg,
              }}
            >
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: sCfg.dot }} />
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: sCfg.color }}>
                {sCfg.label}
              </Typography>
            </Box>
          </Box>

          {/* ── Row 5: Story progress ── */}
          {epic.storyCount > 0 && (
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  {epic.completedStories} of {epic.storyCount} stories done
                </Typography>
                <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.7rem', color: progress === 100 ? 'success.main' : 'text.secondary' }}>
                  {progress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 2,
                    bgcolor: progress === 100 ? 'success.main' : 'primary.main',
                  },
                }}
              />
            </Box>
          )}

          {/* ── Row 6: Tags + target date ── */}
          {((epic.tags && epic.tags.length > 0) || epic.endDate) && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
              {/* Tags */}
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {(epic.tags || []).slice(0, 3).map((tag) => (
                  <Box
                    key={tag}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 0.25,
                      px: 0.6, py: 0.1, borderRadius: 0.75,
                      bgcolor: 'action.selected',
                    }}
                  >
                    <BookmarkBorderOutlined sx={{ fontSize: 10, color: 'text.disabled' }} />
                    <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>{tag}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Target date */}
              {epic.endDate && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                  <CalendarTodayOutlined sx={{ fontSize: 11, color: 'text.disabled' }} />
                  <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.disabled' }}>
                    {fmtDate(epic.endDate)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

        </CardContent>
      </Card>

      {/* ── Context menu ── */}
      <Menu
        anchorEl={menuAnchor}
        open={!!menuAnchor}
        onClose={() => setMenuAnchor(null)}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 140 } }}
      >
        <MenuItem
          dense
          onClick={() => { onView?.(epic); setMenuAnchor(null); }}
          sx={{ gap: 1.5, fontSize: '0.85rem' }}
        >
          <Visibility fontSize="small" sx={{ color: 'text.secondary' }} />
          View details
        </MenuItem>
        <MenuItem
          dense
          onClick={() => { onEdit?.(epic); setMenuAnchor(null); }}
          sx={{ gap: 1.5, fontSize: '0.85rem' }}
        >
          <Edit fontSize="small" sx={{ color: 'text.secondary' }} />
          Edit
        </MenuItem>
        <Divider />
        <MenuItem
          dense
          sx={{ gap: 1.5, fontSize: '0.85rem', color: 'error.main' }}
          onClick={() => { onDelete?.(epic.id); setMenuAnchor(null); }}
        >
          <Delete fontSize="small" />
          Delete
        </MenuItem>
      </Menu>
    </motion.div>
  );
};

export default EpicCard;
