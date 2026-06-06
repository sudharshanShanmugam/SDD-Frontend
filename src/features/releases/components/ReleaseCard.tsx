import React from 'react';
import {
  Box,
  Card,
  CardActionArea,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import {
  CalendarTodayOutlined,
  SpeedOutlined,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import type { UUID } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ReleaseStatus = 'DRAFT' | 'RC' | 'PUBLISHED';

export interface ReleaseCardData {
  id: UUID;
  version: string;
  status: ReleaseStatus;
  description: string;
  startDate: string;
  endDate: string;
  sprintCount: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  isSelected?: boolean;
}

interface ReleaseCardProps {
  release: ReleaseCardData;
  onClick: (id: UUID) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ReleaseStatus,
  { color: 'success' | 'primary' | 'default'; label: string; dot: string }
> = {
  PUBLISHED: { color: 'success', label: 'Published', dot: '#2E7D32' },
  RC: { color: 'primary', label: 'Release Candidate', dot: '#1565C0' },
  DRAFT: { color: 'default', label: 'Draft', dot: '#757575' },
};

function formatDateRange(start: string, end: string): string {
  try {
    return `${format(parseISO(start), 'MMM d')} – ${format(parseISO(end), 'MMM d, yyyy')}`;
  } catch {
    return `${start} – ${end}`;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ReleaseCard({ release, onClick }: ReleaseCardProps) {
  const cfg = STATUS_CONFIG[release.status];
  const completionPct =
    release.totalStoryPoints > 0
      ? Math.round((release.completedStoryPoints / release.totalStoryPoints) * 100)
      : 0;

  return (
    <Card
      elevation={0}
      sx={{
        border: 1,
        borderColor: release.isSelected ? 'primary.main' : 'divider',
        borderRadius: 2,
        bgcolor: release.isSelected ? 'primary.50' : 'background.paper',
        transition: 'all 0.15s',
        '&:hover': { borderColor: 'primary.light', boxShadow: 1 },
      }}
    >
      <CardActionArea onClick={() => onClick(release.id)} sx={{ p: 2 }}>
        {/* Top row: version + status chip */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.75}>
          <Typography variant="subtitle1" fontWeight={700} letterSpacing={0.3}>
            {release.version}
          </Typography>
          <Chip
            label={cfg.label}
            color={cfg.color}
            size="small"
            sx={{ height: 20, fontSize: 11, fontWeight: 600 }}
          />
        </Box>

        {/* Description */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {release.description}
        </Typography>

        {/* Meta row */}
        <Stack direction="row" spacing={2} mt={1.25} mb={1.5}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <CalendarTodayOutlined sx={{ fontSize: 12, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary">
              {formatDateRange(release.startDate, release.endDate)}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <SpeedOutlined sx={{ fontSize: 12, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary">
              {release.sprintCount} sprint{release.sprintCount !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Stack>

        {/* Progress bar */}
        <Box>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="caption" color="text.secondary">
              Story Points
            </Typography>
            <Typography variant="caption" fontWeight={600}>
              {completionPct}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={completionPct}
            color={
              release.status === 'PUBLISHED'
                ? 'success'
                : release.status === 'RC'
                  ? 'primary'
                  : 'inherit'
            }
            sx={{ height: 6, borderRadius: 3 }}
          />
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
            {release.completedStoryPoints} / {release.totalStoryPoints} pts
          </Typography>
        </Box>
      </CardActionArea>
    </Card>
  );
}

export default ReleaseCard;
