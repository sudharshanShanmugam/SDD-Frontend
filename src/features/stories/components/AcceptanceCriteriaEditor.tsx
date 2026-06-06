import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Paper,
  Chip,
  Tooltip,
} from '@mui/material';
import { Add, Delete, DragIndicator, CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';

export interface AcceptanceCriterion {
  id: string;
  given: string;
  when: string;
  then: string;
  completed?: boolean;
}

interface ACItemProps {
  criterion: AcceptanceCriterion;
  onUpdate: (id: string, updates: Partial<AcceptanceCriterion>) => void;
  onDelete: (id: string) => void;
  index: number;
}

const ACItem: React.FC<ACItemProps> = ({ criterion, onUpdate, onDelete, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: criterion.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: criterion.completed ? 'success.main' + '08' : 'background.paper',
          borderColor: criterion.completed ? 'success.main' : 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Box {...attributes} {...listeners} sx={{ cursor: 'grab', color: 'text.disabled' }}>
            <DragIndicator fontSize="small" />
          </Box>
          <Chip label={`AC-${index + 1}`} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
          <Box sx={{ flex: 1 }} />
          <Tooltip title={criterion.completed ? 'Mark incomplete' : 'Mark complete'}>
            <IconButton
              size="small"
              onClick={() => onUpdate(criterion.id, { completed: !criterion.completed })}
              color={criterion.completed ? 'success' : 'default'}
            >
              {criterion.completed ? <CheckCircle fontSize="small" /> : <RadioButtonUnchecked fontSize="small" />}
            </IconButton>
          </Tooltip>
          <IconButton size="small" color="error" onClick={() => onDelete(criterion.id)}>
            <Delete fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <Chip
              label="GIVEN"
              size="small"
              sx={{ height: 20, minWidth: 56, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#dbeafe', color: '#1d4ed8' }}
            />
            <TextField
              value={criterion.given}
              onChange={(e) => onUpdate(criterion.id, { given: e.target.value })}
              placeholder="the user is logged in"
              size="small"
              fullWidth
              multiline
              variant="standard"
              sx={{ '& .MuiInput-root::before': { borderColor: 'transparent' } }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <Chip
              label="WHEN"
              size="small"
              sx={{ height: 20, minWidth: 56, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#fef9c3', color: '#854d0e' }}
            />
            <TextField
              value={criterion.when}
              onChange={(e) => onUpdate(criterion.id, { when: e.target.value })}
              placeholder="they click the submit button"
              size="small"
              fullWidth
              multiline
              variant="standard"
              sx={{ '& .MuiInput-root::before': { borderColor: 'transparent' } }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <Chip
              label="THEN"
              size="small"
              sx={{ height: 20, minWidth: 56, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#dcfce7', color: '#166534' }}
            />
            <TextField
              value={criterion.then}
              onChange={(e) => onUpdate(criterion.id, { then: e.target.value })}
              placeholder="the form should be submitted successfully"
              size="small"
              fullWidth
              multiline
              variant="standard"
              sx={{ '& .MuiInput-root::before': { borderColor: 'transparent' } }}
            />
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
};

interface AcceptanceCriteriaEditorProps {
  criteria: AcceptanceCriterion[];
  onChange: (criteria: AcceptanceCriterion[]) => void;
  readOnly?: boolean;
}

const AcceptanceCriteriaEditor: React.FC<AcceptanceCriteriaEditorProps> = ({
  criteria,
  onChange,
  readOnly = false,
}) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const addCriterion = () => {
    const newAC: AcceptanceCriterion = {
      id: `ac-${Date.now()}`,
      given: '',
      when: '',
      then: '',
      completed: false,
    };
    onChange([...criteria, newAC]);
  };

  const updateCriterion = (id: string, updates: Partial<AcceptanceCriterion>) => {
    onChange(criteria.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCriterion = (id: string) => {
    onChange(criteria.filter((c) => c.id !== id));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = criteria.findIndex((c) => c.id === active.id);
    const newIndex = criteria.findIndex((c) => c.id === over.id);
    onChange(arrayMove(criteria, oldIndex, newIndex));
  };

  const completedCount = criteria.filter((c) => c.completed).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Acceptance Criteria
          </Typography>
          <Chip
            label={`${completedCount}/${criteria.length}`}
            size="small"
            color={completedCount === criteria.length && criteria.length > 0 ? 'success' : 'default'}
            sx={{ height: 18, fontSize: '0.65rem' }}
          />
        </Box>
        {!readOnly && (
          <Button size="small" startIcon={<Add />} onClick={addCriterion} variant="outlined" sx={{ borderRadius: 2 }}>
            Add Criterion
          </Button>
        )}
      </Box>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={criteria.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <AnimatePresence>
              {criteria.map((criterion, index) => (
                <ACItem
                  key={criterion.id}
                  criterion={criterion}
                  onUpdate={updateCriterion}
                  onDelete={deleteCriterion}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </Box>
        </SortableContext>
      </DndContext>

      {criteria.length === 0 && !readOnly && (
        <Box
          sx={{
            py: 4,
            textAlign: 'center',
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            No acceptance criteria yet
          </Typography>
          <Button size="small" startIcon={<Add />} onClick={addCriterion} variant="outlined">
            Add First Criterion
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default AcceptanceCriteriaEditor;
