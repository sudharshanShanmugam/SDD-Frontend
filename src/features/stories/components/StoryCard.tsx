import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import { MoreVert, Edit, Delete, Visibility, AutoAwesome, Star } from '@mui/icons-material';
import { motion } from 'framer-motion';

export type StoryStatus = 'backlog' | 'ready' | 'in_progress' | 'review' | 'done';
export type StoryType = 'feature' | 'bug' | 'tech_debt' | 'spike'; // kept for compatibility

export interface InvestScore {
  independent: number;
  negotiable: number;
  valuable: number;
  estimable: number;
  small: number;
  testable: number;
}

export interface Story {
  id: string;
  storyId: string;
  title: string;
  asA: string;
  iWant: string;
  soThat: string;
  type: StoryType;
  status: StoryStatus;
  priority: 'critical' | 'high' | 'medium' | 'low';
  points?: number;
  epicId?: string;
  epicTitle?: string;
  sprintId?: string;
  assignee?: { id: string; name: string; avatar?: string };
  acceptanceCriteria?: string[];
  aiConfidence?: number;
  investScore?: InvestScore;
  tags?: string[];
  isAiGenerated?: boolean;
  requirementId?: string;
  createdAt: string;
}

const statusConfig: Record<StoryStatus, { label: string; color: string }> = {
  backlog: { label: 'Backlog', color: '#94a3b8' },
  ready: { label: 'Ready', color: '#6366f1' },
  in_progress: { label: 'In Progress', color: '#3b82f6' },
  review: { label: 'Review', color: '#f59e0b' },
  done: { label: 'Done', color: '#10b981' },
};

const priorityBorderColor: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#6366f1',
  low:      '#94a3b8',
};

const InvestIndicator: React.FC<{ score: InvestScore }> = ({ score }) => {
  const avg = Object.values(score).reduce((a, b) => a + b, 0) / 6;
  const pct = (avg / 5) * 100;
  return (
    <Tooltip
      title={
        <Box>
          {Object.entries(score).map(([k, v]) => (
            <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Typography variant="caption" sx={{ textTransform: 'uppercase' }}>{k[0]}</Typography>
              <Typography variant="caption" fontWeight={700}>{'★'.repeat(v)}{'☆'.repeat(5 - v)}</Typography>
            </Box>
          ))}
        </Box>
      }
      arrow
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Star sx={{ fontSize: 14, color: pct >= 70 ? '#f59e0b' : '#94a3b8' }} />
        <Typography variant="caption" fontWeight={600} color={pct >= 70 ? '#f59e0b' : 'text.secondary'}>
          INVEST
        </Typography>
      </Box>
    </Tooltip>
  );
};

interface StoryCardProps {
  story: Story;
  onEdit?: (story: Story) => void;
  onDelete?: (id: string) => void;
  onView?: (story: Story) => void;
  isDragging?: boolean;
  compact?: boolean;
}

const StoryCard: React.FC<StoryCardProps> = ({
  story,
  onEdit,
  onDelete,
  onView,
  isDragging = false,
  compact = false,
}) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const stCfg     = statusConfig[story.status] ?? statusConfig.backlog;
  const leftColor = priorityBorderColor[story.priority] ?? '#6366f1';

  return (
    <motion.div
      layout
      animate={{ scale: isDragging ? 1.03 : 1, opacity: isDragging ? 0.85 : 1 }}
    >
      <Card
        variant="outlined"
        sx={{
          borderRadius: 2,
          borderLeft: `3px solid ${leftColor}`,
          cursor: 'pointer',
          '&:hover': { boxShadow: 3 },
          transition: 'box-shadow 0.15s',
        }}
        elevation={isDragging ? 8 : 0}
        onClick={() => onView?.(story)}
      >
        <CardContent sx={{ p: compact ? 1.5 : 2, '&:last-child': { pb: compact ? 1.5 : 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              <Chip
                label={story.storyId}
                size="small"
                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, fontFamily: 'monospace' }}
              />
              {story.points !== undefined && (
                <Chip
                  label={`${story.points} pts`}
                  size="small"
                  variant="outlined"
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
              )}
            </Box>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }}
            >
              <MoreVert sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          <Typography variant="body2" fontWeight={600} sx={{ mb: compact ? 0 : 0.75 }}>
            {story.title}
          </Typography>

          {!compact && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              As a <strong>{story.asA}</strong>, I want to <em>{story.iWant}</em>
            </Typography>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={stCfg.label}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  bgcolor: stCfg.color + '1a',
                  color: stCfg.color,
                  borderRadius: 1,
                }}
              />
              {story.investScore && <InvestIndicator score={story.investScore} />}
              {story.aiConfidence !== undefined && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                  <AutoAwesome sx={{ fontSize: 12, color: 'secondary.main' }} />
                  <Typography variant="caption" color="secondary.main">
                    {story.aiConfidence}%
                  </Typography>
                </Box>
              )}
            </Box>
            {story.assignee && (
              <Tooltip title={story.assignee.name}>
                <Avatar
                  {...(story.assignee.avatar ? { src: story.assignee.avatar } : {})}
                  alt={story.assignee.name}
                  sx={{ width: 22, height: 22, fontSize: '0.65rem' }}
                >
                  {story.assignee.name[0]}
                </Avatar>
              </Tooltip>
            )}
          </Box>
        </CardContent>
      </Card>

      <Menu
        anchorEl={menuAnchor}
        open={!!menuAnchor}
        onClose={() => setMenuAnchor(null)}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={() => { onView?.(story); setMenuAnchor(null); }}>
          <Visibility fontSize="small" sx={{ mr: 1 }} /> View
        </MenuItem>
        <MenuItem onClick={() => { onEdit?.(story); setMenuAnchor(null); }}>
          <Edit fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem sx={{ color: 'error.main' }} onClick={() => { onDelete?.(story.id); setMenuAnchor(null); }}>
          <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </motion.div>
  );
};

export default StoryCard;
