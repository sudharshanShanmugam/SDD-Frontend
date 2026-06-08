import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  Collapse,
  Skeleton,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  LinearProgress,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  AutoAwesome,
  Add,
  Remove,
  Speed,
  CalendarToday,
  CheckCircleOutline,
  Lightbulb,
  Close,
  DeleteSweep,
  DeleteOutline,
  Search,
  ExpandMore,
  OpenInNew,
  Dashboard,
  PlaylistAdd,
  TaskAlt,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
  type Active,
} from '@dnd-kit/core';
import { useUIStore } from '@store/uiStore';
import { apiClient } from '@/api/client';
import { sprintsApi } from '@/api/sprints';
import { storiesApi } from '@/api/stories';
import { tasksApi } from '@/api/tasks';
import BacklogItem from '../components/BacklogItem';
import type { StorySummary, SprintSummary } from '@/types';
import type { TaskType } from '@/types/task.types';

// ─── Types ─────────────────────────────────────────────────────────────────

interface PointEstimate {
  storyId: string;
  identifier: string;
  title: string;
  estimatedPoints: number;
}

interface AiSprintRisk {
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation?: string;
}

interface AiSprintAssignment {
  sprintId: string;
  storyIds: string[];
  sprintName: string;
  sprintGoal: string;
  committedPoints: number;
  risks: AiSprintRisk[];
  estimatedPointsUpdated: PointEstimate[];
}

type EnrichedSprint = SprintSummary & {
  assignedStories: StorySummary[];
  aiGoal?: string | undefined;
  aiRisks?: AiSprintRisk[];
};

// ─── Sprint drop slot ──────────────────────────────────────────────────────

const RISK_COLOR: Record<string, 'error' | 'warning' | 'default'> = {
  high: 'error',
  medium: 'warning',
  low: 'default',
};

interface SprintDropSlotProps {
  sprint: EnrichedSprint;
  velocity: number;
  activeStory: StorySummary | null;
  onOpenBoard: (sprintId: string) => void;
  onDelete: (sprintId: string) => void;
  onGenerateTasksForSprint: (storyIds: string[]) => void;
  taskGenStatus: Record<string, 'idle' | 'loading' | 'done' | 'error'>;
  onCreateTask: (storyId: string, data: { title: string; type: TaskType; estimatedHours?: number }) => Promise<void>;
}

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'development',   label: 'Development' },
  { value: 'design',        label: 'Design' },
  { value: 'testing',       label: 'QA / Testing' },
  { value: 'documentation', label: 'Docs' },
  { value: 'devops',        label: 'DevOps' },
  { value: 'other',         label: 'Other' },
];

const SprintDropSlot: React.FC<SprintDropSlotProps> = ({
  sprint,
  velocity,
  activeStory,
  onOpenBoard,
  onDelete,
  onGenerateTasksForSprint,
  taskGenStatus,
  onCreateTask,
}) => {
  const [expandedStoryId, setExpandedStoryId] = React.useState<string | null>(null);
  const [taskTitle, setTaskTitle] = React.useState('');
  const [taskType, setTaskType] = React.useState<TaskType>('development');
  const [taskHours, setTaskHours] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const handleAddTask = async (storyId: string) => {
    if (!taskTitle.trim()) return;
    setSaving(true);
    try {
      const parsed = taskHours ? parseFloat(taskHours) : undefined;
      await onCreateTask(storyId, {
        title: taskTitle.trim(),
        type: taskType,
        ...(parsed !== undefined ? { estimatedHours: parsed } : {}),
      });
      setTaskTitle('');
      setTaskHours('');
      setExpandedStoryId(null);
    } finally {
      setSaving(false);
    }
  };
  const { setNodeRef, isOver } = useDroppable({
    id: `sprint-${sprint.id}`,
    data: { sprintId: sprint.id },
  });

  // Prevent showing the live preview if the story is already in this sprint
  const alreadyHere = activeStory
    ? sprint.assignedStories.some((s) => s.id === activeStory.id)
    : false;
  const showPreview = isOver && activeStory && !alreadyHere;

  const assignedPoints = sprint.assignedStories.reduce(
    (sum, s) => sum + (s.storyPoints ?? 0),
    0,
  );
  // Add preview story's points to the live capacity calculation
  const previewPoints = showPreview ? (activeStory?.storyPoints ?? 0) : 0;
  const livePoints = assignedPoints + previewPoints;
  const capacityPct = velocity > 0 ? Math.min(100, Math.round((livePoints / velocity) * 100)) : 0;
  const isOverCapacity = livePoints > velocity;

  return (
    <Paper
      ref={setNodeRef}
      elevation={isOver ? 4 : 1}
      sx={{
        borderRadius: 2,
        border: '2px solid',
        borderColor: isOver
          ? 'primary.main'
          : isOverCapacity
          ? 'error.light'
          : 'divider',
        bgcolor: isOver ? 'primary.50' : 'background.paper',
        transition: 'border-color 0.12s ease, background-color 0.12s ease, box-shadow 0.12s ease',
        overflow: 'hidden',
        // subtle scale-up when hovered by a dragged card
        transform: isOver ? 'scale(1.005)' : 'scale(1)',
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: isOver ? 'primary.100' : 'action.hover',
          borderBottom: '1px solid',
          borderColor: 'divider',
          transition: 'background-color 0.12s ease',
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {sprint.name}
            </Typography>
            <Tooltip title="Open Sprint Board">
              <IconButton
                size="small"
                onClick={() => onOpenBoard(sprint.id)}
                sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: 'primary.main' } }}
              >
                <OpenInNew sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>
            {sprint.status !== 'completed' && (
              <Tooltip title="Delete sprint">
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); onDelete(sprint.id); }}
                  sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                >
                  <DeleteOutline sx={{ fontSize: 13 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
            <CalendarToday sx={{ fontSize: 12, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary">
              {sprint.startDate
                ? new Date(sprint.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : '—'}
              {' – '}
              {sprint.endDate
                ? new Date(sprint.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : '—'}
            </Typography>
          </Box>
        </Box>

        {/* Live capacity bar */}
        <Box sx={{ textAlign: 'right', minWidth: 110 }}>
          <Typography
            variant="caption"
            fontWeight={700}
            color={isOverCapacity ? 'error.main' : isOver ? 'primary.main' : 'text.primary'}
            sx={{ transition: 'color 0.12s' }}
          >
            {livePoints}/{velocity} pts
          </Typography>
          <LinearProgress
            variant="determinate"
            value={capacityPct}
            color={isOverCapacity ? 'error' : capacityPct > 80 ? 'warning' : 'primary'}
            sx={{ height: 5, borderRadius: 3, mt: 0.5, transition: 'none' }}
          />
        </Box>
      </Box>

      {/* ── AI Sprint Goal ── */}
      {sprint.aiGoal && (
        <Box
          sx={{
            px: 2,
            py: 0.75,
            bgcolor: 'primary.50',
            borderBottom: '1px solid',
            borderColor: 'primary.100',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 0.75,
          }}
        >
          <Lightbulb sx={{ fontSize: 14, color: 'primary.main', mt: 0.1, flexShrink: 0 }} />
          <Typography variant="caption" color="primary.dark" sx={{ lineHeight: 1.4 }}>
            {sprint.aiGoal}
          </Typography>
        </Box>
      )}

      {/* ── Meta chips ── */}
      <Box sx={{ px: 2, py: 0.75, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          icon={<CheckCircleOutline sx={{ fontSize: 13 }} />}
          label={`${sprint.assignedStories.length}${showPreview ? '+1' : ''} stories`}
          size="small"
          color={isOver ? 'primary' : 'default'}
          sx={{ height: 22, fontSize: '0.7rem', transition: 'background-color 0.12s' }}
        />
        {isOverCapacity && (
          <Chip
            label="Over capacity"
            size="small"
            color="error"
            variant="outlined"
            sx={{ height: 22, fontSize: '0.7rem' }}
          />
        )}
        {(sprint.aiRisks ?? []).length > 0 && (
          <Tooltip
            arrow
            title={
              <Box sx={{ maxWidth: 260 }}>
                {(sprint.aiRisks ?? []).map((r, i) => (
                  <Box key={i} sx={{ mb: 0.5 }}>
                    <Typography variant="caption" fontWeight={700}>
                      {r.probability.toUpperCase()} — {r.description}
                    </Typography>
                    {r.mitigation && (
                      <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
                        ↳ {r.mitigation}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            }
          >
            <Box component="span">
              <Chip
                label={`⚠ ${(sprint.aiRisks ?? []).length} risk${(sprint.aiRisks ?? []).length > 1 ? 's' : ''}`}
                size="small"
                color={RISK_COLOR[(sprint.aiRisks ?? [])[0]?.probability ?? 'low'] as 'error' | 'warning' | 'default'}
                variant="outlined"
                sx={{ height: 22, fontSize: '0.7rem', cursor: 'help' }}
              />
            </Box>
          </Tooltip>
        )}
        <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
          ~{Math.ceil(livePoints / 2)} days
        </Typography>

        {/* Generate Tasks for entire sprint */}
        {sprint.assignedStories.length > 0 && (
          <Tooltip title="AI-generate tasks for all stories in this sprint">
            <span>
              <Button
                size="small"
                variant="outlined"
                startIcon={
                  sprint.assignedStories.some((s) => taskGenStatus[s.id] === 'loading')
                    ? <CircularProgress size={12} color="inherit" />
                    : sprint.assignedStories.every((s) => taskGenStatus[s.id] === 'done')
                    ? <TaskAlt sx={{ fontSize: 14 }} />
                    : <AutoAwesome sx={{ fontSize: 14 }} />
                }
                disabled={sprint.assignedStories.some((s) => taskGenStatus[s.id] === 'loading')}
                onClick={() => onGenerateTasksForSprint(sprint.assignedStories.map((s) => s.id))}
                sx={{ height: 22, fontSize: '0.68rem', px: 1, fontWeight: 600 }}
              >
                {sprint.assignedStories.every((s) => taskGenStatus[s.id] === 'done')
                  ? 'Tasks Generated'
                  : sprint.assignedStories.some((s) => taskGenStatus[s.id] === 'loading')
                  ? 'Generating…'
                  : 'Generate Tasks'}
              </Button>
            </span>
          </Tooltip>
        )}
      </Box>

      {/* ── Story rows ── */}
      <Box
        sx={{
          px: 2,
          pb: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          minHeight: 56,
        }}
      >
        <AnimatePresence initial={false}>
          {sprint.assignedStories.map((s) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={{ overflow: 'hidden' }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 0.5,
                    px: 1,
                    bgcolor: 'action.selected',
                    borderRadius: 1,
                    '&:hover .story-actions': { opacity: 1 },
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 600, flexShrink: 0 }}
                  >
                    {s.identifier}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {s.title}
                  </Typography>
                  {s.storyPoints != null && (
                    <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ flexShrink: 0 }}>
                      {s.storyPoints}
                    </Typography>
                  )}
                  {/* Per-story actions */}
                  <Box className="story-actions" sx={{ display: 'flex', alignItems: 'center', gap: 0.25, opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
                    <Tooltip title="Add task manually">
                      <IconButton
                        size="small"
                        sx={{ p: 0.25, color: 'primary.main' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedStoryId(expandedStoryId === s.id ? null : s.id);
                          setTaskTitle('');
                          setTaskHours('');
                        }}
                      >
                        <PlaylistAdd sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={taskGenStatus[s.id] === 'done' ? 'Tasks generated' : 'AI: generate tasks'}>
                      <IconButton
                        size="small"
                        disabled={taskGenStatus[s.id] === 'loading'}
                        sx={{ p: 0.25, color: taskGenStatus[s.id] === 'done' ? 'success.main' : 'text.secondary' }}
                        onClick={(e) => { e.stopPropagation(); onGenerateTasksForSprint([s.id]); }}
                      >
                        {taskGenStatus[s.id] === 'loading'
                          ? <CircularProgress size={12} />
                          : taskGenStatus[s.id] === 'done'
                          ? <TaskAlt sx={{ fontSize: 13 }} />
                          : <AutoAwesome sx={{ fontSize: 13 }} />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Inline task creation form */}
                <Collapse in={expandedStoryId === s.id}>
                  <Box
                    sx={{
                      ml: 1, pl: 1.5,
                      borderLeft: '2px solid', borderColor: 'primary.light',
                      display: 'flex', flexDirection: 'column', gap: 1, py: 0.75,
                    }}
                  >
                    <Typography variant="caption" fontWeight={700} color="primary.main">
                      Add task to {s.identifier}
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Task title…"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask(s.id) }}
                      autoFocus
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem', py: 0.75 } }}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <select
                          value={taskType}
                          onChange={(e) => setTaskType(e.target.value as TaskType)}
                          style={{
                            width: '100%', fontSize: '0.75rem', padding: '4px 6px',
                            border: '1px solid #ccc', borderRadius: 4, background: 'inherit', color: 'inherit',
                          }}
                        >
                          {TASK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </Box>
                      <TextField
                        size="small"
                        type="number"
                        placeholder="Hrs"
                        value={taskHours}
                        onChange={(e) => setTaskHours(e.target.value)}
                        slotProps={{ htmlInput: { min: 0.5, step: 0.5 } }}
                        sx={{ width: 72, '& .MuiInputBase-input': { fontSize: '0.8rem', py: 0.75 } }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.75 }}>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={!taskTitle.trim() || saving}
                        onClick={() => handleAddTask(s.id)}
                        sx={{ fontSize: '0.72rem', py: 0.5, minWidth: 0 }}
                      >
                        {saving ? <CircularProgress size={12} color="inherit" /> : 'Add'}
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setExpandedStoryId(null)}
                        sx={{ fontSize: '0.72rem', py: 0.5, minWidth: 0 }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                </Collapse>
              </Box>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ── Live drop preview ── */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
              style={{ overflow: 'hidden' }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 0.5,
                  px: 1,
                  bgcolor: 'primary.100',
                  borderRadius: 1,
                  border: '1px dashed',
                  borderColor: 'primary.main',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 600, flexShrink: 0 }}
                >
                  {activeStory!.identifier}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'primary.dark' }}
                >
                  {activeStory!.title}
                </Typography>
                {activeStory!.storyPoints != null && (
                  <Typography variant="caption" fontWeight={700} color="primary.main">
                    {activeStory!.storyPoints}
                  </Typography>
                )}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty state ── */}
        {sprint.assignedStories.length === 0 && !showPreview && (
          <Box
            sx={{
              py: 2.5,
              textAlign: 'center',
              border: '2px dashed',
              borderColor: isOver ? 'primary.main' : 'divider',
              borderRadius: 1,
              color: isOver ? 'primary.main' : 'text.disabled',
              transition: 'border-color 0.12s, color 0.12s',
              bgcolor: isOver ? 'primary.50' : 'transparent',
            }}
          >
            <Typography variant="caption">
              {isOver ? 'Release to add to this sprint' : 'Drop stories here'}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

// ─── Page ──────────────────────────────────────────────────────────────────

const SprintPlanningPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useUIStore();
  const queryClient = useQueryClient();

  const [teamSize, setTeamSize] = useState(3);
  const [sprintLengthWeeks, setSprintLengthWeeks] = useState(2);

  // ── DnD state ──
  const [activeItem, setActiveItem] = useState<Active | null>(null);
  const [overSprintId, setOverSprintId] = useState<string | null>(null);

  // ── Reset-plan confirm dialog ──
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // ── Backlog search + paging ──
  const [backlogSearch, setBacklogSearch] = useState('');
  const [showAllBacklog, setShowAllBacklog] = useState(false);
  const BACKLOG_PAGE = 50;

  // ── AI planning elapsed-time counter (state only — effect wired after mutation) ──
  const [aiElapsed, setAiElapsed] = useState(0);
  const aiTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Sprint assignment map: storyId → sprintId ──
  // Initialised from DB data so the plan survives tab switches.
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  // ── AI metadata (risks only — goals are persisted in the DB sprint.goal) ──
  const [aiSprintMeta, setAiSprintMeta] = useState<
    Record<string, { goal: string; risks: AiSprintRisk[] }>
  >({});
  const [estimatedPointsBanner, setEstimatedPointsBanner] = useState<PointEstimate[]>([]);

  // ── Task generation state (storyId → status) ──
  const [taskGenStatus, setTaskGenStatus] = useState<Record<string, 'idle' | 'loading' | 'done' | 'error'>>({});

  // ── Queries ──
  const { data: storiesData, isLoading: storiesLoading, isError: storiesError } = useQuery({
    queryKey: ['backlog-stories', projectId],
    queryFn: () => storiesApi.list(projectId!, { status: 'approved' }),
    enabled: !!projectId,
    // Keep data fresh but avoid unnecessary re-renders
    staleTime: 30_000,
  });

  const { data: sprintsData, isLoading: sprintsLoading, isError: sprintsError } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => sprintsApi.list(projectId!),
    enabled: !!projectId,
    staleTime: 30_000,
  });

  // ── Sync assignments from DB whenever story data loads / refreshes ─────────
  // This restores the sprint plan after a tab switch (the component remounts
  // and local state resets to {}, but the DB still has current_sprint_id set).
  useEffect(() => {
    const stories: StorySummary[] = (storiesData as any)?.data ?? [];
    if (!stories.length) return;

    const dbAssignments: Record<string, string> = {};
    stories.forEach((s) => {
      if (s.sprintId) dbAssignments[s.id] = s.sprintId;
    });

    setAssignments((prev) => {
      // Only trigger a re-render when there is an actual difference
      const keys = new Set([...Object.keys(prev), ...Object.keys(dbAssignments)]);
      for (const k of keys) {
        if (prev[k] !== dbAssignments[k]) return dbAssignments;
      }
      return prev; // no change — skip re-render
    });
  }, [storiesData]);

  // ── Mutations ──
  const aiPlanMutation = useMutation({
    mutationFn: () =>
      apiClient
        .post<AiSprintAssignment[]>(
          '/ai/plan-sprints',
          {
            projectId,
            teamSize,
            sprintLengthWeeks,
            velocityOverride: 0,
          },
          { timeout: 600_000 }, // 10-min timeout — gives backend enough runway
        )
        .then((r) => r.data),
    onSuccess: (plan) => {
      const newAssignments: Record<string, string> = {};
      const newMeta: Record<string, { goal: string; risks: AiSprintRisk[] }> = {};
      const allPoints: PointEstimate[] = [];

      // Defensive: handle both camelCase (from serialize_by_alias) and snake_case responses
      plan.forEach((item) => {
        const raw = (item as unknown) as Record<string, unknown>;
        const sprintId     = (raw['sprintId']                ?? raw['sprint_id'])                as string | undefined;
        const storyIds     = (raw['storyIds']                ?? raw['story_ids'])                as string[] | undefined;
        const sprintGoal   = (raw['sprintGoal']              ?? raw['sprint_goal'] ?? '')        as string;
        const risks        = (raw['risks']                   ?? [])                              as AiSprintRisk[];
        const estimatedPts = (raw['estimatedPointsUpdated']  ?? raw['estimated_points_updated'] ?? []) as PointEstimate[];

        if (!sprintId) return;
        (storyIds ?? []).forEach((sid) => { newAssignments[sid] = sprintId; });
        newMeta[sprintId] = { goal: sprintGoal, risks };
        allPoints.push(...estimatedPts);
      });

      setAssignments(newAssignments);
      setAiSprintMeta(newMeta);
      setEstimatedPointsBanner(allPoints);
      if (allPoints.length > 0) queryClient.invalidateQueries({ queryKey: ['backlog-stories', projectId] });
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      toast.success(
        `AI sprint plan ready — ${plan.length} sprints` +
          (allPoints.length > 0 ? `, ${allPoints.length} story points estimated` : ''),
      );
    },
    onError: (err: unknown) => {
      // The axios interceptor already shows a generic "Server error" toast for 5xx.
      // Override with the actual AI error detail if available.
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (detail) toast.error(detail);
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ sprintId, storyId }: { sprintId: string; storyId: string }) =>
      sprintsApi.addStory(sprintId, storyId),
    onSuccess: () => {
      // Refresh stories so sprintId is up-to-date in the cache (needed for tab-switch restore)
      queryClient.invalidateQueries({ queryKey: ['backlog-stories', projectId] });
    },
    onError: () => toast.error('Failed to assign story'),
  });

  const createSprintsMutation = useMutation({
    mutationFn: async (count: number) => {
      const today = new Date();
      const results = [];
      const daysPerSprint = sprintLengthWeeks * 7;
      for (let i = 0; i < count; i++) {
        const start = new Date(today);
        start.setDate(today.getDate() + i * daysPerSprint);
        const end = new Date(start);
        end.setDate(start.getDate() + daysPerSprint - 1);
        results.push(await sprintsApi.create(projectId!, {
          name: `Sprint ${i + 1}`,
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10),
        }));
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      toast.success(`${results.length} sprints created`);
    },
    onError: () => toast.error('Failed to create sprints'),
  });

  const clearPlanMutation = useMutation({
    mutationFn: () => sprintsApi.clearPlan(projectId!),
    onSuccess: (result) => {
      setAiSprintMeta({});
      setEstimatedPointsBanner([]);
      // Optimistically wipe all sprints from the cache immediately
      queryClient.setQueryData(['sprints', projectId], { data: [], meta: { total: 0 } });
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      queryClient.invalidateQueries({ queryKey: ['backlog-stories', projectId] });
      setAssignments({});
      toast.success(
        `Plan cleared — removed ${result.cleared_sprints} sprint${result.cleared_sprints !== 1 ? 's' : ''}, ` +
        `${result.unassigned_stories} stor${result.unassigned_stories !== 1 ? 'ies' : 'y'} returned to backlog`,
      );
    },
    onError: () => toast.error('Failed to clear plan'),
  });

  // ── Delete single sprint ──
  const deleteSprintMutation = useMutation({
    mutationFn: (sprintId: string) => sprintsApi.delete(sprintId),
    onSuccess: (_data, sprintId) => {
      // Optimistically remove from cache
      queryClient.setQueryData(['sprints', projectId], (old: any) => {
        if (!old) return old;
        const kept = (old.data ?? []).filter((s: any) => s.id !== sprintId);
        return { ...old, data: kept, meta: { ...old.meta, total: kept.length } };
      });
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      queryClient.invalidateQueries({ queryKey: ['backlog-stories', projectId] });
      setAssignments((prev) => {
        const next = { ...prev };
        for (const storyId of Object.keys(next)) {
          if (next[storyId] === sprintId) delete next[storyId];
        }
        return next;
      });
      toast.success('Sprint deleted');
    },
    onError: () => toast.error('Failed to delete sprint'),
  });

  // ── Generate tasks via AI for one or more stories ──
  const handleGenerateTasksForSprint = useCallback(async (storyIds: string[]) => {
    // Mark all as loading
    setTaskGenStatus((prev) => {
      const next = { ...prev };
      storyIds.forEach((id) => { next[id] = 'loading'; });
      return next;
    });

    const results = await Promise.allSettled(
      storyIds.map((storyId) =>
        apiClient.post(`/ai/generate-tasks/${storyId}`, {})
      )
    );

    setTaskGenStatus((prev) => {
      const next = { ...prev };
      storyIds.forEach((id, i) => {
        next[id] = results[i]!.status === 'fulfilled' ? 'done' : 'error';
      });
      return next;
    });

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed    = results.length - succeeded;
    if (succeeded > 0) toast.success(`Tasks queued for ${succeeded} stor${succeeded !== 1 ? 'ies' : 'y'} — check the Task Board shortly`);
    if (failed > 0)    toast.error(`Failed to queue ${failed} stor${failed !== 1 ? 'ies' : 'y'}`);
  }, [apiClient, toast]);

  // ── Create a single task manually ──
  const handleCreateTask = useCallback(async (
    storyId: string,
    data: { title: string; type: TaskType; estimatedHours?: number },
  ) => {
    await tasksApi.create(storyId, data);
    toast.success(`Task "${data.title}" created`);
  }, [toast]);

  // ── AI elapsed-time counter (depends on aiPlanMutation, so placed after it) ──
  useEffect(() => {
    if (aiPlanMutation.isPending) {
      setAiElapsed(0);
      aiTimerRef.current = setInterval(() => setAiElapsed((n) => n + 1), 1000);
    } else {
      if (aiTimerRef.current) { clearInterval(aiTimerRef.current); aiTimerRef.current = null; }
      setAiElapsed(0);
    }
    return () => { if (aiTimerRef.current) clearInterval(aiTimerRef.current); };
  }, [aiPlanMutation.isPending]);

  // ── DnD sensors: pointer (mouse/touch) + keyboard ──
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 }, // starts after 4px of movement
    }),
    useSensor(KeyboardSensor),
  );

  // ── Derived data ──
  const allStories: StorySummary[] = (storiesData as any)?.data ?? [];
  const allSprints: SprintSummary[] = (sprintsData as any)?.data ?? [];
  const sprintsToReset = allSprints;

  // Auto-calculate velocity from team configuration (mirrors backend formula)
  const effectiveVelocity = Math.max(1, Math.round(teamSize * 8 * sprintLengthWeeks * 0.80));

  // Estimate sprint count from backlog total points (default 3 pts for unestimated, same as backend)
  const totalBacklogPoints = allStories.reduce((sum, s) => sum + (s.storyPoints ?? 3), 0);
  const estimatedSprintCount = Math.max(1, Math.ceil(totalBacklogPoints / effectiveVelocity));

  const activeStory: StorySummary | null = activeItem
    ? (activeItem.data.current as { story: StorySummary } | undefined)?.story ?? null
    : null;

  const backlogStories = allStories.filter((s) => !assignments[s.id]);

  const q = backlogSearch.trim().toLowerCase();
  const filteredBacklog = q
    ? backlogStories.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.identifier ?? '').toLowerCase().includes(q),
      )
    : backlogStories;
  const visibleBacklog = showAllBacklog ? filteredBacklog : filteredBacklog.slice(0, BACKLOG_PAGE);
  const hiddenCount = filteredBacklog.length - visibleBacklog.length;

  // Show ALL sprints from DB (AI creates the right count automatically).
  // Sprint goals come from aiSprintMeta (set right after AI plan completes) OR
  // fall back to sprint.goal from the DB — this keeps the goal visible after a
  // tab switch when aiSprintMeta has been reset to {}.
  const sprintsWithStories: EnrichedSprint[] = allSprints.map((sprint) => ({
    ...sprint,
    assignedStories: allStories.filter((s) => assignments[s.id] === sprint.id),
    aiGoal: aiSprintMeta[sprint.id]?.goal ?? sprint.goal ?? undefined,
    aiRisks: aiSprintMeta[sprint.id]?.risks ?? [],
  }));

  // ── DnD handlers ──
  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    setActiveItem(active);
  }, []);

  const handleDragOver = useCallback(({ over }: DragOverEvent) => {
    const sprintId = (over?.data.current as { sprintId?: string } | undefined)?.sprintId ?? null;
    setOverSprintId(sprintId);
  }, []);

  const handleDragEnd = useCallback(({ active, over }: DragEndEvent) => {
    setActiveItem(null);
    setOverSprintId(null);

    if (!over) return;
    const sprintId = (over.data.current as { sprintId?: string } | undefined)?.sprintId;
    if (!sprintId) return;

    const storyId = active.id as string;
    // Prevent re-assigning to the same sprint
    if (assignments[storyId] === sprintId) return;

    setAssignments((prev) => ({ ...prev, [storyId]: sprintId }));
    assignMutation.mutate({ sprintId, storyId });
  }, [assignments, assignMutation]);

  const handleDragCancel = useCallback(() => {
    setActiveItem(null);
    setOverSprintId(null);
  }, []);

  // ── Loading / error ──
  if (storiesLoading || sprintsLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', gap: 2 }}>
        <Skeleton variant="rectangular" width="40%" height={600} sx={{ borderRadius: 2 }} />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      </Box>
    );
  }

  if (storiesError || sprintsError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load sprint planning data.</Alert>
      </Box>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* ── Toolbar ── */}
        <Box
          sx={{
            px: 3, py: 2,
            display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
            borderBottom: '1px solid', borderColor: 'divider',
            bgcolor: 'background.paper', flexShrink: 0,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={800}>Sprint Planning</Typography>
            <Typography variant="caption" color="text.secondary">
              Drag stories from backlog into sprints, or let AI do it
            </Typography>
          </Box>

          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>

            {/* ── Team size ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                Team size:
              </Typography>
              <IconButton size="small" onClick={() => setTeamSize((n) => Math.max(1, n - 1))}>
                <Remove fontSize="small" />
              </IconButton>
              <Typography variant="body2" fontWeight={700} sx={{ minWidth: 20, textAlign: 'center' }}>
                {teamSize}
              </Typography>
              <IconButton size="small" onClick={() => setTeamSize((n) => Math.min(20, n + 1))}>
                <Add fontSize="small" />
              </IconButton>
              <Typography variant="caption" color="text.secondary">dev{teamSize !== 1 ? 's' : ''}</Typography>
            </Box>

            {/* ── Sprint length ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                Sprint:
              </Typography>
              <IconButton size="small" onClick={() => setSprintLengthWeeks((n) => Math.max(1, n - 1))}>
                <Remove fontSize="small" />
              </IconButton>
              <Typography variant="body2" fontWeight={700} sx={{ minWidth: 20, textAlign: 'center' }}>
                {sprintLengthWeeks}
              </Typography>
              <IconButton size="small" onClick={() => setSprintLengthWeeks((n) => Math.min(4, n + 1))}>
                <Add fontSize="small" />
              </IconButton>
              <Typography variant="caption" color="text.secondary">wk{sprintLengthWeeks !== 1 ? 's' : ''}</Typography>
            </Box>

            {/* ── Auto-calculated info ── */}
            <Tooltip title={`Auto: ${teamSize} devs × 8 pts × ${sprintLengthWeeks} wks × 80% efficiency`}>
              <Box
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.5,
                  px: 1.25, py: 0.5, borderRadius: 1.5,
                  bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200',
                  cursor: 'help',
                }}
              >
                <Speed sx={{ fontSize: 14, color: 'primary.main' }} />
                <Typography variant="caption" color="primary.dark" fontWeight={700}>
                  {effectiveVelocity} pts/sprint
                </Typography>
                {totalBacklogPoints > 0 && (
                  <>
                    <Typography variant="caption" color="primary.light" sx={{ mx: 0.25 }}>·</Typography>
                    <Typography variant="caption" color="primary.dark" fontWeight={700}>
                      ~{estimatedSprintCount} sprint{estimatedSprintCount !== 1 ? 's' : ''}
                    </Typography>
                  </>
                )}
              </Box>
            </Tooltip>

            {allSprints.length > 0 && (
              <Tooltip title="Delete all planning sprints and return stories to backlog">
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={clearPlanMutation.isPending
                    ? <CircularProgress size={16} color="inherit" />
                    : <DeleteSweep />}
                  onClick={() => setResetDialogOpen(true)}
                  disabled={clearPlanMutation.isPending}
                  sx={{ fontWeight: 600 }}
                >
                  Reset Plan
                </Button>
              </Tooltip>
            )}

            {/* ── Go to Sprint Board ── shown once sprints exist */}
            {allSprints.length > 0 && (
              <Tooltip title="Open the Sprint Board to start, track, and complete sprints">
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<Dashboard />}
                  endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                  onClick={() => {
                    // Prefer the active sprint; fall back to the first sprint.
                    // allSprints.length > 0 is guaranteed by the parent condition.
                    const target =
                      allSprints.find((s) => s.status === 'active') ??
                      allSprints[0]!;
                    navigate(`/projects/${projectId}/sprints/${target.id}`);
                  }}
                  sx={{ fontWeight: 600 }}
                >
                  Sprint Board
                </Button>
              </Tooltip>
            )}

            <Tooltip
              title={aiPlanMutation.isPending ? 'AI is analysing and allocating stories — this takes 30–90 seconds' : ''}
              placement="bottom"
            >
              <span>
                <Button
                  variant="contained"
                  startIcon={aiPlanMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <AutoAwesome />}
                  onClick={() => aiPlanMutation.mutate()}
                  disabled={aiPlanMutation.isPending}
                  sx={{ fontWeight: 700, minWidth: 170 }}
                >
                  {aiPlanMutation.isPending
                    ? `Planning… ${aiElapsed}s`
                    : 'AI Plan Sprints'}
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {/* ── AI points banner ── */}
        <Collapse in={estimatedPointsBanner.length > 0}>
          <Box
            sx={{
              px: 3, py: 1.25,
              bgcolor: 'success.50',
              borderBottom: '1px solid', borderColor: 'success.200',
              display: 'flex', alignItems: 'center', gap: 1.5,
            }}
          >
            <AutoAwesome sx={{ fontSize: 16, color: 'success.dark' }} />
            <Typography variant="caption" color="success.dark" fontWeight={600}>
              AI estimated story points for {estimatedPointsBanner.length}{' '}
              {estimatedPointsBanner.length === 1 ? 'story' : 'stories'}:
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', flex: 1 }}>
              {estimatedPointsBanner.map((p) => (
                <Chip
                  key={p.storyId}
                  label={`${p.identifier} → ${p.estimatedPoints} pts`}
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                />
              ))}
            </Box>
            <IconButton size="small" onClick={() => setEstimatedPointsBanner([])} sx={{ color: 'success.dark' }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </Collapse>

        {/* ── Two-panel layout ── */}
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* LEFT: Backlog (40%) */}
          <Box
            sx={{
              width: '40%', flexShrink: 0,
              borderRight: '1px solid', borderColor: 'divider',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
          >
            {/* ── Backlog header ── */}
            <Box
              sx={{
                px: 2, py: 1,
                borderBottom: '1px solid', borderColor: 'divider',
                bgcolor: 'background.default',
                display: 'flex', flexDirection: 'column', gap: 0.75, flexShrink: 0,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>Product Backlog</Typography>
                <Chip label={`${backlogStories.length}`} size="small" sx={{ fontWeight: 700, height: 20 }} />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                  {backlogStories.reduce((s, st) => s + (st.storyPoints ?? 0), 0)} pts
                </Typography>
              </Box>
              {/* Search box */}
              <TextField
                size="small"
                placeholder="Search stories…"
                value={backlogSearch}
                onChange={(e) => {
                  setBacklogSearch(e.target.value);
                  setShowAllBacklog(false);
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ fontSize: 16, color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                    endAdornment: backlogSearch ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => { setBacklogSearch(''); setShowAllBacklog(false); }}>
                          <Close sx={{ fontSize: 14 }} />
                        </IconButton>
                      </InputAdornment>
                    ) : undefined,
                  },
                }}
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.8rem' } }}
              />
            </Box>

            {/* ── Story list ── */}
            <Box
              sx={{
                flex: 1, overflowY: 'auto', p: 1.5,
                display: 'flex', flexDirection: 'column', gap: 1,
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-thumb': { borderRadius: 2, bgcolor: 'divider' },
              }}
            >
              {/* Render without 'layout' to avoid framer-motion measuring 400+ elements */}
              <AnimatePresence initial={false}>
                {visibleBacklog.map((story) => (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.15 }}
                  >
                    <BacklogItem story={story} />
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Show more */}
              {hiddenCount > 0 && (
                <Button
                  size="small"
                  variant="text"
                  endIcon={<ExpandMore />}
                  onClick={() => setShowAllBacklog(true)}
                  sx={{ mt: 0.5, fontSize: '0.75rem', color: 'text.secondary' }}
                >
                  Show {hiddenCount} more stor{hiddenCount !== 1 ? 'ies' : 'y'}
                </Button>
              )}

              {/* All-assigned empty state */}
              {backlogStories.length === 0 && (
                <Box sx={{ py: 8, textAlign: 'center', color: 'text.disabled' }}>
                  <CheckCircleOutline sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
                  <Typography variant="body2">All stories assigned!</Typography>
                </Box>
              )}

              {/* No-search-results empty state */}
              {backlogStories.length > 0 && filteredBacklog.length === 0 && (
                <Box sx={{ py: 4, textAlign: 'center', color: 'text.disabled' }}>
                  <Typography variant="body2">No stories match "{backlogSearch}"</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* RIGHT: Sprint slots (60%) */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box
              sx={{
                px: 2.5, py: 1.5,
                borderBottom: '1px solid', borderColor: 'divider',
                bgcolor: 'background.default',
                display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0,
              }}
            >
              <Typography variant="subtitle1" fontWeight={700}>Sprint Plan</Typography>
              <Chip
                label={allSprints.length > 0 ? `${allSprints.length} sprints` : `~${estimatedSprintCount} planned`}
                size="small"
                color={allSprints.length > 0 ? 'primary' : 'default'}
                sx={{ fontWeight: 700 }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
                <Speed sx={{ fontSize: 14, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.secondary">
                  {effectiveVelocity} pts/sprint velocity
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                flex: 1, overflowY: 'auto', p: 2,
                display: 'flex', flexDirection: 'column', gap: 2,
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-thumb': { borderRadius: 2, bgcolor: 'divider' },
              }}
            >
              {sprintsWithStories.map((sprint, index) => (
                <motion.div
                  key={sprint.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: index * 0.04, ease: 'easeOut' }}
                >
                  <SprintDropSlot
                    sprint={sprint}
                    velocity={effectiveVelocity}
                    activeStory={overSprintId === sprint.id ? activeStory : null}
                    onOpenBoard={(sprintId) =>
                      navigate(`/projects/${projectId}/sprints/${sprintId}`)
                    }
                    onDelete={(sprintId) => deleteSprintMutation.mutate(sprintId)}
                    onGenerateTasksForSprint={handleGenerateTasksForSprint}
                    taskGenStatus={taskGenStatus}
                    onCreateTask={handleCreateTask}
                  />
                </motion.div>
              ))}

              {sprintsWithStories.length === 0 && (
                <Box
                  sx={{
                    py: 6, textAlign: 'center',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No sprint slots yet — create them to start dragging stories in.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={createSprintsMutation.isPending
                        ? <CircularProgress size={15} color="inherit" />
                        : <Add />}
                      disabled={createSprintsMutation.isPending}
                      onClick={() => createSprintsMutation.mutate(estimatedSprintCount)}
                    >
                      Create {estimatedSprintCount} Sprint{estimatedSprintCount !== 1 ? 's' : ''}
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={aiPlanMutation.isPending
                        ? <CircularProgress size={15} color="inherit" />
                        : <AutoAwesome />}
                      disabled={aiPlanMutation.isPending}
                      onClick={() => aiPlanMutation.mutate()}
                    >
                      {aiPlanMutation.isPending ? `Planning… ${aiElapsed}s` : 'AI Plan Sprints'}
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── Reset-plan confirmation dialog ── */}
      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Reset Sprint Plan?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete all <strong>{sprintsToReset.length} sprint{sprintsToReset.length !== 1 ? 's' : ''}</strong> and
            return all stories to the backlog.
            <br /><br />
            This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setResetDialogOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={clearPlanMutation.isPending
              ? <CircularProgress size={16} color="inherit" />
              : <DeleteSweep />}
            disabled={clearPlanMutation.isPending}
            onClick={() => {
              setResetDialogOpen(false);
              clearPlanMutation.mutate();
            }}
          >
            {clearPlanMutation.isPending ? 'Clearing…' : 'Yes, Reset Plan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Floating drag overlay ── */}
      <DragOverlay
        dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)', // spring overshoot
        }}
      >
        {activeStory && (
          <Box sx={{ width: '320px', pointerEvents: 'none' }}>
            <BacklogItem story={activeStory} isOverlay />
          </Box>
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default SprintPlanningPage;
