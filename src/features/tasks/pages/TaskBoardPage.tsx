/**
 * TaskBoardPage — DND Kanban board integrated with the real tasks API.
 *
 * - Lists all project tasks via GET /tasks?project_id=...
 * - Drag-and-drop between columns → PATCH /tasks/:id { status }
 * - "Add Task" button → dialog with story picker + task form
 * - Click a card → right-side detail drawer (edit + delete + time log)
 */
import React, { useMemo, useState, useCallback } from 'react'
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  Add,
  DragIndicator,
  Science,
  AutoAwesome,
} from '@mui/icons-material'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { PageHeader } from '@/shared/components/PageHeader'
import { EmptyState } from '@/shared/components/EmptyState'
import { tasksApi } from '@/api/tasks'
import { storiesApi } from '@/api/stories'
import { sprintsApi } from '@/api/sprints'
import { useUIStore } from '@store/uiStore'
import { TestGenerationDrawer } from '../components/TestGenerationDrawer'
import { TaskDetailDrawer } from '../components/TaskDetailDrawer'
import { StoryDetailPanel } from '@/features/stories/components/StoryDetailPanel'
import type { TestGenerationResult } from '@/api/stories'
import type { Task, TaskStatus, TaskType } from '@/types/task.types'
import type { StorySummary } from '@/types'

// ── Column config ────────────────────────────────────────────

interface ColumnDef {
  id: TaskStatus
  label: string
  color: string
}

const COLUMNS: ColumnDef[] = [
  { id: 'todo',        label: 'To Do',       color: '#6366F1' },
  { id: 'in_progress', label: 'In Progress',  color: '#F59E0B' },
  { id: 'in_review',   label: 'In Review',    color: '#8B5CF6' },
  { id: 'done',        label: 'Done',         color: '#10B981' },
  { id: 'cancelled',   label: 'Cancelled',    color: '#94A3B8' },
]

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high:     '#F97316',
  medium:   '#F59E0B',
  low:      '#10B981',
}

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  development:   'Dev',
  design:        'Design',
  testing:       'QA',
  documentation: 'Docs',
  devops:        'DevOps',
  other:         'Other',
}

// ── Pure display cards (used in DragOverlay — no interaction) ────────────────

function TaskCardView({ task, dragging = false }: {
  task: Task; dragging?: boolean
}): React.JSX.Element {
  const priorityColor = PRIORITY_COLORS[task.priority] ?? '#94A3B8'
  return (
    <Card variant="outlined" sx={{
      mb: 1.5, borderRadius: 2,
      boxShadow: dragging ? '0 8px 24px rgba(0,0,0,0.15)' : 'none',
      userSelect: 'none',
    }}>
      <Box sx={{ p: '12px' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
          <Typography variant="caption" color="text.disabled" fontWeight={500}>{task.identifier || '—'}</Typography>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: priorityColor }} />
        </Stack>
        <Typography variant="body2" fontWeight={500} sx={{ mb: 1.25, lineHeight: 1.45 }}>{task.title}</Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={0.75} flexWrap="wrap">
            {task.type && <Chip label={TASK_TYPE_LABELS[task.type as TaskType] ?? task.type} size="small" sx={{ fontSize: '0.6875rem', height: 20 }} />}
          </Stack>
          <Stack direction="row" spacing={0.75} alignItems="center">
            {task.estimatedHours != null && (
              <Chip label={`${task.estimatedHours}h`} size="small" variant="outlined" sx={{ fontSize: '0.6875rem', height: 20 }} />
            )}
            {task.assignee && (
              <Avatar {...(task.assignee.avatar ? { src: task.assignee.avatar } : {})} sx={{ width: 22, height: 22, fontSize: '0.625rem' }}>
                {task.assignee.displayName?.[0]?.toUpperCase()}
              </Avatar>
            )}
          </Stack>
        </Stack>
      </Box>
    </Card>
  )
}

// ── Sortable wrappers — drag handle + click are handled here ─────────────────

// Shared card hover styles applied to the sortable wrapper
const SORTABLE_CARD_SX = {
  mb: 1.5,
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
  cursor: 'pointer',
  userSelect: 'none' as const,
  display: 'flex',
  alignItems: 'stretch',
  '&:hover': {
    borderColor: 'primary.main',
    boxShadow: '0 2px 10px rgba(99,102,241,0.18)',
    '& .dnd-handle': { opacity: 1 },
  },
}

const HANDLE_SX = {
  width: 20,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'grab',
  opacity: 0,
  color: 'text.secondary',
  transition: 'opacity 150ms ease',
  '&:active': { cursor: 'grabbing' },
  '&:hover': { opacity: 1 },
}

function SortableStoryCard({ story, onDetailClick, onGenerateTests }: {
  story: StorySummary
  onDetailClick: (id: string) => void
  onGenerateTests?: ((id: string) => void) | undefined
}): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: story.id })
  const priorityColor = PRIORITY_COLORS[story.priority] ?? '#94A3B8'
  return (
    <Box
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{ ...SORTABLE_CARD_SX, opacity: isDragging ? 0.4 : 1 }}
      onClick={() => onDetailClick(story.id)}
    >
      {/* Drag handle — stops click propagation so card click doesn't also fire */}
      <Box
        className="dnd-handle"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        sx={HANDLE_SX}
      >
        <DragIndicator sx={{ fontSize: 14 }} />
      </Box>
      {/* Story content */}
      <Box sx={{ flex: 1, p: '12px' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
          <Typography variant="caption" color="text.disabled" fontWeight={500} sx={{ fontFamily: 'monospace' }}>
            {story.identifier || '—'}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            {onGenerateTests && (
              <Tooltip title="Generate Tests">
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); onGenerateTests(story.id) }}
                  sx={{ p: 0.25, color: 'primary.main' }}>
                  <Science sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            )}
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: priorityColor }} />
          </Stack>
        </Stack>
        <Typography variant="body2" fontWeight={500} sx={{ mb: 1.25, lineHeight: 1.45 }}>{story.title}</Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Chip label="Story" size="small" variant="outlined"
            sx={{ fontSize: '0.6875rem', height: 20, color: 'primary.main', borderColor: 'primary.light' }} />
          <Stack direction="row" spacing={0.75} alignItems="center">
            {story.storyPoints != null && (
              <Chip label={`${story.storyPoints} pts`} size="small" variant="outlined" sx={{ fontSize: '0.6875rem', height: 20 }} />
            )}
            {story.assignee && (
              <Tooltip title={story.assignee.displayName}>
                <Avatar {...(story.assignee.avatar ? { src: story.assignee.avatar } : {})} sx={{ width: 22, height: 22, fontSize: '0.625rem' }}>
                  {story.assignee.displayName?.[0]?.toUpperCase()}
                </Avatar>
              </Tooltip>
            )}
          </Stack>
        </Stack>
      </Box>
    </Box>
  )
}

function SortableTaskCard({ task, onDetailClick }: { task: Task; onDetailClick: (id: string) => void }): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const priorityColor = PRIORITY_COLORS[task.priority] ?? '#94A3B8'
  return (
    <Box
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{ ...SORTABLE_CARD_SX, opacity: isDragging ? 0.4 : 1 }}
      onClick={() => onDetailClick(task.id)}
    >
      {/* Drag handle */}
      <Box
        className="dnd-handle"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        sx={HANDLE_SX}
      >
        <DragIndicator sx={{ fontSize: 14 }} />
      </Box>
      {/* Task content */}
      <Box sx={{ flex: 1, p: '12px' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
          <Typography variant="caption" color="text.disabled" fontWeight={500}>{task.identifier || '—'}</Typography>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: priorityColor }} />
        </Stack>
        <Typography variant="body2" fontWeight={500} sx={{ mb: 1.25, lineHeight: 1.45 }}>{task.title}</Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={0.75} flexWrap="wrap">
            {task.type && <Chip label={TASK_TYPE_LABELS[task.type as TaskType] ?? task.type} size="small" sx={{ fontSize: '0.6875rem', height: 20 }} />}
            {task.tags?.slice(0, 1).map(tag => (
              <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ fontSize: '0.6875rem', height: 20 }} />
            ))}
          </Stack>
          <Stack direction="row" spacing={0.75} alignItems="center">
            {task.estimatedHours != null && (
              <Chip label={`${task.estimatedHours}h`} size="small" variant="outlined" sx={{ fontSize: '0.6875rem', height: 20 }} />
            )}
            {task.assignee && (
              <Tooltip title={task.assignee.displayName}>
                <Avatar {...(task.assignee.avatar ? { src: task.assignee.avatar } : {})} sx={{ width: 22, height: 22, fontSize: '0.625rem' }}>
                  {task.assignee.displayName?.[0]?.toUpperCase()}
                </Avatar>
              </Tooltip>
            )}
          </Stack>
        </Stack>
      </Box>
    </Box>
  )
}

// ── Kanban Column ────────────────────────────────────────────

interface KanbanColumnProps {
  column: ColumnDef
  tasks: Task[]
  stories: StorySummary[]
  sprintMode: boolean
  isUpdating?: boolean
  onTaskClick: (taskId: string) => void
  onStoryClick: (storyId: string) => void
  onGenerateTests?: (storyId: string) => void
}

function KanbanColumn({ column, tasks, stories, sprintMode, isUpdating, onTaskClick, onStoryClick, onGenerateTests }: KanbanColumnProps): React.JSX.Element {
  const items = sprintMode ? stories : tasks
  const itemCount = items.length
  const { setNodeRef, isOver } = useDroppable({ id: `column-${column.id}` })

  return (
    <Box sx={{ minWidth: 288, maxWidth: 320, flexShrink: 0 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5, px: 0.5 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: column.color, flexShrink: 0 }} />
        <Typography variant="subtitle2" fontWeight={700}>{column.label}</Typography>
        <Chip
          label={itemCount}
          size="small"
          sx={{ height: 20, fontSize: '0.6875rem', bgcolor: 'action.hover' }}
        />
        {isUpdating && <LinearProgress sx={{ flex: 1, height: 2, borderRadius: 1 }} />}
      </Stack>

      <Box
        ref={setNodeRef}
        sx={{
          bgcolor: isOver ? 'action.hover' : 'background.default',
          borderRadius: 2,
          p: 1.5,
          minHeight: 480,
          border: '1.5px dashed',
          borderColor: isOver ? 'primary.main' : 'divider',
          transition: 'border-color 200ms ease, background 200ms ease',
        }}
      >
        <SortableContext
          items={sprintMode ? stories.map((s) => s.id) : tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {sprintMode
            ? stories.map((story) => (
                <SortableStoryCard
                  key={story.id}
                  story={story}
                  onDetailClick={onStoryClick}
                  onGenerateTests={onGenerateTests}
                />
              ))
            : tasks.map((task) => <SortableTaskCard key={task.id} task={task} onDetailClick={onTaskClick} />)
          }
          {itemCount === 0 && (
            <Box sx={{ py: 6, textAlign: 'center', pointerEvents: 'none', userSelect: 'none' }}>
              <Typography variant="caption" color="text.disabled">
                {sprintMode ? 'No stories' : 'No tasks'}
              </Typography>
            </Box>
          )}
        </SortableContext>
      </Box>
    </Box>
  )
}

// ── Create Task Dialog ───────────────────────────────────────

interface CreateTaskDialogProps {
  open: boolean
  projectId: string
  sprintId?: string
  onClose: () => void
  onCreated: () => void
}

function CreateTaskDialog({ open, projectId, sprintId, onClose, onCreated }: CreateTaskDialogProps): React.JSX.Element {
  const { toast } = useUIStore()
  const [storyId, setStoryId]               = useState('')
  const [title, setTitle]                   = useState('')
  const [type, setType]                     = useState<TaskType>('development')
  const [priority, setPriority]             = useState<Task['priority']>('medium')
  const [estimatedHours, setEstimatedHours] = useState('')

  const { data: storiesData } = useQuery({
    queryKey: ['stories-for-task-picker', projectId, sprintId ?? 'all'],
    queryFn: () => storiesApi.list(projectId, sprintId ? { sprint_id: sprintId } : undefined),
    enabled: open && !!projectId,
    staleTime: 60_000,
  })
  const stories: StorySummary[] = (storiesData as any)?.data ?? []

  const createMutation = useMutation({
    mutationFn: () => {
      // Build payload without undefined values (exactOptionalPropertyTypes strictness)
      const payload: Record<string, unknown> = { title, type, priority }
      if (estimatedHours) payload['estimatedHours'] = Number(estimatedHours)
      return tasksApi.create(storyId, payload as any)
    },
    onSuccess: () => {
      toast.success('Task created')
      onCreated()
      handleClose()
    },
    onError: () => toast.error('Failed to create task'),
  })

  function handleClose() {
    setStoryId(''); setTitle(''); setType('development')
    setPriority('medium'); setEstimatedHours('')
    onClose()
  }

  const canSubmit = storyId && title.trim() && !createMutation.isPending

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Add Task</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>

        {/* Story picker */}
        <FormControl fullWidth size="small" required>
          <InputLabel>Story</InputLabel>
          <Select value={storyId} label="Story" onChange={(e) => setStoryId(e.target.value)}>
            {stories.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                <Typography variant="body2" noWrap>
                  <span style={{ fontFamily: 'monospace', color: '#6366f1', marginRight: 8 }}>
                    {s.identifier}
                  </span>
                  {s.title}
                </Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Title */}
        <TextField
          label="Task title"
          required
          fullWidth
          size="small"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Implement login form validation"
        />

        {/* Type + Priority side-by-side */}
        <Stack direction="row" spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Type</InputLabel>
            <Select value={type} label="Type" onChange={(e) => setType(e.target.value as TaskType)}>
              {Object.entries(TASK_TYPE_LABELS).map(([v, l]) => (
                <MenuItem key={v} value={v}>{l}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Priority</InputLabel>
            <Select value={priority} label="Priority" onChange={(e) => setPriority(e.target.value as Task['priority'])}>
              {['critical', 'high', 'medium', 'low'].map((p) => (
                <MenuItem key={p} value={p} sx={{ color: PRIORITY_COLORS[p] ?? 'inherit' }}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* Estimated hours */}
        <TextField
          label="Estimated hours"
          fullWidth
          size="small"
          type="number"
          slotProps={{ htmlInput: { min: 0, max: 999, step: 0.5 } }}
          value={estimatedHours}
          onChange={(e) => setEstimatedHours(e.target.value)}
          placeholder="e.g. 4"
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined">Cancel</Button>
        <Button
          variant="contained"
          disabled={!canSubmit}
          onClick={() => createMutation.mutate()}
          startIcon={createMutation.isPending ? <CircularProgress size={15} color="inherit" /> : <Add />}
        >
          {createMutation.isPending ? 'Creating…' : 'Create Task'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Page ─────────────────────────────────────────────────────

export function TaskBoardPage(): React.JSX.Element {
  const { projectId } = useParams<{ projectId: string }>()
  const queryClient = useQueryClient()
  const [activeTask, setActiveTask]         = useState<Task | null>(null)
  const [updatingId, setUpdatingId]         = useState<string | null>(null)
  const [createOpen, setCreateOpen]         = useState(false)
  const [detailTaskId, setDetailTaskId]     = useState<string | null>(null)
  const [detailStoryId, setDetailStoryId]   = useState<string | null>(null)
  const [testDrawerOpen, setTestDrawerOpen] = useState(false)
  const [testResult]         = useState<TestGenerationResult | null>(null)
  const [testLoading]       = useState(false)
  const [testError]           = useState<string | null>(null)

  // Fetch sprints to find the active one
  const { data: sprintsData } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => sprintsApi.list(projectId!),
    enabled: !!projectId,
    staleTime: 60_000,
  })
  const sprints: any[] = (sprintsData as any)?.data ?? []
  const activeSprint = sprints.find((s: any) => s.status === 'active') ?? null

  // Fetch stories in the active sprint so we can filter tasks client-side
  const { data: sprintStoriesData } = useQuery({
    queryKey: ['sprint-stories', activeSprint?.id],
    queryFn: () => storiesApi.list(projectId!, { sprint_id: activeSprint!.id }),
    enabled: !!activeSprint && !!projectId,
    staleTime: 30_000,
  })
  const sprintStoryIds = useMemo(() => {
    const ids = (sprintStoriesData as any)?.data?.map((s: any) => s.id) ?? []
    return new Set<string>(ids)
  }, [sprintStoriesData])

  // Always fetch ALL project tasks — filter client-side to active sprint stories
  const { data, isLoading } = useQuery({
    queryKey: ['tasks', 'board', projectId],
    queryFn: () => tasksApi.listByProject(projectId!),
    enabled: !!projectId,
    staleTime: 30_000,
  })

  const patchStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      tasksApi.patch(taskId, { status } as any),
    onMutate: ({ taskId }) => setUpdatingId(taskId),
    onSettled: () => setUpdatingId(null),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks', 'board', projectId] })
    },
  })

  const allTasks: Task[] = (data as any)?.data ?? []

  // Show only tasks belonging to active sprint stories; fall back to all tasks
  const tasks: Task[] = useMemo(() => {
    if (!activeSprint || sprintStoryIds.size === 0) return allTasks
    return allTasks.filter((t) => sprintStoryIds.has(t.storyId as string))
  }, [allTasks, activeSprint, sprintStoryIds])

  const tasksByColumn = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      todo: [], in_progress: [], in_review: [], done: [], cancelled: [],
    }
    for (const task of tasks) {
      if (map[task.status]) map[task.status].push(task)
    }
    return map
  }, [tasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTask(tasks.find((t) => t.id === String(event.active.id)) ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return

    const overId = String(over.id)
    const activeId = String(active.id)

    let targetColumnId: TaskStatus | null = null
    if (overId.startsWith('column-')) {
      targetColumnId = overId.replace('column-', '') as TaskStatus
    } else {
      targetColumnId = tasks.find((t) => t.id === overId)?.status ?? null
    }
    if (!targetColumnId) return

    const draggedTask = tasks.find((t) => t.id === activeId)
    if (!draggedTask || draggedTask.status === targetColumnId) return

    patchStatusMutation.mutate({ taskId: draggedTask.id, status: targetColumnId })
  }

  const handleDetailClick = useCallback((taskId: string) => {
    setDetailTaskId(taskId)
  }, [])

  const handleStoryClick = useCallback((storyId: string) => {
    setDetailStoryId(storyId)
  }, [])

  const handleDetailStatusChanged = useCallback((taskId: string, newStatus: TaskStatus) => {
    patchStatusMutation.mutate({ taskId, status: newStatus })
  }, [patchStatusMutation])

  const refreshBoard = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['tasks', 'board', projectId] })
  }, [queryClient, projectId])

  // ── Setup tasks for ALL sprint-assigned stories in the project ──
  const [settingUp, setSettingUp] = useState(false)
  const [setupProgress, setSetupProgress] = useState('')
  const { toast } = useUIStore()

  const handleSetupSprintTasks = useCallback(async () => {
    if (!projectId) return
    setSettingUp(true)
    setSetupProgress('Loading stories…')

    try {
      // 1. Fetch ALL project stories that are assigned to a sprint
      const storiesResp = await storiesApi.list(projectId, { page_size: 500 } as any)
      const allStories: StorySummary[] = (storiesResp as any)?.data ?? []
      const sprintStories = allStories.filter((s) => !!(s as any).sprintId)

      if (sprintStories.length === 0) {
        toast.warning('No stories assigned to sprints yet. Run AI Sprint Planning first.')
        return
      }

      // 2. Find which stories already have tasks (to avoid duplicates)
      const tasksResp = await tasksApi.listByProject(projectId)
      const existingStoryIds = new Set<string>(
        ((tasksResp as any)?.data ?? []).map((t: any) => t.storyId).filter(Boolean)
      )
      const needsTasks = sprintStories.filter((s) => !existingStoryIds.has(s.id))

      if (needsTasks.length === 0) {
        toast.success('All stories already have tasks!')
        return
      }

      // 3. Create tasks in batches of 5 stories at a time
      const BATCH = 5
      let created = 0
      for (let i = 0; i < needsTasks.length; i += BATCH) {
        const batch = needsTasks.slice(i, i + BATCH)
        setSetupProgress(`Creating tasks… ${Math.min(i + BATCH, needsTasks.length)}/${needsTasks.length} stories`)

        await Promise.all(
          batch.flatMap((story) => {
            const t = story.title
            const id = story.identifier
            return [
              tasksApi.create(story.id, {
                title: `Implement: ${t}`,
                type: 'development' as TaskType,
                priority: 'high',
                estimatedHours: 4,
                description: `Implement the feature for [${id}] ${t}. Ensure all acceptance criteria are met.`,
              }),
              tasksApi.create(story.id, {
                title: `Test: ${t}`,
                type: 'testing' as TaskType,
                priority: 'medium',
                estimatedHours: 2,
                description: `Write and run test cases for [${id}] ${t}. Cover happy path, edge cases, and error scenarios.`,
              }),
              tasksApi.create(story.id, {
                title: `Review & Document: ${t}`,
                type: 'documentation' as TaskType,
                priority: 'low',
                estimatedHours: 1,
                description: `Code review and documentation for [${id}] ${t}. Verify implementation matches requirements.`,
              }),
            ]
          })
        )
        created += batch.length * 3
      }

      toast.success(`Created ${created} tasks for ${needsTasks.length} stories`)
      void queryClient.invalidateQueries({ queryKey: ['tasks', 'board', projectId] })
    } catch (err) {
      toast.error('Failed to create some tasks')
    } finally {
      setSettingUp(false)
      setSetupProgress('')
    }
  }, [projectId, queryClient, toast])

  return (
    <Box>
      <PageHeader
        title="Task Board"
        subtitle={activeSprint
          ? `${activeSprint.name} — showing tasks for active sprint`
          : 'Drag tasks between columns to update status — click a card to view details'
        }
        breadcrumbs={[
          { label: 'Project', href: `/projects/${projectId}` },
          { label: 'Tasks' },
        ]}
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            {activeSprint && (
              <Chip label={`${activeSprint.name} (Active)`} size="small" color="primary" sx={{ height: 24, fontSize: '0.72rem' }} />
            )}
            <Button
              variant="outlined"
              size="small"
              startIcon={settingUp ? <CircularProgress size={14} color="inherit" /> : <AutoAwesome />}
              disabled={settingUp}
              onClick={handleSetupSprintTasks}
              sx={{ fontWeight: 600 }}
            >
              {settingUp ? (setupProgress || 'Creating…') : 'Setup All Sprint Tasks'}
            </Button>
            <Button variant="contained" startIcon={<Add />} size="small" onClick={() => setCreateOpen(true)}>
              Add Task
            </Button>
          </Stack>
        }
        badge={
          tasks.length > 0 ? (
            <Chip label={`${tasks.length} tasks`} size="small" sx={{ height: 20, fontSize: '0.6875rem' }} />
          ) : undefined
        }
      />

      {isLoading && <LinearProgress />}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            pb: 3,
            pt: 1,
            '&::-webkit-scrollbar': { height: 6 },
            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'divider',
              borderRadius: 3,
              '&:hover': { bgcolor: 'action.selected' },
            },
          }}
        >
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByColumn[column.id]}
              stories={[]}
              sprintMode={false}
              onTaskClick={handleDetailClick}
              onStoryClick={handleStoryClick}
              isUpdating={updatingId !== null && tasksByColumn[column.id].some((t) => t.id === updatingId)}
            />
          ))}
        </Box>

        <DragOverlay dropAnimation={null}>
          {activeTask ? <TaskCardView task={activeTask} dragging /> : null}
        </DragOverlay>
      </DndContext>

      {!isLoading && tasks.length === 0 && (
        <EmptyState
          variant="no-data"
          title={activeSprint ? `No tasks in ${activeSprint.name} yet` : 'No tasks yet'}
          description={
            activeSprint && sprintStoryIds.size > 0
              ? `${activeSprint.name} has ${sprintStoryIds.size} stories but no tasks. Create default tasks (Implementation, Tests, Review) for each story instantly.`
              : 'Tasks track the work inside a user story. Create one with Add Task, or generate them from Sprint Planning.'
          }
          action={{
            label: settingUp ? (setupProgress || 'Creating tasks…') : 'Setup All Sprint Tasks',
            onClick: handleSetupSprintTasks,
          }}
        />
      )}

      {/* ── Create Task dialog ── */}
      <CreateTaskDialog
        open={createOpen}
        projectId={projectId ?? ''}
        onClose={() => setCreateOpen(false)}
        onCreated={refreshBoard}
      />

      {/* ── Task detail drawer (task mode) ── */}
      <TaskDetailDrawer
        taskId={detailTaskId}
        onClose={() => setDetailTaskId(null)}
        onDeleted={refreshBoard}
        onStatusChanged={handleDetailStatusChanged}
      />

      {/* ── Story detail panel ── */}
      <StoryDetailPanel
        storyId={detailStoryId}
        onClose={() => setDetailStoryId(null)}
        onDeleted={refreshBoard}
      />

      {/* ── Test Generation drawer ── */}
      <TestGenerationDrawer
        open={testDrawerOpen}
        loading={testLoading}
        result={testResult}
        error={testError}
        onClose={() => setTestDrawerOpen(false)}
      />
    </Box>
  )
}

export default TaskBoardPage
