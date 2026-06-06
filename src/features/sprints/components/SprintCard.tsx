import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Paper,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  CalendarToday,
  Speed,
  People,
  CheckCircleOutline,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { SprintSummary, SprintStatus } from '@/types';

// ─── Status config ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  SprintStatus,
  { label: string; color: 'default' | 'info' | 'success' | 'warning' | 'error' | 'primary' }
> = {
  planning: { label: 'PLANNED', color: 'default' },
  active: { label: 'ACTIVE', color: 'primary' },
  review: { label: 'REVIEW', color: 'warning' },
  retrospective: { label: 'RETRO', color: 'info' },
  completed: { label: 'COMPLETED', color: 'success' },
  cancelled: { label: 'CANCELLED', color: 'error' },
};

// ─── Circular points progress ─────────────────────────────────────────────

interface PointsProgressProps {
  completed: number;
  total: number;
}

const PointsProgress: React.FC<PointsProgressProps> = ({ completed, total }) => {
  const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  return (
    <Tooltip title={`${completed} / ${total} story points`}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={52}
          thickness={4}
          sx={{ color: 'action.hover', position: 'absolute' }}
        />
        <CircularProgress
          variant="determinate"
          value={pct}
          size={52}
          thickness={4}
          color={pct >= 100 ? 'success' : 'primary'}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="caption"
            fontWeight={700}
            sx={{ fontSize: '0.65rem', lineHeight: 1 }}
          >
            {pct}%
          </Typography>
        </Box>
      </Box>
    </Tooltip>
  );
};

// ─── Date formatter ───────────────────────────────────────────────────────

function formatDateRange(start: string, end: string): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

// ─── Props ────────────────────────────────────────────────────────────────

export interface SprintCardProps {
  sprint: SprintSummary;
  sprintNumber?: number;
  totalSprints?: number;
  velocity?: number;
  teamCapacity?: number;
  projectId: string;
}

// ─── Component ────────────────────────────────────────────────────────────

const SprintCard: React.FC<SprintCardProps> = ({
  sprint,
  sprintNumber,
  totalSprints,
  velocity,
  teamCapacity,
  projectId,
}) => {
  const navigate = useNavigate();
  const statusCfg = STATUS_CONFIG[sprint.status];

  const handleClick = () => {
    navigate(`/projects/${projectId}/sprints/${sprint.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Paper
        elevation={2}
        onClick={handleClick}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: sprint.status === 'active' ? 'primary.main' : 'divider',
          cursor: 'pointer',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
          '&:hover': { boxShadow: 6 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Active indicator strip */}
        {sprint.status === 'active' && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              bgcolor: 'primary.main',
            }}
          />
        )}

        {/* Header row */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                {sprint.name}
              </Typography>
              {sprintNumber != null && totalSprints != null && (
                <Chip
                  label={`${sprintNumber}/${totalSprints}`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    bgcolor: 'action.selected',
                  }}
                />
              )}
            </Box>
            <Chip
              label={statusCfg.label}
              size="small"
              color={statusCfg.color}
              sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, letterSpacing: 0.5 }}
            />
          </Box>

          <PointsProgress
            completed={sprint.completedStoryPoints}
            total={sprint.totalStoryPoints}
          />
        </Box>

        {/* Date range */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
          <CalendarToday sx={{ fontSize: 14, color: 'text.disabled' }} />
          <Typography variant="caption" color="text.secondary">
            {formatDateRange(sprint.startDate, sprint.endDate)}
          </Typography>
        </Box>

        {/* Stats row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {/* Story count */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckCircleOutline sx={{ fontSize: 14, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary">
              <strong>{sprint.storyCount}</strong> stories
            </Typography>
          </Box>

          {/* Points */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              <strong>{sprint.completedStoryPoints}</strong>
              <span style={{ opacity: 0.6 }}>/{sprint.totalStoryPoints} pts</span>
            </Typography>
          </Box>

          {/* Velocity */}
          {velocity != null && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Speed sx={{ fontSize: 14, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">
                <strong>{velocity}</strong> vel
              </Typography>
            </Box>
          )}

          {/* Capacity */}
          {teamCapacity != null && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <People sx={{ fontSize: 14, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">
                <strong>{teamCapacity}</strong> cap
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </motion.div>
  );
};

export default SprintCard;
