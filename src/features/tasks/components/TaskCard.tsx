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
  LinearProgress,
} from '@mui/material';
import { MoreVert, Edit, Delete, Visibility, AccessTime, Flag } from '@mui/icons-material';
import { motion } from 'framer-motion';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  taskId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  storyId?: string;
  storyTitle?: string;
  assignee?: { id: string; name: string; avatar?: string };
  estimate?: number; // hours
  timeSpent?: number; // hours
  tags?: string[];
  dueDate?: string;
  checklist?: Array<{ id: string; text: string; done: boolean }>;
  createdAt: string;
}

const priorityColors: Record<TaskPriority, { bg: string; text: string; icon: string }> = {
  critical: { bg: '#fee2e2', text: '#991b1b', icon: '#ef4444' },
  high: { bg: '#fef3c7', text: '#92400e', icon: '#f59e0b' },
  medium: { bg: '#dbeafe', text: '#1e40af', icon: '#3b82f6' },
  low: { bg: '#f1f5f9', text: '#475569', icon: '#94a3b8' },
};

const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: 'To Do', color: '#94a3b8' },
  in_progress: { label: 'In Progress', color: '#3b82f6' },
  review: { label: 'Review', color: '#f59e0b' },
  done: { label: 'Done', color: '#10b981' },
  blocked: { label: 'Blocked', color: '#ef4444' },
};

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
  onView?: (task: Task) => void;
  isDragging?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onView,
  isDragging = false,
}) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const pCfg = priorityColors[task.priority];
  const stCfg = statusConfig[task.status];
  const checklistProgress =
    task.checklist && task.checklist.length > 0
      ? (task.checklist.filter((c) => c.done).length / task.checklist.length) * 100
      : null;

  return (
    <motion.div
      layout
      animate={{ scale: isDragging ? 1.03 : 1, opacity: isDragging ? 0.85 : 1 }}
    >
      <Card
        variant="outlined"
        sx={{
          borderRadius: 2,
          cursor: 'pointer',
          '&:hover': { boxShadow: 3 },
          transition: 'box-shadow 0.15s',
          borderColor: task.status === 'blocked' ? 'error.main' : 'divider',
        }}
        elevation={isDragging ? 8 : 0}
        onClick={() => onView?.(task)}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box sx={{ display: 'flex', gap: 0.75 }}>
              <Chip
                label={task.taskId}
                size="small"
                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, fontFamily: 'monospace' }}
              />
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.25,
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 1,
                  bgcolor: pCfg.bg,
                }}
              >
                <Flag sx={{ fontSize: 10, color: pCfg.icon }} />
                <Typography variant="caption" sx={{ color: pCfg.text, fontSize: '0.65rem', fontWeight: 600 }}>
                  {task.priority}
                </Typography>
              </Box>
            </Box>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }}
            >
              <MoreVert sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
            {task.title}
          </Typography>

          {task.storyTitle && (
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1 }} noWrap>
              {task.storyTitle}
            </Typography>
          )}

          {task.tags && task.tags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
              {task.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  sx={{ height: 16, fontSize: '0.6rem', borderRadius: 0.5 }}
                />
              ))}
            </Box>
          )}

          {checklistProgress !== null && (
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                <Typography variant="caption" color="text.secondary">
                  {task.checklist!.filter((c) => c.done).length}/{task.checklist!.length} subtasks
                </Typography>
                <Typography variant="caption" fontWeight={600}>{Math.round(checklistProgress)}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={checklistProgress}
                sx={{ height: 4, borderRadius: 1 }}
                color={checklistProgress === 100 ? 'success' : 'primary'}
              />
            </Box>
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
              {task.estimate && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                  <AccessTime sx={{ fontSize: 12, color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.disabled">
                    {task.timeSpent ?? 0}/{task.estimate}h
                  </Typography>
                </Box>
              )}
            </Box>
            {task.assignee && (
              <Tooltip title={task.assignee.name}>
                <Avatar
                  src={task.assignee.avatar}
                  sx={{ width: 22, height: 22, fontSize: '0.65rem' }}
                >
                  {task.assignee.name[0]}
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
        <MenuItem onClick={() => { onView?.(task); setMenuAnchor(null); }}>
          <Visibility fontSize="small" sx={{ mr: 1 }} /> View
        </MenuItem>
        <MenuItem onClick={() => { onEdit?.(task); setMenuAnchor(null); }}>
          <Edit fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem sx={{ color: 'error.main' }} onClick={() => { onDelete?.(task.id); setMenuAnchor(null); }}>
          <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </motion.div>
  );
};

export default TaskCard;
