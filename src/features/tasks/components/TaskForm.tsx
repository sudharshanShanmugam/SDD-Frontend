import React from 'react';
import {
  Box,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Autocomplete,
  Chip,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Task, TaskStatus, TaskPriority } from './TaskCard';

const schema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'blocked']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  estimate: z.number().min(0).max(200).optional(),
  tags: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof schema>;

interface TaskFormProps {
  task?: Task | null;
  initialStatus?: TaskStatus;
  onSave: (data: Partial<Task>) => Promise<void>;
  onCancel?: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ task, initialStatus = 'todo', onSave, onCancel }) => {
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || initialStatus,
      priority: task?.priority || 'medium',
      estimate: task?.estimate,
      tags: task?.tags || [],
    },
  });

  const onSubmit = async (data: FormValues) => {
    await onSave(data);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Task Title" fullWidth autoFocus error={!!errors.title} helperText={errors.title?.message} />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Description" fullWidth multiline rows={3} />
            )}
          />
        </Grid>

        <Grid item xs={6}>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select {...field} label="Status">
                  {['todo', 'in_progress', 'review', 'done', 'blocked'].map((s) => (
                    <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={6}>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select {...field} label="Priority">
                  {['critical', 'high', 'medium', 'low'].map((p) => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={6}>
          <Controller
            name="estimate"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Estimate (hours)"
                type="number"
                fullWidth
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <Autocomplete
                multiple
                freeSolo
                options={['frontend', 'backend', 'devops', 'testing', 'design', 'database', 'api']}
                value={field.value || []}
                onChange={(_, v) => field.onChange(v)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option} size="small" {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} label="Tags" placeholder="Add tags..." />
                )}
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            {onCancel && (
              <Button variant="outlined" onClick={onCancel} sx={{ borderRadius: 2 }}>
                Cancel
              </Button>
            )}
            <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ borderRadius: 2 }}>
              {isSubmitting ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TaskForm;
