import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Chip,
  TextField,
  Button,
  Avatar,
  Divider,
  IconButton,
  Checkbox,
  FormControlLabel,
  Tabs,
  Tab,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Close,
  Edit,
  Save,
  AccessTime,
  Flag,
  Person,
  Add,
  Delete,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import type { Task, TaskStatus, TaskPriority } from './TaskCard';

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: Partial<Task>) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  open,
  onClose,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task?.title || '');
  const [editDesc, setEditDesc] = useState(task?.description || '');
  const [newSubtask, setNewSubtask] = useState('');
  const [localTask, setLocalTask] = useState<Task | null>(task);

  React.useEffect(() => {
    setLocalTask(task);
    setEditTitle(task?.title || '');
    setEditDesc(task?.description || '');
    setEditing(false);
  }, [task]);

  if (!localTask) return null;

  const checklistProgress =
    localTask.checklist && localTask.checklist.length > 0
      ? (localTask.checklist.filter((c) => c.done).length / localTask.checklist.length) * 100
      : 0;

  const toggleSubtask = (id: string) => {
    const updated = {
      ...localTask,
      checklist: localTask.checklist?.map((c) =>
        c.id === id ? { ...c, done: !c.done } : c
      ),
    };
    setLocalTask(updated);
    onUpdate?.(localTask.id, { checklist: updated.checklist });
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    const newItem = { id: `cl-${Date.now()}`, text: newSubtask, done: false };
    const updated = {
      ...localTask,
      checklist: [...(localTask.checklist || []), newItem],
    };
    setLocalTask(updated);
    onUpdate?.(localTask.id, { checklist: updated.checklist });
    setNewSubtask('');
  };

  const removeSubtask = (id: string) => {
    const updated = {
      ...localTask,
      checklist: localTask.checklist?.filter((c) => c.id !== id),
    };
    setLocalTask(updated);
    onUpdate?.(localTask.id, { checklist: updated.checklist });
  };

  const handleSave = () => {
    const updates = { title: editTitle, description: editDesc };
    const updated = { ...localTask, ...updates };
    setLocalTask(updated);
    onUpdate?.(localTask.id, updates);
    setEditing(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label={localTask.taskId} size="small" sx={{ fontFamily: 'monospace', fontWeight: 700 }} />
            <Chip
              label={localTask.status.replace('_', ' ')}
              size="small"
              color={
                localTask.status === 'done' ? 'success' :
                localTask.status === 'blocked' ? 'error' :
                localTask.status === 'in_progress' ? 'primary' : 'default'
              }
            />
          </Box>
          <Box>
            {!editing ? (
              <IconButton size="small" onClick={() => setEditing(true)}><Edit fontSize="small" /></IconButton>
            ) : (
              <IconButton size="small" onClick={handleSave} color="primary"><Save fontSize="small" /></IconButton>
            )}
            <IconButton size="small" onClick={onClose}><Close /></IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Details" />
          <Tab label={`Subtasks ${localTask.checklist ? `(${localTask.checklist.length})` : ''}`} />
        </Tabs>
      </Box>

      <DialogContent>
        {activeTab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {editing ? (
              <TextField
                label="Title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                fullWidth
                autoFocus
              />
            ) : (
              <Typography variant="h6" fontWeight={700}>{localTask.title}</Typography>
            )}

            {editing ? (
              <TextField
                label="Description"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                multiline
                rows={4}
                fullWidth
              />
            ) : (
              localTask.description && (
                <Typography variant="body2" color="text.secondary">{localTask.description}</Typography>
              )
            )}

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {[
                { label: 'Priority', value: localTask.priority, icon: <Flag fontSize="small" /> },
                { label: 'Estimate', value: localTask.estimate ? `${localTask.estimate}h` : '—', icon: <AccessTime fontSize="small" /> },
                { label: 'Time Spent', value: localTask.timeSpent ? `${localTask.timeSpent}h` : '0h', icon: <AccessTime fontSize="small" /> },
              ].map(({ label, value, icon }) => (
                <Box key={label} sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                  <Typography variant="caption" color="text.disabled">{label}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {React.cloneElement(icon as React.ReactElement, { sx: { color: 'text.secondary', fontSize: 14 } })}
                    <Typography variant="body2" fontWeight={600}>{value}</Typography>
                  </Box>
                </Box>
              ))}
              {localTask.assignee && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                  <Typography variant="caption" color="text.disabled">Assignee</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Avatar src={localTask.assignee.avatar} sx={{ width: 18, height: 18, fontSize: '0.6rem' }}>
                      {localTask.assignee.name[0]}
                    </Avatar>
                    <Typography variant="body2">{localTask.assignee.name}</Typography>
                  </Box>
                </Box>
              )}
            </Box>

            {localTask.storyTitle && (
              <Box>
                <Typography variant="caption" color="text.disabled">Linked Story</Typography>
                <Typography variant="body2">{localTask.storyTitle}</Typography>
              </Box>
            )}
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            {localTask.checklist && localTask.checklist.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {localTask.checklist.filter((c) => c.done).length}/{localTask.checklist.length} completed
                  </Typography>
                  <Typography variant="caption" fontWeight={700}>{Math.round(checklistProgress)}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={checklistProgress} sx={{ height: 6, borderRadius: 1, mb: 2 }} color={checklistProgress === 100 ? 'success' : 'primary'} />

                {localTask.checklist.map((item) => (
                  <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Checkbox
                      checked={item.done}
                      onChange={() => toggleSubtask(item.id)}
                      size="small"
                    />
                    <Typography
                      variant="body2"
                      sx={{ flex: 1, textDecoration: item.done ? 'line-through' : 'none', color: item.done ? 'text.disabled' : undefined }}
                    >
                      {item.text}
                    </Typography>
                    <IconButton size="small" onClick={() => removeSubtask(item.id)} color="error">
                      <Delete sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                placeholder="Add subtask..."
                size="small"
                fullWidth
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
              />
              <Button variant="contained" onClick={addSubtask} disabled={!newSubtask.trim()} sx={{ borderRadius: 2 }}>
                <Add />
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailModal;
