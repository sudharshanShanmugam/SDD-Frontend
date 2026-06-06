import React from 'react';
import {
  Box, Typography, TextField, IconButton, Button, Paper, Chip,
  Select, MenuItem, FormControl,
} from '@mui/material';
import { Add, Delete, DragIndicator } from '@mui/icons-material';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';

export interface TestStep {
  id: string;
  order: number;
  action: string;
  expected: string;
  data?: string;
  type: 'action' | 'verification' | 'setup' | 'teardown';
}

const SortableStep: React.FC<{
  step: TestStep;
  onUpdate: (id: string, updates: Partial<TestStep>) => void;
  onDelete: (id: string) => void;
}> = ({ step, onUpdate, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <motion.div ref={setNodeRef} style={style} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
          <Box {...attributes} {...listeners} sx={{ cursor: 'grab', color: 'text.disabled', pt: 0.25 }}>
            <DragIndicator fontSize="small" />
          </Box>
          <Chip
            label={`Step ${step.order}`}
            size="small"
            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={step.type}
              onChange={(e) => onUpdate(step.id, { type: e.target.value as TestStep['type'] })}
              sx={{ height: 24, fontSize: '0.75rem' }}
            >
              {(['action', 'verification', 'setup', 'teardown'] as const).map((t) => (
                <MenuItem key={t} value={t} sx={{ fontSize: '0.8rem' }}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ flex: 1 }} />
          <IconButton size="small" color="error" onClick={() => onDelete(step.id)}>
            <Delete sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            label="Action"
            value={step.action}
            onChange={(e) => onUpdate(step.id, { action: e.target.value })}
            size="small"
            fullWidth
            multiline
            placeholder="Enter the test action..."
          />
          <TextField
            label="Expected Result"
            value={step.expected}
            onChange={(e) => onUpdate(step.id, { expected: e.target.value })}
            size="small"
            fullWidth
            multiline
            placeholder="Expected outcome..."
          />
        </Box>
        {step.data !== undefined && (
          <TextField
            label="Test Data"
            value={step.data}
            onChange={(e) => onUpdate(step.id, { data: e.target.value })}
            size="small"
            fullWidth
            sx={{ mt: 1 }}
            placeholder="Test data values..."
          />
        )}
      </Paper>
    </motion.div>
  );
};

interface TestStepsProps {
  steps: TestStep[];
  onChange: (steps: TestStep[]) => void;
  readOnly?: boolean;
}

const TestSteps: React.FC<TestStepsProps> = ({ steps, onChange, readOnly = false }) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const addStep = () => {
    const newStep: TestStep = {
      id: `step-${Date.now()}`,
      order: steps.length + 1,
      action: '',
      expected: '',
      type: 'action',
    };
    onChange([...steps, newStep]);
  };

  const updateStep = (id: string, updates: Partial<TestStep>) => {
    onChange(steps.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteStep = (id: string) => {
    const updated = steps.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i + 1 }));
    onChange(updated);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIdx = steps.findIndex((s) => s.id === active.id);
    const newIdx = steps.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(steps, oldIdx, newIdx).map((s, i) => ({ ...s, order: i + 1 }));
    onChange(reordered);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          Test Steps ({steps.length})
        </Typography>
        {!readOnly && (
          <Button size="small" startIcon={<Add />} onClick={addStep} variant="outlined" sx={{ borderRadius: 2 }}>
            Add Step
          </Button>
        )}
      </Box>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <AnimatePresence>
              {steps.map((step) => (
                <SortableStep
                  key={step.id}
                  step={step}
                  onUpdate={updateStep}
                  onDelete={deleteStep}
                />
              ))}
            </AnimatePresence>
          </Box>
        </SortableContext>
      </DndContext>

      {steps.length === 0 && !readOnly && (
        <Box sx={{ py: 4, textAlign: 'center', border: '2px dashed', borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>No test steps yet</Typography>
          <Button size="small" startIcon={<Add />} onClick={addStep} variant="outlined">Add First Step</Button>
        </Box>
      )}
    </Box>
  );
};

export default TestSteps;
