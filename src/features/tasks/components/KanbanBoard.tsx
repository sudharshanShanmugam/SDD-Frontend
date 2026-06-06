import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Paper,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import TaskCard, { Task, TaskStatus } from './TaskCard';

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: '#94a3b8' },
  { id: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { id: 'review', label: 'Review', color: '#f59e0b' },
  { id: 'done', label: 'Done', color: '#10b981' },
  { id: 'blocked', label: 'Blocked', color: '#ef4444' },
];

const SortableTaskCard: React.FC<{
  task: Task;
  onEdit?: (t: Task) => void;
  onDelete?: (id: string) => void;
  onView?: (t: Task) => void;
}> = ({ task, onEdit, onDelete, onView }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} onView={onView} isDragging={isDragging} />
    </div>
  );
};

const KanbanColumn: React.FC<{
  column: typeof COLUMNS[0];
  tasks: Task[];
  onAddTask?: (status: TaskStatus) => void;
  onEdit?: (t: Task) => void;
  onDelete?: (id: string) => void;
  onView?: (t: Task) => void;
}> = ({ column, tasks, onAddTask, onEdit, onDelete, onView }) => {
  const { setNodeRef } = useDroppable({ id: column.id });
  const totalEstimate = tasks.reduce((a, t) => a + (t.estimate || 0), 0);

  return (
    <Box
      sx={{
        flex: '0 0 260px',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        minHeight: 400,
        maxHeight: 'calc(100vh - 200px)',
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `3px solid ${column.color}`,
          bgcolor: column.color + '10',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" fontWeight={700}>{column.label}</Typography>
          <Chip
            label={tasks.length}
            size="small"
            sx={{ height: 18, minWidth: 24, fontSize: '0.7rem', bgcolor: column.color + '22', color: column.color }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {totalEstimate > 0 && (
            <Typography variant="caption" color="text.disabled">{totalEstimate}h</Typography>
          )}
          <Tooltip title="Add task">
            <IconButton size="small" onClick={() => onAddTask?.(column.id)}>
              <Add fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <Box
          ref={setNodeRef}
          sx={{
            flex: 1,
            p: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            overflowY: 'auto',
          }}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
            />
          ))}
          {tasks.length === 0 && (
            <Box
              sx={{
                py: 4,
                textAlign: 'center',
                color: 'text.disabled',
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Typography variant="caption">No tasks</Typography>
            </Box>
          )}
        </Box>
      </SortableContext>
    </Box>
  );
};

interface KanbanBoardProps {
  onTaskEdit?: (task: Task) => void;
  onTaskView?: (task: Task) => void;
  onAddTask?: (status: TaskStatus) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ onTaskEdit, onTaskView, onAddTask }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const getByStatus = (status: TaskStatus) => tasks.filter((t) => t.status === status);

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveTask(tasks.find((t) => t.id === active.id) || null);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTask(null);
    if (!over) return;
    const colStatus = COLUMNS.find((c) => c.id === over.id)?.id;
    const overTask = tasks.find((t) => t.id === over.id);
    const newStatus = colStatus || overTask?.status;
    if (!newStatus) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === active.id ? { ...t, status: newStatus } : t))
    );
  };

  const handleDelete = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 2,
          height: '100%',
          '&::-webkit-scrollbar': { height: 6 },
          '&::-webkit-scrollbar-thumb': { borderRadius: 3, bgcolor: 'primary.main' },
        }}
      >
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={getByStatus(column.id)}
            onAddTask={onAddTask}
            onEdit={onTaskEdit}
            onDelete={handleDelete}
            onView={onTaskView}
          />
        ))}
      </Box>
      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} isDragging />}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
