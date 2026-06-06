import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  LinearProgress,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Edit,
  Delete,
  Visibility,
  MoreVert,
  AutoAwesome,
  FlagOutlined,
  AssignmentOutlined,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { epicsApi } from '@/api';
import type { Epic } from './EpicCard';

type PriorityCfg = { color: string; bg: string };
type StatusCfg   = { label: string; color: string; bg: string; dot: string };

const priorityConfig: { [key: string]: PriorityCfg } = {
  critical: { color: '#dc2626', bg: '#fef2f2' },
  high:     { color: '#ea580c', bg: '#fff7ed' },
  medium:   { color: '#2563eb', bg: '#eff6ff' },
  low:      { color: '#16a34a', bg: '#f0fdf4' },
};
const defaultPriority: PriorityCfg = { color: '#2563eb', bg: '#eff6ff' };

const statusConfig: { [key: string]: StatusCfg } = {
  backlog:     { label: 'Backlog',      color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' },
  in_progress: { label: 'In Progress',  color: '#1d4ed8', bg: '#dbeafe', dot: '#3b82f6' },
  review:      { label: 'In Review',    color: '#92400e', bg: '#fef3c7', dot: '#f59e0b' },
  done:        { label: 'Completed',    color: '#065f46', bg: '#d1fae5', dot: '#10b981' },
};
const defaultStatus: StatusCfg = { label: 'Backlog', color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' };

interface EpicListProps {
  onEpicEdit?: (epic: Epic) => void;
  onEpicView?: (epic: Epic) => void;
}

const EpicListRow: React.FC<{
  epic: Epic;
  index: number;
  onEdit?: (epic: Epic) => void;
  onView?: (epic: Epic) => void;
  onDelete?: (id: string) => void;
}> = ({ epic, index, onEdit, onView, onDelete }) => {
  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);
  const pCfg: PriorityCfg = priorityConfig[epic.priority] ?? defaultPriority;
  const sCfg: StatusCfg   = statusConfig[epic.status]    ?? defaultStatus;
  const progress = epic.storyCount > 0
    ? Math.round((epic.completedStories / epic.storyCount) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Paper
        variant="outlined"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 2,
          py: 1.5,
          borderRadius: 2,
          borderLeft: `4px solid ${pCfg.color}`,
          cursor: 'pointer',
          transition: 'box-shadow 0.15s',
          '&:hover': { boxShadow: 4 },
        }}
        onClick={() => onView?.(epic)}
      >
        {/* Epic ID */}
        <Typography
          sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.72rem',
                color: 'text.disabled', minWidth: 72, flexShrink: 0 }}
        >
          {epic.epicId}
        </Typography>

        {/* Title + description */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {epic.title}
            </Typography>
            {epic.isAiGenerated && (
              <AutoAwesome sx={{ fontSize: 12, color: 'secondary.main', flexShrink: 0 }} />
            )}
          </Box>
          {epic.description && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', display: 'block' }}
            >
              {epic.description.replace(/<[^>]*>/g, '')}
            </Typography>
          )}
        </Box>

        {/* Priority */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 0.4, px: 0.75, py: 0.2,
                borderRadius: 1, bgcolor: pCfg.bg, flexShrink: 0 }}
        >
          <FlagOutlined sx={{ fontSize: 12, color: pCfg.color }} />
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: pCfg.color }}>
            {epic.priority.charAt(0).toUpperCase() + epic.priority.slice(1)}
          </Typography>
        </Box>

        {/* Status */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 0.75, py: 0.2,
                borderRadius: 1, bgcolor: sCfg.bg, flexShrink: 0, minWidth: 90 }}
        >
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: sCfg.dot }} />
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: sCfg.color }}>
            {sCfg.label}
          </Typography>
        </Box>

        {/* Requirements count */}
        {(epic.requirementCount ?? 0) > 0 && (
          <Tooltip title={`${epic.requirementCount} requirements linked`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, flexShrink: 0 }}>
              <AssignmentOutlined sx={{ fontSize: 14, color: 'text.disabled' }} />
              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                {epic.requirementCount}
              </Typography>
            </Box>
          </Tooltip>
        )}

        {/* Story progress */}
        {epic.storyCount > 0 && (
          <Box sx={{ minWidth: 80, flexShrink: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
              {progress}% ({epic.completedStories}/{epic.storyCount})
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 4, borderRadius: 2, mt: 0.25,
                    '& .MuiLinearProgress-bar': { borderRadius: 2,
                      bgcolor: progress === 100 ? 'success.main' : 'primary.main' } }}
            />
          </Box>
        )}

        {/* Tags */}
        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, maxWidth: 160, flexWrap: 'wrap' }}>
          {(epic.tags ?? []).slice(0, 2).map((tag) => (
            <Chip key={tag} label={tag} size="small"
              sx={{ height: 18, fontSize: '0.62rem', bgcolor: 'action.selected' }} />
          ))}
        </Box>

        {/* Menu */}
        <IconButton
          size="small"
          sx={{ flexShrink: 0 }}
          onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }}
        >
          <MoreVert sx={{ fontSize: 16, color: 'text.disabled' }} />
        </IconButton>

        <Menu
          anchorEl={menuAnchor}
          open={!!menuAnchor}
          onClose={() => setMenuAnchor(null)}
          onClick={(e) => e.stopPropagation()}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 140 } }}
        >
          <MenuItem dense onClick={() => { onView?.(epic); setMenuAnchor(null); }}
            sx={{ gap: 1.5, fontSize: '0.85rem' }}>
            <Visibility fontSize="small" sx={{ color: 'text.secondary' }} />
            View details
          </MenuItem>
          <MenuItem dense onClick={() => { onEdit?.(epic); setMenuAnchor(null); }}
            sx={{ gap: 1.5, fontSize: '0.85rem' }}>
            <Edit fontSize="small" sx={{ color: 'text.secondary' }} />
            Edit
          </MenuItem>
          <Divider />
          <MenuItem dense sx={{ gap: 1.5, fontSize: '0.85rem', color: 'error.main' }}
            onClick={() => { onDelete?.(epic.id); setMenuAnchor(null); }}>
            <Delete fontSize="small" />
            Delete
          </MenuItem>
        </Menu>
      </Paper>
    </motion.div>
  );
};

const EpicList: React.FC<EpicListProps> = ({ onEpicEdit, onEpicView }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['epics', projectId],
    queryFn: () => epicsApi.list(projectId!),
    enabled: !!projectId,
  });

  const epics: Epic[] = (data?.data ?? []) as unknown as Epic[];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => epicsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['epics', projectId] }),
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (epics.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="body1" color="text.secondary">No epics yet.</Typography>
      </Box>
    );
  }

  // Group by status for visual separation
  const groups: Array<{ label: string; status: string; epics: Epic[] }> = [
    { label: 'Backlog',     status: 'backlog',     epics: epics.filter(e => e.status === 'backlog') },
    { label: 'In Progress', status: 'in_progress', epics: epics.filter(e => e.status === 'in_progress') },
    { label: 'In Review',   status: 'review',      epics: epics.filter(e => e.status === 'review') },
    { label: 'Completed',   status: 'done',        epics: epics.filter(e => e.status === 'done') },
  ].filter(g => g.epics.length > 0);

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', pr: 0.5,
               '&::-webkit-scrollbar': { width: 6 },
               '&::-webkit-scrollbar-thumb': { borderRadius: 3, bgcolor: 'divider' } }}>
      {groups.map(group => {
        const sCfg: StatusCfg = statusConfig[group.status] ?? defaultStatus;
        return (
          <Box key={group.status} sx={{ mb: 3 }}>
            {/* Group header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: sCfg.dot }} />
              <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.82rem', letterSpacing: 0.3 }}>
                {group.label}
              </Typography>
              <Box sx={{ px: 0.9, py: 0.1, borderRadius: 1, bgcolor: sCfg.dot + '28', minWidth: 22, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: sCfg.dot, lineHeight: 1.6 }}>
                  {group.epics.length}
                </Typography>
              </Box>
            </Box>
            {/* Rows */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {group.epics.map((epic, idx) => (
                <EpicListRow
                  key={epic.id}
                  epic={epic}
                  index={idx}
                  {...(onEpicEdit ? { onEdit: onEpicEdit } : {})}
                  {...(onEpicView ? { onView: onEpicView } : {})}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default EpicList;
