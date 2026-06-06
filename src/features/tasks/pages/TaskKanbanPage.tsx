import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Add, Close, Search } from '@mui/icons-material';
import { motion } from 'framer-motion';
import KanbanBoard from '../components/KanbanBoard';
import TaskDetailModal from '../components/TaskDetailModal';
import TaskForm from '../components/TaskForm';
import type { Task, TaskStatus } from '../components/TaskCard';

const TaskKanbanPage: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [initialStatus, setInitialStatus] = useState<TaskStatus>('todo');
  const [search, setSearch] = useState('');

  const handleAddTask = (status: TaskStatus) => {
    setInitialStatus(status);
    setFormOpen(true);
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>Task Board</Typography>
            <Typography variant="body2" color="text.secondary">
              Drag and drop tasks across status columns
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              placeholder="Search tasks..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: 200 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
              }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleAddTask('todo')}
              sx={{ borderRadius: 2 }}
            >
              Add Task
            </Button>
          </Box>
        </Box>
      </motion.div>

      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <KanbanBoard
          onTaskEdit={(t) => { setSelectedTask(t); setFormOpen(true); }}
          onTaskView={handleViewTask}
          onAddTask={handleAddTask}
        />
      </Box>

      <TaskDetailModal
        task={selectedTask}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdate={(id, updates) => console.log('update', id, updates)}
      />

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
          {selectedTask ? 'Edit Task' : 'Create Task'}
          <IconButton onClick={() => setFormOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          <TaskForm
            task={selectedTask}
            initialStatus={initialStatus}
            onSave={async (data) => {
              console.log('save task:', data);
              setFormOpen(false);
            }}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default TaskKanbanPage;
