import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Button,
  Avatar,
  Paper,
  Alert,
  CircularProgress,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import { Close, Edit, AutoAwesome, Star, Save, Add, CheckCircle, RadioButtonUnchecked, Delete } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Story } from './StoryCard';
import StoryEditor from './StoryEditor';
import AcceptanceCriteriaEditor, { AcceptanceCriterion } from './AcceptanceCriteriaEditor';
import { tasksApi } from '@/api/tasks';
import type { Task, TaskType, TaskStatus } from '@/types/task.types';

interface StoryDetailDrawerProps {
  story: Story | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: (id: string, data: Partial<Story>) => Promise<void>;
}

const INVESTDimensions = [
  { key: 'independent', label: 'Independent', short: 'I' },
  { key: 'negotiable',  label: 'Negotiable',  short: 'N' },
  { key: 'valuable',    label: 'Valuable',    short: 'V' },
  { key: 'estimable',   label: 'Estimable',   short: 'E' },
  { key: 'small',       label: 'Small',       short: 'S' },
  { key: 'testable',    label: 'Testable',    short: 'T' },
];

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'development',   label: 'Development' },
  { value: 'design',        label: 'Design' },
  { value: 'testing',       label: 'Testing' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'devops',        label: 'DevOps' },
  { value: 'other',         label: 'Other' },
];

const STATUS_COLOR: Record<TaskStatus, string> = {
  todo:        '#94a3b8',
  in_progress: '#3b82f6',
  in_review:   '#f59e0b',
  done:        '#10b981',
  cancelled:   '#ef4444',
};

const TYPE_COLOR: Record<string, string> = {
  development:   '#6366f1',
  design:        '#ec4899',
  testing:       '#f59e0b',
  documentation: '#14b8a6',
  devops:        '#8b5cf6',
  other:         '#64748b',
};

// ── Parse a "Given X, When Y, Then Z" string into an AcceptanceCriterion ────
function parseGWT(text: string, idx: number): AcceptanceCriterion {
  const givenMatch = text.match(/Given\s+(.+?)(?:,\s*When\b|$)/i);
  const whenMatch  = text.match(/When\s+(.+?)(?:,\s*Then\b|$)/i);
  const thenMatch  = text.match(/Then\s+(.+?)$/i);

  const given = givenMatch?.[1]?.trim() ?? '';
  const when  = whenMatch?.[1]?.trim()  ?? '';
  const then_ = thenMatch?.[1]?.trim()  ?? '';

  if (!given && !when && !then_) {
    return { id: `ac-${idx}-${Date.now()}`, given: '', when: text.trim(), then: '', completed: false };
  }

  return { id: `ac-${idx}-${Date.now()}`, given, when, then: then_, completed: false };
}

function gwtToString(c: AcceptanceCriterion): string {
  const parts: string[] = [];
  if (c.given) parts.push(`Given ${c.given}`);
  if (c.when)  parts.push(`When ${c.when}`);
  if (c.then)  parts.push(`Then ${c.then}`);
  return parts.join(', ');
}

// ── Tasks Tab ────────────────────────────────────────────────────────────────

interface AddTaskFormProps {
  storyId: string;
  onCreated: () => void;
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({ storyId, onCreated }) => {
  const [title, setTitle]             = useState('');
  const [type, setType]               = useState<TaskType>('development');
  const [priority, setPriority]       = useState<'critical'|'high'|'medium'|'low'>('medium');
  const [estimatedHours, setEst]      = useState('');
  const [expanded, setExpanded]       = useState(false);

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = { title, type, priority };
      if (estimatedHours) payload['estimatedHours'] = Number(estimatedHours);
      return tasksApi.create(storyId, payload as any);
    },
    onSuccess: () => {
      setTitle(''); setType('development'); setPriority('medium'); setEst('');
      setExpanded(false);
      onCreated();
    },
  });

  if (!expanded) {
    return (
      <Button
        startIcon={<Add />}
        size="small"
        variant="outlined"
        onClick={() => setExpanded(true)}
        sx={{ mt: 1, borderRadius: 2, borderStyle: 'dashed' }}
        fullWidth
      >
        Add Task
      </Button>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mt: 1 }}>
      <TextField
        label="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        size="small"
        fullWidth
        sx={{ mb: 1.5 }}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter' && title.trim()) mutation.mutate();
          if (e.key === 'Escape') setExpanded(false);
        }}
      />
      <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
        <FormControl size="small" sx={{ flex: 1 }}>
          <InputLabel>Type</InputLabel>
          <Select value={type} label="Type" onChange={(e) => setType(e.target.value as TaskType)}>
            {TASK_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ flex: 1 }}>
          <InputLabel>Priority</InputLabel>
          <Select value={priority} label="Priority" onChange={(e) => setPriority(e.target.value as any)}>
            {['critical', 'high', 'medium', 'low'].map((p) => (
              <MenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>{p}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Est. hrs"
          value={estimatedHours}
          onChange={(e) => setEst(e.target.value)}
          size="small"
          type="number"
          sx={{ width: 90 }}
          inputProps={{ min: 0, step: 0.5 }}
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button size="small" onClick={() => setExpanded(false)}>Cancel</Button>
        <Button
          size="small"
          variant="contained"
          onClick={() => mutation.mutate()}
          disabled={!title.trim() || mutation.isPending}
          sx={{ borderRadius: 2 }}
        >
          {mutation.isPending ? 'Adding…' : 'Add Task'}
        </Button>
      </Box>
    </Paper>
  );
};

interface TaskRowProps {
  task: Task;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, onDelete, onStatusChange }) => {
  const isDone = task.status === 'done';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        py: 1,
        px: 1,
        borderRadius: 1.5,
        '&:hover': { bgcolor: 'action.hover' },
        '&:hover .task-actions': { opacity: 1 },
        transition: 'background 0.15s',
      }}
    >
      {/* Done toggle */}
      <Tooltip title={isDone ? 'Mark todo' : 'Mark done'}>
        <IconButton
          size="small"
          onClick={() => onStatusChange(task.id, isDone ? 'todo' : 'done')}
          sx={{ color: isDone ? 'success.main' : 'text.disabled', mt: 0.1, p: 0.5 }}
        >
          {isDone ? <CheckCircle fontSize="small" /> : <RadioButtonUnchecked fontSize="small" />}
        </IconButton>
      </Tooltip>

      {/* Task info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              textDecoration: isDone ? 'line-through' : 'none',
              color: isDone ? 'text.disabled' : 'text.primary',
              fontSize: '0.82rem',
            }}
          >
            {task.title}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.4, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip
            label={task.type}
            size="small"
            sx={{
              height: 16,
              fontSize: '0.6rem',
              fontWeight: 600,
              bgcolor: (TYPE_COLOR[task.type] ?? '#64748b') + '22',
              color: TYPE_COLOR[task.type] ?? '#64748b',
              textTransform: 'capitalize',
            }}
          />
          <Chip
            label={task.status.replace('_', ' ')}
            size="small"
            sx={{
              height: 16,
              fontSize: '0.6rem',
              fontWeight: 600,
              bgcolor: (STATUS_COLOR[task.status] ?? '#94a3b8') + '22',
              color: STATUS_COLOR[task.status] ?? '#94a3b8',
              textTransform: 'capitalize',
            }}
          />
          {task.estimatedHours != null && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              {task.loggedHours ?? 0}/{task.estimatedHours}h
            </Typography>
          )}
          {task.assignee && (
            <Tooltip title={task.assignee.displayName}>
              <Avatar sx={{ width: 16, height: 16, fontSize: '0.5rem' }}>
                {task.assignee.displayName[0]}
              </Avatar>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Hover actions */}
      <Box className="task-actions" sx={{ opacity: 0, transition: 'opacity 0.15s', display: 'flex', gap: 0.5 }}>
        <Tooltip title="Delete task">
          <IconButton
            size="small"
            onClick={() => onDelete(task.id)}
            sx={{ color: 'error.light', p: 0.5 }}
          >
            <Delete sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

interface TasksTabProps {
  story: Story;
}

const TasksTab: React.FC<TasksTabProps> = ({ story }) => {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['story-tasks', story.id],
    queryFn: () => tasksApi.list(story.id),
    staleTime: 30_000,
  });

  const tasks: Task[] = (data as any)?.items ?? (Array.isArray(data) ? data as Task[] : []);
  const total = tasks.length;
  const done  = tasks.filter((t) => t.status === 'done').length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  const invalidate = () => qc.invalidateQueries({ queryKey: ['story-tasks', story.id] });

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => tasksApi.delete(taskId),
    onSuccess: invalidate,
  });

  const statusMutation = useMutation({
    mutationFn: ({ taskId, newStatus }: { taskId: string; newStatus: TaskStatus }) =>
      tasksApi.patch(taskId, { status: newStatus } as any),
    onSuccess: invalidate,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Progress summary */}
      {total > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {done} / {total} tasks complete
            </Typography>
            <Typography variant="caption" fontWeight={700} color={pct === 100 ? 'success.main' : 'text.secondary'}>
              {pct}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={pct}
            color={pct === 100 ? 'success' : 'primary'}
            sx={{ height: 6, borderRadius: 1 }}
          />
        </Box>
      )}

      {/* Task list */}
      {tasks.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            No tasks yet for this story.
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Add tasks below to track the technical work needed.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {tasks.map((task) => (
            <React.Fragment key={task.id}>
              <TaskRow
                task={task}
                onDelete={(id) => deleteMutation.mutate(id)}
                onStatusChange={(id, status) => statusMutation.mutate({ taskId: id, newStatus: status })}
              />
              <Divider sx={{ opacity: 0.5 }} />
            </React.Fragment>
          ))}
        </Box>
      )}

      {/* Add task inline form */}
      <AddTaskForm storyId={story.id} onCreated={invalidate} />
    </Box>
  );
};

// ── Main Drawer component ────────────────────────────────────────────────────

const StoryDetailDrawer: React.FC<StoryDetailDrawerProps> = ({
  story,
  open,
  onClose,
  onUpdate,
}) => {
  const [activeTab, setActiveTab]   = useState(0);
  const [editing, setEditing]       = useState(false);
  const [criteria, setCriteria]     = useState<AcceptanceCriterion[]>([]);
  const [acSaving, setAcSaving]     = useState(false);
  const [acDirty, setAcDirty]       = useState(false);

  // Populate criteria whenever the story changes or the drawer opens
  useEffect(() => {
    if (!story) { setCriteria([]); return; }
    const raw = story.acceptanceCriteria ?? [];
    if (raw.length === 0) {
      setCriteria([]);
    } else {
      setCriteria(raw.map((ac, i) => parseGWT(ac, i)));
    }
    setAcDirty(false);
  }, [story?.id, open]);

  // Prefetch tasks count for the tab badge when drawer opens
  const { data: tasksData } = useQuery({
    queryKey: ['story-tasks', story?.id],
    queryFn: () => tasksApi.list(story!.id),
    enabled: open && !!story?.id,
    staleTime: 30_000,
  });
  const taskCount = (tasksData as any)?.items?.length ?? (Array.isArray(tasksData) ? (tasksData as Task[]).length : 0);

  const handleSave = async (data: Partial<Story>) => {
    if (story) await onUpdate?.(story.id, data);
    setEditing(false);
  };

  const handleSaveCriteria = async () => {
    if (!story || !onUpdate) return;
    setAcSaving(true);
    try {
      const strings = criteria.map(gwtToString).filter(Boolean);
      await onUpdate(story.id, { acceptanceCriteria: strings });
      setAcDirty(false);
    } finally {
      setAcSaving(false);
    }
  };

  const acCount = criteria.length;

  // Tab index mapping (AI tab is conditional)
  const hasAI = story?.aiConfidence !== undefined;
  // Tabs: 0=Details, 1=AC, 2=Tasks, 3=INVEST, 4=AI (optional)
  const TASKS_TAB = 2;
  const INVEST_TAB = 3;
  const AI_TAB = 4;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 580 }, display: 'flex', flexDirection: 'column' } }}
    >
      {/* Header */}
      <Box sx={{
        p: 2, borderBottom: '1px solid', borderColor: 'divider',
        display: 'flex', alignItems: 'center', gap: 1,
      }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={story?.storyId} size="small" sx={{ fontFamily: 'monospace', fontWeight: 700 }} />
            {story?.type && (
              <Chip label={story.type} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
            )}
            {story?.points !== undefined && (
              <Chip label={`${story.points} pts`} size="small" color="primary" />
            )}
          </Box>
        </Box>
        <Button
          size="small"
          startIcon={<Edit />}
          onClick={() => setEditing(!editing)}
          variant={editing ? 'contained' : 'outlined'}
          sx={{ borderRadius: 2 }}
        >
          {editing ? 'Cancel Edit' : 'Edit'}
        </Button>
        <IconButton onClick={onClose}><Close /></IconButton>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ px: 2 }} variant="scrollable" scrollButtons="auto">
          <Tab label="Details" />
          <Tab label={acCount > 0 ? `Acceptance Criteria (${acCount})` : 'Acceptance Criteria'} />
          <Tab label={taskCount > 0 ? `Tasks (${taskCount})` : 'Tasks'} />
          <Tab label="INVEST Score" />
          {hasAI && <Tab label="AI Insights" />}
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>

        {/* ── Tab 0: Details ─────────────────────────────────────── */}
        {activeTab === 0 && story && (
          editing ? (
            <StoryEditor story={story} onSave={handleSave} onCancel={() => setEditing(false)} />
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                {story.title}
              </Typography>

              {/* As a / I want / So that */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'primary.main' + '05', mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>As a</strong> {story.asA}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>I want to</strong> {story.iWant}
                </Typography>
                <Typography variant="body2">
                  <strong>So that</strong> {story.soThat}
                </Typography>
              </Paper>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip
                  label={story.status.replace('_', ' ')}
                  size="small"
                  color={story.status === 'done' ? 'success' : 'primary'}
                />
                <Chip
                  label={story.priority}
                  size="small"
                  color={story.priority === 'critical' ? 'error' : story.priority === 'high' ? 'warning' : 'default'}
                />
              </Box>

              {story.assignee && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">Assignee:</Typography>
                  <Avatar
                    {...(story.assignee.avatar ? { src: story.assignee.avatar } : {})}
                    sx={{ width: 24, height: 24, fontSize: '0.7rem' }}
                  >
                    {story.assignee.name[0]}
                  </Avatar>
                  <Typography variant="body2">{story.assignee.name}</Typography>
                </Box>
              )}

              {/* Inline AC summary on details tab */}
              {acCount > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Acceptance Criteria ({acCount})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {criteria.map((c, i) => (
                      <Box key={c.id} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <Chip
                          label={`AC-${i + 1}`}
                          size="small"
                          sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, flexShrink: 0, mt: 0.2 }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          {c.given && <><strong>Given</strong> {c.given}{c.when || c.then ? ', ' : ''}</>}
                          {c.when  && <><strong>When</strong> {c.when}{c.then ? ', ' : ''}</>}
                          {c.then  && <><strong>Then</strong> {c.then}</>}
                          {!c.given && !c.then && c.when}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  <Button
                    size="small"
                    variant="text"
                    sx={{ mt: 1, fontSize: '0.75rem' }}
                    onClick={() => setActiveTab(1)}
                  >
                    Edit acceptance criteria →
                  </Button>
                </Box>
              )}

              {/* Tasks summary on details tab */}
              {taskCount > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Tasks ({taskCount})
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    sx={{ fontSize: '0.75rem' }}
                    onClick={() => setActiveTab(TASKS_TAB)}
                  >
                    View all tasks →
                  </Button>
                </Box>
              )}
            </motion.div>
          )
        )}

        {/* ── Tab 1: Acceptance Criteria ──────────────────────────── */}
        {activeTab === 1 && (
          <Box>
            {acCount === 0 && !story?.isAiGenerated && (
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                No acceptance criteria yet. Add them below using the Given / When / Then format.
              </Alert>
            )}
            {acCount === 0 && story?.isAiGenerated && (
              <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                This AI-generated story has no acceptance criteria stored. Regenerate stories to
                get proper Given/When/Then criteria, or add them manually below.
              </Alert>
            )}

            <AcceptanceCriteriaEditor
              criteria={criteria}
              onChange={(updated) => { setCriteria(updated); setAcDirty(true); }}
            />

            {/* Save button */}
            {onUpdate && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Save />}
                  onClick={handleSaveCriteria}
                  disabled={acSaving || !acDirty}
                  sx={{ borderRadius: 2 }}
                >
                  {acSaving ? 'Saving…' : acDirty ? 'Save Criteria' : 'Saved'}
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* ── Tab 2: Tasks ────────────────────────────────────────── */}
        {activeTab === TASKS_TAB && story && (
          <TasksTab story={story} />
        )}

        {/* ── Tab 3: INVEST Score ─────────────────────────────────── */}
        {activeTab === INVEST_TAB && story?.investScore && (
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              INVEST Quality Score
            </Typography>
            {INVESTDimensions.map(({ key, label, short }) => {
              const score = (story.investScore as unknown as Record<string, number>)?.[key] || 0;
              return (
                <Box key={key} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">
                      <strong>{short}</strong> — {label}
                    </Typography>
                    <Box>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} sx={{ fontSize: 16, color: i < score ? '#f59e0b' : 'action.disabled' }} />
                      ))}
                    </Box>
                  </Box>
                  <Box sx={{ height: 6, borderRadius: 1, bgcolor: 'action.hover', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(score / 5) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      style={{
                        height: '100%',
                        backgroundColor: score >= 4 ? '#10b981' : score >= 3 ? '#f59e0b' : '#ef4444',
                        borderRadius: 4,
                      }}
                    />
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}

        {activeTab === INVEST_TAB && !story?.investScore && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body2" color="text.secondary">
              No INVEST score available for this story.
            </Typography>
          </Box>
        )}

        {/* ── Tab 4: AI Insights ──────────────────────────────────── */}
        {activeTab === AI_TAB && story?.aiConfidence !== undefined && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AutoAwesome color="secondary" />
              <Typography variant="subtitle2" fontWeight={600}>AI Generation Insights</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Overall Confidence</Typography>
                <Typography variant="h4" fontWeight={700} color="secondary.main">
                  {story.aiConfidence}%
                </Typography>
              </Paper>
              <Typography variant="body2" color="text.secondary">
                This story was generated from requirement analysis. The AI identified key user
                journeys and decomposed them into atomic stories following the INVEST criteria.
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default StoryDetailDrawer;
