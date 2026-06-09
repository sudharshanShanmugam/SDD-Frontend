/**
 * TaskDetailDrawer — full task detail panel matching the design reference.
 *
 * Shows all task fields in a two-column grid, a Tiptap rich-text description,
 * a comments section, and a work-log section.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  Close,
  Delete,
  BugReportOutlined,
  UndoOutlined,
  RedoOutlined,
  FormatBold,
  FormatItalic,
  StrikethroughS,
  FormatQuote,
  FormatListBulleted,
  FormatListNumbered,
  Code,
  Link as LinkIcon,
  AlternateEmail,
  CheckBoxOutlined,
  Send,
  AccessTime,
  Add,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import LinkExt from '@tiptap/extension-link'
import TaskListExt from '@tiptap/extension-task-list'
import TaskItemExt from '@tiptap/extension-task-item'
import { tasksApi } from '@/api/tasks'
import { projectsApi } from '@/api/projects'
import { storiesApi } from '@/api/stories'
import { useUIStore } from '@store/uiStore'
import type { Task, TaskStatus, TaskType, TimeLog } from '@/types/task.types'
import type { Priority } from '@/types/common.types'
import type { TestGenerationResult } from '@/api/stories'
import { TestGenerationDrawer } from './TestGenerationDrawer'

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'todo',        label: 'To Do',       color: '#6366F1' },
  { value: 'in_progress', label: 'In Progress',  color: '#F59E0B' },
  { value: 'in_review',   label: 'In Review',    color: '#8B5CF6' },
  { value: 'done',        label: 'Done',         color: '#10B981' },
  { value: 'cancelled',   label: 'Cancelled',    color: '#94A3B8' },
]

const TYPE_OPTIONS: { value: TaskType; label: string }[] = [
  { value: 'development',   label: 'Development' },
  { value: 'design',        label: 'Design' },
  { value: 'testing',       label: 'QA / Testing' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'devops',        label: 'DevOps' },
  { value: 'other',         label: 'Other' },
]

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: '#EF4444' },
  { value: 'high',     label: 'High',     color: '#F97316' },
  { value: 'medium',   label: 'Medium',   color: '#F59E0B' },
  { value: 'low',      label: 'Low',      color: '#10B981' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function toHhMm(decimalHours: number | null | undefined): string {
  if (decimalHours == null || decimalHours === 0) return '0h 0m'
  const totalMins = Math.round(decimalHours * 60)
  return `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`
}

function parseHhMm(raw: string): number | null {
  const hMatch = raw.match(/(\d+)\s*h/i)
  const mMatch = raw.match(/(\d+)\s*m/i)
  const h = hMatch ? parseInt(hMatch[1]!, 10) : 0
  const m = mMatch ? parseInt(mMatch[1]!, 10) : 0
  if (!hMatch && !mMatch) {
    const plain = parseFloat(raw)
    return isNaN(plain) ? null : plain
  }
  return h + m / 60
}

function initials(name?: string | null): string {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

// ── Rich-text toolbar button ──────────────────────────────────────────────────

interface ToolbarBtnProps {
  label: string | undefined
  icon: React.ReactNode | undefined
  active: boolean | undefined
  onClick: () => void | boolean
  tooltip: string
}

function ToolbarBtn({ label, icon, active = false, onClick, tooltip }: ToolbarBtnProps) {
  return (
    <Tooltip title={tooltip} placement="top">
      <IconButton
        size="small"
        onMouseDown={(e) => { e.preventDefault(); onClick() }}
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1,
          fontSize: '0.75rem',
          fontWeight: active ? 700 : 400,
          color: active ? 'primary.main' : 'text.secondary',
          bgcolor: active ? 'primary.main' + '18' : 'transparent',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        {icon ?? label}
      </IconButton>
    </Tooltip>
  )
}

// ── Tiptap editor with toolbar ────────────────────────────────────────────────

interface RichEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

function RichEditor({ content, onChange, placeholder = 'Add a description…', minHeight = 140 }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Placeholder.configure({ placeholder }),
      LinkExt.configure({ openOnClick: false }),
      TaskListExt,
      TaskItemExt.configure({ nested: true }),
    ],
    content,
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    editorProps: {
      attributes: {
        style: `min-height: ${minHeight}px; padding: 12px; outline: none; font-size: 0.875rem; line-height: 1.7; color: inherit;`,
      },
    },
  })

  // Sync external content changes (e.g. task reload)
  const prevContent = useRef(content)
  useEffect(() => {
    if (editor && content !== prevContent.current && content !== editor.getHTML()) {
      editor.commands.setContent(content, false)
    }
    prevContent.current = content
  }, [editor, content])

  if (!editor) return null

  const toolbarItems = [
    { tooltip: 'Undo', icon: <UndoOutlined sx={{ fontSize: 16 }} />, fn: () => editor.chain().focus().undo().run() },
    { tooltip: 'Redo', icon: <RedoOutlined sx={{ fontSize: 16 }} />, fn: () => editor.chain().focus().redo().run() },
    null,
    { tooltip: 'Heading 1', label: 'H₁', fn: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }) },
    { tooltip: 'Heading 2', label: 'H₂', fn: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
    null,
    { tooltip: 'Bold', icon: <FormatBold sx={{ fontSize: 16 }} />, fn: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
    { tooltip: 'Italic', icon: <FormatItalic sx={{ fontSize: 16 }} />, fn: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
    { tooltip: 'Strikethrough', icon: <StrikethroughS sx={{ fontSize: 16 }} />, fn: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive('strike') },
    null,
    { tooltip: 'Blockquote', icon: <FormatQuote sx={{ fontSize: 16 }} />, fn: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote') },
    { tooltip: 'Bullet list', icon: <FormatListBulleted sx={{ fontSize: 16 }} />, fn: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
    { tooltip: 'Numbered list', icon: <FormatListNumbered sx={{ fontSize: 16 }} />, fn: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
    { tooltip: 'Task list', icon: <CheckBoxOutlined sx={{ fontSize: 16 }} />, fn: () => editor.chain().focus().toggleTaskList().run(), active: editor.isActive('taskList') },
    null,
    { tooltip: 'Inline code', icon: <Code sx={{ fontSize: 16 }} />, fn: () => editor.chain().focus().toggleCode().run(), active: editor.isActive('code') },
    { tooltip: 'Insert link', icon: <LinkIcon sx={{ fontSize: 16 }} />, fn: () => {
      const url = window.prompt('URL')
      if (url) editor.chain().focus().setLink({ href: url }).run()
    }, active: editor.isActive('link') },
    { tooltip: 'Mention', icon: <AlternateEmail sx={{ fontSize: 16 }} />, fn: () => editor.chain().focus().insertContent('@').run() },
  ]

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
      {/* Toolbar */}
      <Box
        sx={{
          display: 'flex',
          gap: 0.25,
          flexWrap: 'wrap',
          alignItems: 'center',
          px: 1,
          py: 0.5,
          bgcolor: 'action.hover',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {toolbarItems.map((item, i) =>
          item === null ? (
            <Box key={`sep-${i}`} sx={{ width: '1px', height: 18, bgcolor: 'divider', mx: 0.25, flexShrink: 0 }} />
          ) : (
            <ToolbarBtn
              key={item.tooltip}
              tooltip={item.tooltip}
              label={item.label}
              icon={item.icon}
              active={item.active}
              onClick={item.fn}
            />
          )
        )}
      </Box>
      {/* Editor area */}
      <Box
        sx={{
          '& .ProseMirror': { minHeight, outline: 'none', padding: '12px', fontSize: '0.875rem', lineHeight: 1.7 },
          '& .ProseMirror p.is-editor-empty:first-child::before': {
            content: 'attr(data-placeholder)',
            color: 'text.disabled',
            pointerEvents: 'none',
            float: 'left',
            height: 0,
          },
          '& .ProseMirror ul[data-type="taskList"]': { listStyle: 'none', pl: 0 },
          '& .ProseMirror ul[data-type="taskList"] li': { display: 'flex', gap: 1, alignItems: 'flex-start' },
          '& .ProseMirror h1': { fontSize: '1.25rem', fontWeight: 700, my: 1 },
          '& .ProseMirror h2': { fontSize: '1.1rem', fontWeight: 700, my: 0.75 },
          '& .ProseMirror blockquote': { borderLeft: '3px solid', borderColor: 'primary.light', pl: 1.5, ml: 0, color: 'text.secondary' },
          '& .ProseMirror code': { bgcolor: 'action.selected', borderRadius: 0.5, px: 0.5, fontFamily: 'monospace', fontSize: '0.8rem' },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  )
}

// ── Field row helper ──────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 0.5, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.5 }}>
      {children}
    </Typography>
  )
}

// ── Comments section ──────────────────────────────────────────────────────────

interface Comment { id: string; author: string; avatar?: string; text: string; createdAt: string }

function CommentsSection({ taskId: _taskId }: { taskId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [draft, setDraft] = useState('')

  const addComment = useCallback(() => {
    if (!draft.trim()) return
    setComments((prev) => [...prev, {
      id: String(Date.now()),
      author: 'You',
      text: draft.trim(),
      createdAt: new Date().toLocaleString(),
    }])
    setDraft('')
  }, [draft])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {comments.length === 0 && (
        <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 2 }}>
          No comments yet. Be the first to comment.
        </Typography>
      )}
      {comments.map((c) => (
        <Stack key={c.id} direction="row" spacing={1.5}>
          <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
            {initials(c.author)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
              <Typography variant="caption" fontWeight={700}>{c.author}</Typography>
              <Typography variant="caption" color="text.disabled">{c.createdAt}</Typography>
            </Stack>
            <Box sx={{ bgcolor: 'action.hover', borderRadius: 1.5, px: 1.5, py: 1 }}>
              <Typography variant="body2">{c.text}</Typography>
            </Box>
          </Box>
        </Stack>
      ))}
      {/* Add comment */}
      <Stack direction="row" spacing={1} alignItems="flex-end">
        <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: 'primary.main' }}>ME</Avatar>
        <TextField
          fullWidth
          size="small"
          multiline
          maxRows={4}
          placeholder="Write a comment…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment() } }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
        <IconButton
          color="primary"
          size="small"
          disabled={!draft.trim()}
          onClick={addComment}
          sx={{ flexShrink: 0, mb: 0.25 }}
        >
          <Send fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  )
}

// ── Work Log section ──────────────────────────────────────────────────────────

function WorkLogSection({ taskId }: { taskId: string }) {
  const { toast } = useUIStore()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [logH, setLogH] = useState('')
  const [logM, setLogM] = useState('')
  const [note, setNote] = useState('')
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10))

  const { data: timeLogs = [], isLoading } = useQuery<TimeLog[]>({
    queryKey: ['task-timelogs', taskId],
    queryFn: () => tasksApi.getTimeLogs(taskId) as Promise<TimeLog[]>,
    staleTime: 30_000,
  })

  const totalHours = (parseInt(logH || '0', 10)) + (parseInt(logM || '0', 10)) / 60

  const logMutation = useMutation({
    mutationFn: () => tasksApi.logTime(taskId, {
      hours: totalHours,
      ...(note ? { description: note } : {}),
      loggedDate: logDate,
    }),
    onSuccess: () => {
      toast.success('Time logged')
      queryClient.invalidateQueries({ queryKey: ['task-timelogs', taskId] })
      queryClient.invalidateQueries({ queryKey: ['task-detail', taskId] })
      setLogH(''); setLogM(''); setNote('')
      setOpen(false)
    },
    onError: () => toast.error('Failed to log time'),
  })

  const deleteMutation = useMutation({
    mutationFn: (logId: string) => tasksApi.deleteTimeLog(taskId, logId),
    onSuccess: () => {
      toast.success('Log deleted')
      queryClient.invalidateQueries({ queryKey: ['task-timelogs', taskId] })
      queryClient.invalidateQueries({ queryKey: ['task-detail', taskId] })
    },
    onError: () => toast.error('Failed to delete log'),
  })

  const handleClose = () => {
    setOpen(false)
    setLogH(''); setLogM(''); setNote('')
    setLogDate(new Date().toISOString().slice(0, 10))
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {isLoading ? (
        <Box sx={{ textAlign: 'center', py: 2 }}><CircularProgress size={24} /></Box>
      ) : timeLogs.length === 0 ? (
        <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 2 }}>
          No time logged yet.
        </Typography>
      ) : (
        timeLogs.map((log) => (
          <Box key={log.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5 }}>
            <Avatar sx={{ width: 32, height: 32, fontSize: '0.7rem', bgcolor: 'secondary.main' }}>
              {initials(log.user?.full_name ?? (user as any)?.displayName)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" fontWeight={700}>{log.user?.full_name ?? (user as any)?.displayName ?? 'Unknown'}</Typography>
                <Chip
                  label={toHhMm(log.hours)}
                  size="small"
                  icon={<AccessTime sx={{ fontSize: '12px !important' }} />}
                  sx={{ height: 20, fontSize: '0.68rem', bgcolor: 'primary.main' + '18', color: 'primary.main' }}
                />
                <Typography variant="caption" color="text.disabled">{log.loggedDate}</Typography>
              </Stack>
              {log.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{log.description}</Typography>
              )}
            </Box>
            <Tooltip title="Delete log">
              <IconButton size="small" color="error" sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
                onClick={() => deleteMutation.mutate(log.id)}>
                <Delete sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Box>
        ))
      )}

      <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => setOpen(true)} sx={{ alignSelf: 'flex-start' }}>
        Log Time
      </Button>

      {/* ── Log Time dialog ── */}
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1, fontSize: '1rem', fontWeight: 700 }}>Log Time</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          {/* h : m inputs */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>Time Spent</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                autoFocus
                size="small"
                type="number"
                label="Hours"
                value={logH}
                onChange={(e) => setLogH(e.target.value)}
                slotProps={{ htmlInput: { min: 0, step: 1, style: { textAlign: 'center' } } }}
                placeholder="0"
                sx={{ width: 90 }}
              />
              <Typography variant="h6" color="text.secondary" sx={{ pb: 0.25 }}>:</Typography>
              <TextField
                size="small"
                type="number"
                label="Minutes"
                value={logM}
                onChange={(e) => setLogM(e.target.value)}
                slotProps={{ htmlInput: { min: 0, max: 59, step: 1, style: { textAlign: 'center' } } }}
                placeholder="0"
                sx={{ width: 90 }}
              />
            </Stack>
          </Box>
          <TextField
            size="small"
            type="date"
            label="Date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <TextField
            size="small"
            label="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What did you work on?"
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={handleClose}>Cancel</Button>
          <Button
            size="small"
            variant="contained"
            disabled={totalHours <= 0 || logMutation.isPending}
            onClick={() => logMutation.mutate()}
          >
            {logMutation.isPending ? <CircularProgress size={14} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export interface TaskDetailDrawerProps {
  taskId: string | null
  onClose: () => void
  onDeleted: () => void
  onStatusChanged: (taskId: string, status: TaskStatus) => void
}

export function TaskDetailDrawer({ taskId, onClose, onDeleted, onStatusChanged }: TaskDetailDrawerProps): React.JSX.Element {
  const { toast } = useUIStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState(0)
  const [editTitle, setEditTitle] = useState<string | null>(null)
  const [testDrawerOpen, setTestDrawerOpen] = useState(false)
  const [testResult, setTestResult] = useState<TestGenerationResult | null>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [testError, setTestError] = useState<string | null>(null)
  const [descHtml, setDescHtml] = useState<string>('')
  const [descDirty, setDescDirty] = useState(false)
  const [editLoggedHours, setEditLoggedHours] = useState(false)
  const [logHoursInput, setLogHoursInput] = useState('')
  const [logMinsInput, setLogMinsInput] = useState('')

  const { data: task, isLoading } = useQuery<Task>({
    queryKey: ['task-detail', taskId],
    queryFn: () => tasksApi.get(taskId!) as Promise<Task>,
    enabled: !!taskId,
    staleTime: 10_000,
  })

  // Reset state when a new task is opened
  useEffect(() => {
    if (task) {
      setEditTitle(null)
      setDescHtml(task.description ?? '')
      setDescDirty(false)
    }
  }, [task?.id])

  // Fetch project members for the assignee/reporter dropdowns
  const _projectId = (task as any)?.projectId ?? (task as any)?.project_id
  const { data: membersData } = useQuery({
    queryKey: ['project-members', _projectId],
    queryFn: () => projectsApi.listMembers(_projectId as string),
    enabled: !!_projectId,
    staleTime: 120_000,
  })
  const members: any[] = Array.isArray(membersData) ? membersData : []

  const patchMutation = useMutation({
    mutationFn: (data: Partial<Task>) => tasksApi.patch(taskId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-detail', taskId] })
      queryClient.invalidateQueries({ queryKey: ['tasks', 'board'] })
    },
    onError: () => toast.error('Failed to update task'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.delete(taskId!),
    onSuccess: () => {
      toast.success('Task deleted')
      onDeleted()
      onClose()
    },
    onError: () => toast.error('Failed to delete task'),
  })

  const patch = useCallback((data: Partial<Task>) => patchMutation.mutate(data), [patchMutation])

  const saveTitle = useCallback(() => {
    if (editTitle !== null && editTitle.trim() && editTitle !== task?.title) {
      patch({ title: editTitle.trim() } as any)
      toast.success('Title saved')
    }
    setEditTitle(null)
  }, [editTitle, task?.title, patch, toast])

  const saveDesc = useCallback(() => {
    if (descDirty) {
      patch({ description: descHtml } as any)
      toast.success('Description saved')
      setDescDirty(false)
    }
  }, [descHtml, descDirty, patch, toast])

  const handleGenerateTests = useCallback(async () => {
    const storyId = (task as any)?.storyId ?? (task as any)?.story_id
    if (!storyId) {
      toast.error('This task is not linked to a user story')
      return
    }
    setTestResult(null)
    setTestError(null)
    setTestLoading(true)
    setTestDrawerOpen(true)
    try {
      const result = await storiesApi.generateTests(storyId)
      setTestResult(result)
    } catch {
      setTestError('Failed to generate test cases. Please try again.')
    } finally {
      setTestLoading(false)
    }
  }, [task, toast])

  return (
    <Drawer
      anchor="right"
      open={!!taskId}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100vw', sm: 720 },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          px: 3, py: 1.5,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid', borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        {task ? (
          <Chip
            label={task.identifier}
            size="small"
            sx={{ fontFamily: 'monospace', fontWeight: 700, bgcolor: 'primary.main' + '18', color: 'primary.main', fontSize: '0.75rem' }}
          />
        ) : <Box />}
        <Stack direction="row" alignItems="center" spacing={0.5}>
          {task && (task as any).storyId && (
            <Tooltip title="Generate Test Cases">
              <IconButton size="small" onClick={handleGenerateTests} disabled={testLoading} color="primary">
                {testLoading ? <CircularProgress size={16} /> : <BugReportOutlined fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
          <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
        </Stack>
      </Box>

      {isLoading || !task ? (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={36} />
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* ── Title ── */}
          <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
            {editTitle !== null ? (
              <TextField
                fullWidth
                variant="outlined"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => { if (e.key === 'Enter') saveTitle() }}
                autoFocus
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 1 },
                  '& input': { fontSize: '1.1rem', fontWeight: 600 },
                }}
              />
            ) : (
              <Typography
                variant="h6"
                fontWeight={600}
                onClick={() => setEditTitle(task.title)}
                sx={{
                  cursor: 'text',
                  px: 1.5, py: 1,
                  border: '1px solid', borderColor: 'divider',
                  borderRadius: 1,
                  lineHeight: 1.4,
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                }}
              >
                {task.title}
              </Typography>
            )}
          </Box>

          {/* ── Field grid ── */}
          <Box
            sx={{
              px: 3, pb: 2,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 2,
            }}
          >
            {/* Status */}
            <Box>
              <FieldLabel>Status</FieldLabel>
              <FormControl fullWidth size="small">
                <Select
                  value={task.status}
                  onChange={(e) => {
                    const s = e.target.value as TaskStatus
                    patch({ status: s } as any)
                    onStatusChanged(task.id, s)
                  }}
                  sx={{ '& .MuiSelect-select': { display: 'flex', alignItems: 'center', gap: 1 } }}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: o.color, flexShrink: 0 }} />
                        {o.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Task Type */}
            <Box>
              <FieldLabel>Task Type</FieldLabel>
              <FormControl fullWidth size="small">
                <Select
                  value={task.type}
                  onChange={(e) => patch({ type: e.target.value as TaskType } as any)}
                >
                  {TYPE_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Start Date */}
            <Box>
              <FieldLabel>Start Date</FieldLabel>
              <TextField
                type="date"
                size="small"
                fullWidth
                value={task.startedAt ? task.startedAt.slice(0, 10) : ''}
                onChange={(e) => patch({ started_at: e.target.value || null } as any)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>

            {/* Due Date */}
            <Box>
              <FieldLabel>Due Date</FieldLabel>
              <TextField
                type="date"
                size="small"
                fullWidth
                value={task.dueDate ? task.dueDate.slice(0, 10) : ''}
                onChange={(e) => patch({ due_date: e.target.value || null } as any)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>

            {/* Est Time */}
            <Box>
              <FieldLabel>Est Time</FieldLabel>
              <EstTimeField
                value={task.estimatedHours}
                onCommit={(h) => patch({ estimatedHours: h } as any)}
              />
            </Box>

            {/* Priority */}
            <Box>
              <FieldLabel>Priority</FieldLabel>
              <FormControl fullWidth size="small">
                <Select
                  value={task.priority}
                  onChange={(e) => patch({ priority: e.target.value as Priority } as any)}
                  sx={{ '& .MuiSelect-select': { display: 'flex', alignItems: 'center', gap: 1 } }}
                >
                  {PRIORITY_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, bgcolor: o.color, borderRadius: 0.5, flexShrink: 0 }} />
                        {o.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Assignee */}
            <Box>
              <FieldLabel>Assignee</FieldLabel>
              <FormControl fullWidth size="small">
                <Select
                  value={task.assignee?.id ?? ''}
                  displayEmpty
                  onChange={(e) => patch({ assigneeId: e.target.value || null } as any)}
                  renderValue={(val) => {
                    if (!val) return <Typography variant="body2" color="text.disabled">Unassigned</Typography>;
                    const m = members.find((m) => m.userId === val);
                    const u = m?.user ?? (task.assignee as any);
                    const name = u?.full_name ?? u?.displayName ?? u?.email ?? '?';
                    return (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar src={u?.avatar_url ?? u?.avatar} sx={{ width: 22, height: 22, fontSize: '0.65rem', bgcolor: 'primary.main' }}>
                          {name[0]}
                        </Avatar>
                        <Typography variant="body2" noWrap>{name}</Typography>
                      </Stack>
                    );
                  }}
                >
                  <MenuItem value=""><em>Unassigned</em></MenuItem>
                  {members.map((m) => (
                    <MenuItem key={m.userId} value={m.userId}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar {...(m.user?.avatar ? { src: m.user.avatar } : {})} sx={{ width: 22, height: 22, fontSize: '0.65rem', bgcolor: 'primary.main' }}>
                          {(m.user?.full_name ?? m.user?.displayName ?? '?')[0]}
                        </Avatar>
                        <Typography variant="body2">{m.user?.full_name ?? m.user?.displayName}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Reporter */}
            <Box>
              <FieldLabel>Reporter</FieldLabel>
              <FormControl fullWidth size="small">
                <Select
                  value={(task.reporter as any)?.id ?? ''}
                  displayEmpty
                  onChange={(e) => patch({ reporterId: e.target.value || null } as any)}
                  renderValue={(val) => {
                    if (!val) return <Typography variant="body2" color="text.disabled">—</Typography>;
                    const m = members.find((m) => m.userId === val);
                    const u = m?.user ?? (task.reporter as any);
                    const name = u?.full_name ?? u?.displayName ?? u?.email ?? '?';
                    return (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar src={u?.avatar_url ?? u?.avatar} sx={{ width: 22, height: 22, fontSize: '0.65rem', bgcolor: 'secondary.main' }}>
                          {name[0]}
                        </Avatar>
                        <Typography variant="body2" noWrap>{name}</Typography>
                      </Stack>
                    );
                  }}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {members.map((m) => (
                    <MenuItem key={m.userId} value={m.userId}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar {...(m.user?.avatar ? { src: m.user.avatar } : {})} sx={{ width: 22, height: 22, fontSize: '0.65rem', bgcolor: 'secondary.main' }}>
                          {(m.user?.full_name ?? m.user?.displayName ?? '?')[0]}
                        </Avatar>
                        <Typography variant="body2">{m.user?.full_name ?? m.user?.displayName}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Logged Hours */}
            <Box>
              <FieldLabel>Logged Hours</FieldLabel>
              <Stack
                direction="row" spacing={1} alignItems="center"
                onClick={() => {
                  const total = task.loggedHours ?? 0
                  setLogHoursInput(String(Math.floor(total)))
                  setLogMinsInput(String(Math.round((total % 1) * 60)))
                  setEditLoggedHours(true)
                }}
                sx={{ p: 0.75, border: '1px solid', borderColor: 'divider', borderRadius: 1, minHeight: 40, cursor: 'pointer', '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' } }}
              >
                <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" fontWeight={500}>{toHhMm(task.loggedHours)}</Typography>
              </Stack>

              <Dialog open={editLoggedHours} onClose={() => setEditLoggedHours(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ pb: 1, fontSize: '1rem', fontWeight: 700 }}>Edit Logged Hours</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>Time Spent</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField
                        autoFocus
                        size="small"
                        type="number"
                        label="Hours"
                        value={logHoursInput}
                        onChange={(e) => setLogHoursInput(e.target.value)}
                        slotProps={{ htmlInput: { min: 0, step: 1, style: { textAlign: 'center' } } }}
                        placeholder="0"
                        sx={{ width: 90 }}
                      />
                      <Typography variant="h6" color="text.secondary" sx={{ pb: 0.25 }}>:</Typography>
                      <TextField
                        size="small"
                        type="number"
                        label="Minutes"
                        value={logMinsInput}
                        onChange={(e) => setLogMinsInput(e.target.value)}
                        slotProps={{ htmlInput: { min: 0, max: 59, step: 1, style: { textAlign: 'center' } } }}
                        placeholder="0"
                        sx={{ width: 90 }}
                      />
                    </Stack>
                  </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                  <Button size="small" onClick={() => setEditLoggedHours(false)}>Cancel</Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => {
                      const h = parseInt(logHoursInput || '0', 10)
                      const m = parseInt(logMinsInput || '0', 10)
                      patch({ actual_hours: h + m / 60 } as any)
                      setEditLoggedHours(false)
                    }}
                  >
                    Save
                  </Button>
                </DialogActions>
              </Dialog>
            </Box>

          </Box>

          <Divider />

          {/* ── Description ── */}
          <Box sx={{ px: 3, py: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={700} color="primary.main">Description</Typography>
              {descDirty && (
                <Button size="small" variant="contained" onClick={saveDesc}>Save</Button>
              )}
            </Stack>
            <RichEditor
              content={descHtml}
              onChange={(html) => { setDescHtml(html); setDescDirty(true) }}
              placeholder="Add a description, acceptance criteria, or notes…"
              minHeight={160}
            />
          </Box>

          <Divider />

          {/* ── Tabs: Comments / Work Log ── */}
          <Box sx={{ px: 3, pb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={{ mb: 2, '& .MuiTab-root': { minHeight: 40, fontSize: '0.8125rem', fontWeight: 600, textTransform: 'none' } }}
            >
              <Tab label="Comments" />
              <Tab label="Work Log" />
            </Tabs>

            {activeTab === 0 && <CommentsSection taskId={task.id} />}
            {activeTab === 1 && <WorkLogSection taskId={task.id} />}
          </Box>
        </Box>
      )}

      {/* ── Footer ── */}
      {task && (
        <Box sx={{ px: 3, py: 1.5, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
          <Button
            fullWidth
            size="small"
            color="error"
            variant="outlined"
            startIcon={deleteMutation.isPending ? <CircularProgress size={14} color="inherit" /> : <Delete />}
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            Delete Task
          </Button>
        </Box>
      )}

      <TestGenerationDrawer
        open={testDrawerOpen}
        loading={testLoading}
        result={testResult}
        error={testError}
        onClose={() => setTestDrawerOpen(false)}
      />
    </Drawer>
  )
}

// ── Est Time field (inline edit with Xh Ym format) ───────────────────────────

function EstTimeField({ value, onCommit }: { value: number | null | undefined; onCommit: (h: number | null) => void }) {
  const [editing, setEditing] = useState(false)
  const [raw, setRaw] = useState('')

  const display = toHhMm(value)

  const commit = () => {
    const parsed = parseHhMm(raw)
    onCommit(parsed)
    setEditing(false)
  }

  if (editing) {
    return (
      <TextField
        size="small"
        fullWidth
        autoFocus
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit() }}
        placeholder="eg: 2h 15m"
        helperText="eg: 2h 15m"
      />
    )
  }

  return (
    <Box
      onClick={() => { setRaw(display); setEditing(true) }}
      sx={{
        display: 'flex', alignItems: 'center',
        p: 0.75, border: '1px solid', borderColor: 'divider', borderRadius: 1, minHeight: 40,
        cursor: 'text',
        '&:hover': { borderColor: 'primary.main' },
      }}
    >
      <Typography variant="body2" fontWeight={500}>{display}</Typography>
    </Box>
  )
}
