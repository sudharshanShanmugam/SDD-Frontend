import React, { useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Skeleton,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow,
  CheckCircle,
  Refresh,
  ArrowBack,
  EmojiEvents,
  CalendarMonth,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@store/uiStore';
import { sprintsApi } from '@/api/sprints';
import { storiesApi } from '@/api/stories';
import SprintKanban from '../components/SprintKanban';
import type { StoryStatus, Sprint, SprintSummary } from '@/types';

// ─── Velocity progress ────────────────────────────────────────────────────

interface VelocityBarProps {
  done: number;
  planned: number;
}

const VelocityBar: React.FC<VelocityBarProps> = ({ done, planned }) => {
  const pct = planned > 0 ? Math.min(100, Math.round((done / planned) * 100)) : 0;
  const color = pct >= 100 ? 'success' : pct >= 70 ? 'primary' : 'warning';
  return (
    <Box sx={{ minWidth: 180 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          Velocity
        </Typography>
        <Typography variant="caption" fontWeight={700}>
          {done}/{planned} pts
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        color={color}
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Box>
  );
};

// ─── Sprint selector ──────────────────────────────────────────────────────

interface SprintSelectorProps {
  sprints: SprintSummary[];
  currentSprintId: string;
  onSelect: (id: string) => void;
}

const SprintSelector: React.FC<SprintSelectorProps> = ({
  sprints,
  currentSprintId,
  onSelect,
}) => (
  <FormControl size="small" sx={{ minWidth: 220 }}>
    <InputLabel>Sprint</InputLabel>
    <Select
      value={currentSprintId}
      label="Sprint"
      onChange={(e) => onSelect(e.target.value)}
    >
      {sprints.map((s) => (
        <MenuItem key={s.id} value={s.id}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">{s.name}</Typography>
            <Chip
              label={s.status}
              size="small"
              color={
                s.status === 'active'
                  ? 'primary'
                  : s.status === 'completed'
                  ? 'success'
                  : 'default'
              }
              sx={{ height: 18, fontSize: '0.65rem' }}
            />
          </Box>
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

// ─── Page ─────────────────────────────────────────────────────────────────

const SprintBoardPage: React.FC = () => {
  const { projectId, sprintId } = useParams<{ projectId: string; sprintId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useUIStore();

  // ── Fetch all sprints (for selector) ──
  const {
    data: sprintsData,
    isLoading: sprintsLoading,
  } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => sprintsApi.list(projectId!),
    enabled: !!projectId,
  });

  const sprints = sprintsData?.data ?? [];

  // ── Active sprint: use URL param or fall back to first active ──
  const activeSprint =
    sprints.find((s) => s.id === sprintId) ??
    sprints.find((s) => s.status === 'active') ??
    sprints[0];

  const currentSprintId = activeSprint?.id ?? '';

  // ── Full sprint board data ──
  const {
    data: boardSprint,
    isLoading: boardLoading,
    isError,
    refetch,
  } = useQuery<Sprint>({
    queryKey: ['sprint-board', currentSprintId],
    queryFn: () => sprintsApi.get(currentSprintId),
    enabled: !!currentSprintId,
    refetchInterval: 30_000,
  });

  // ── Sprint index (for "Sprint N of M") ──
  const sprintIndex = sprints.findIndex((s) => s.id === currentSprintId);
  const sprintNumber = sprintIndex + 1;

  // ── Start sprint mutation ──
  const startMutation = useMutation({
    mutationFn: () => sprintsApi.start(currentSprintId),
    onSuccess: () => {
      toast.success('Sprint started!');
      queryClient.invalidateQueries({ queryKey: ['sprint-board', currentSprintId] });
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
    },
    onError: () => toast.error('Failed to start sprint'),
  });

  // ── Complete sprint mutation ──
  const completeMutation = useMutation({
    mutationFn: () => sprintsApi.complete(currentSprintId, 'backlog'),
    onSuccess: () => {
      toast.success('Sprint completed!');
      queryClient.invalidateQueries({ queryKey: ['sprint-board', currentSprintId] });
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
    },
    onError: () => toast.error('Failed to complete sprint'),
  });

  // ── Story status mutation (persist Kanban drag-drops to the DB) ──
  const storyStatusMutation = useMutation({
    mutationFn: ({ storyId, newStatus }: { storyId: string; newStatus: StoryStatus }) =>
      storiesApi.patch(storyId, { status: newStatus } as any),
    onError: (_err, { newStatus }) => {
      // Roll back optimistic update by refetching the board
      queryClient.invalidateQueries({ queryKey: ['sprint-board', currentSprintId] });
      toast.error(`Failed to move story to ${newStatus.replace('_', ' ')}`);
    },
    onSuccess: () => {
      // Recompute board-level completion counters after status change
      queryClient.invalidateQueries({ queryKey: ['sprint-board', currentSprintId] });
    },
  });

  // ── Story move handler ── optimistic UI + background persist ──
  const handleStoryMove = useCallback(
    (storyId: string, newStatus: StoryStatus) => {
      // Instant visual feedback via optimistic cache update
      queryClient.setQueryData<Sprint>(['sprint-board', currentSprintId], (old) => {
        if (!old) return old;
        return {
          ...old,
          stories: old.stories.map((s) =>
            s.id === storyId ? { ...s, status: newStatus } : s,
          ),
        };
      });
      // Persist to DB — rollback handled by onError above
      storyStatusMutation.mutate({ storyId, newStatus });
    },
    [queryClient, currentSprintId, storyStatusMutation],
  );

  const handleSprintSelect = (id: string) => {
    navigate(`/projects/${projectId}/sprints/${id}`);
  };

  // ─── Loading skeleton ───────────────────────────────────────────────────

  if (boardLoading || sprintsLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Skeleton variant="rectangular" height={64} sx={{ borderRadius: 2 }} />
        <Box sx={{ display: 'flex', gap: 2 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rectangular" width={240} height={420} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Failed to load sprint board. Please try again.
        </Alert>
      </Box>
    );
  }

  const sprint = boardSprint;
  const isActive    = sprint?.status === 'active';
  const isPlanning  = sprint?.status === 'planning';
  const isCompleted = sprint?.status === 'completed';

  // Find the next sprint after this one (for "Start Next Sprint" shortcut)
  const nextSprint = sprints[sprintIndex + 1] ?? null;

  // Completion stats
  const totalStories   = sprint?.stories?.length ?? 0;
  const doneStories    = sprint?.stories?.filter((s) => s.status === 'done').length ?? 0;
  const donePct        = totalStories > 0 ? Math.round((doneStories / totalStories) * 100) : 0;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            flexShrink: 0,
          }}
        >
          {/* Back to planning */}
          <Tooltip title="Back to Sprint Planning">
            <IconButton
              size="small"
              onClick={() => navigate(`/projects/${projectId}/sprints`)}
              sx={{ color: 'text.secondary' }}
            >
              <ArrowBack fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Sprint name + counter */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h6" fontWeight={800}>
                {sprint?.name ?? 'Sprint Board'}
              </Typography>
              {sprints.length > 0 && (
                <Chip
                  label={`Sprint ${sprintNumber} of ${sprints.length}`}
                  size="small"
                  sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                />
              )}
              {isActive && (
                <Chip
                  label="ACTIVE"
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 800, fontSize: '0.7rem', letterSpacing: 0.5 }}
                />
              )}
              {isCompleted && (
                <Chip
                  label="COMPLETED"
                  size="small"
                  color="success"
                  sx={{ fontWeight: 800, fontSize: '0.7rem', letterSpacing: 0.5 }}
                />
              )}
            </Box>
            {sprint && (
              <Typography variant="caption" color="text.secondary">
                {new Date(sprint.startDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
                {' – '}
                {new Date(sprint.endDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Typography>
            )}
          </Box>

          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {/* Velocity progress */}
            {sprint && (
              <VelocityBar
                done={sprint.completedStoryPoints}
                planned={sprint.totalStoryPoints}
              />
            )}

            {/* Sprint selector */}
            {sprints.length > 1 && (
              <SprintSelector
                sprints={sprints}
                currentSprintId={currentSprintId}
                onSelect={handleSprintSelect}
              />
            )}

            {/* Refresh */}
            <Tooltip title="Refresh">
              <IconButton onClick={() => refetch()} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>

            {/* ── Action buttons vary by sprint state ── */}
            {isPlanning && (
              <Button
                variant="contained"
                startIcon={
                  startMutation.isPending ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <PlayArrow />
                  )
                }
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
              >
                Start Sprint
              </Button>
            )}

            {isActive && (
              <Tooltip title={
                doneStories < totalStories
                  ? `${totalStories - doneStories} stories still in progress. Incomplete stories will return to the backlog.`
                  : 'All stories are done — great sprint!'
              }>
                <span>
                  <Button
                    variant={doneStories === totalStories ? 'contained' : 'outlined'}
                    color="success"
                    startIcon={
                      completeMutation.isPending ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <CheckCircle />
                      )
                    }
                    onClick={() => completeMutation.mutate()}
                    disabled={completeMutation.isPending}
                  >
                    {completeMutation.isPending
                      ? 'Completing…'
                      : doneStories === totalStories
                      ? 'Complete Sprint ✓'
                      : `Complete Sprint (${doneStories}/${totalStories} done)`}
                  </Button>
                </span>
              </Tooltip>
            )}

            {isCompleted && (
              <>
                {nextSprint && (
                  <Tooltip title={`Open ${nextSprint.name}`}>
                    <Button
                      variant="outlined"
                      startIcon={<CalendarMonth />}
                      onClick={() =>
                        navigate(`/projects/${projectId}/sprints/${nextSprint.id}`)
                      }
                    >
                      Next Sprint
                    </Button>
                  </Tooltip>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<EmojiEvents />}
                  onClick={() => navigate(`/projects/${projectId}/sprints`)}
                >
                  Plan Next Sprint
                </Button>
              </>
            )}
          </Box>
        </Box>
      </motion.div>

      {/* ── Contextual hint banners ── */}
      {isPlanning && (
        <Box
          sx={{
            px: 3, py: 1,
            bgcolor: 'info.50',
            borderBottom: '1px solid',
            borderColor: 'info.200',
            display: 'flex', alignItems: 'center', gap: 1,
          }}
        >
          <PlayArrow sx={{ fontSize: 15, color: 'info.main' }} />
          <Typography variant="caption" color="info.dark">
            Sprint is in planning. Click <strong>Start Sprint</strong> to activate it and begin tracking progress.
          </Typography>
        </Box>
      )}

      {isActive && (
        <Box
          sx={{
            px: 3, py: 1,
            bgcolor: 'primary.50',
            borderBottom: '1px solid',
            borderColor: 'primary.100',
            display: 'flex', alignItems: 'center', gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 8, height: 8, borderRadius: '50%',
              bgcolor: 'primary.main',
              animation: 'pulse 1.5s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.35 },
              },
            }}
          />
          <Typography variant="caption" color="primary.dark">
            Sprint active — drag stories across columns as you work.
            &nbsp;Move to <strong>Done</strong> when complete, then click <strong>Complete Sprint</strong>.
          </Typography>
          <Typography variant="caption" color="primary.main" fontWeight={700} sx={{ ml: 'auto' }}>
            {doneStories}/{totalStories} stories done
          </Typography>
        </Box>
      )}

      {isCompleted && (
        <Box
          sx={{
            px: 3, py: 1.5,
            bgcolor: 'success.50',
            borderBottom: '1px solid',
            borderColor: 'success.200',
            display: 'flex', alignItems: 'center', gap: 2,
          }}
        >
          <EmojiEvents sx={{ fontSize: 20, color: 'success.main' }} />
          <Box>
            <Typography variant="caption" color="success.dark" fontWeight={700}>
              Sprint complete! {doneStories} of {totalStories} stories delivered ({donePct}% completion rate)
            </Typography>
            <Typography variant="caption" color="success.dark" display="block">
              Velocity: <strong>{sprint?.completedStoryPoints ?? 0} pts</strong>.
              Head to <strong>Sprint Planning</strong> to plan the next sprint.
            </Typography>
          </Box>
        </Box>
      )}

      {/* ── Kanban ── */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          p: 2,
        }}
      >
        {sprint ? (
          <SprintKanban
            stories={sprint.stories}
            onStoryMove={handleStoryMove}
          />
        ) : (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography color="text.secondary">No sprint selected</Typography>
          </Box>
        )}
      </Box>

    </Box>
  );
};

export default SprintBoardPage;
