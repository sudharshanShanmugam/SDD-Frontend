import React, { useState } from 'react';
import {
  Box, TextField, Grid, FormControl, InputLabel, Select, MenuItem,
  Button, Paper, Typography, Switch, FormControlLabel,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import TestSteps, { TestStep } from './TestSteps';
import type { TestCase, TestType, TestStatus } from './TestCaseTable';

const schema = z.object({
  title: z.string().min(3, 'Title required'),
  type: z.enum(['unit', 'integration', 'e2e', 'manual', 'performance']),
  status: z.enum(['draft', 'active', 'passed', 'failed', 'skipped', 'blocked']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  automated: z.boolean(),
  description: z.string().optional(),
  preconditions: z.string().optional(),
  storyId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface TestCaseEditorProps {
  testCase?: TestCase | null;
  onSave: (data: Partial<TestCase> & { steps: TestStep[] }) => Promise<void>;
  onCancel?: () => void;
}

const TestCaseEditor: React.FC<TestCaseEditorProps> = ({ testCase, onSave, onCancel }) => {
  const [steps, setSteps] = useState<TestStep[]>([]);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: testCase?.title || '',
      type: testCase?.type || 'manual',
      status: testCase?.status || 'draft',
      priority: testCase?.priority || 'medium',
      automated: testCase?.automated || false,
      description: '',
      preconditions: '',
      storyId: testCase?.storyId || '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    await onSave({ ...data, steps });
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Grid container spacing={2.5}>
        <Grid item xs={12}>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Test Case Title" fullWidth autoFocus error={!!errors.title} helperText={errors.title?.message} />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Description" fullWidth multiline rows={2} />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="preconditions"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Preconditions" fullWidth multiline rows={2} placeholder="List any required setup or preconditions..." />
            )}
          />
        </Grid>

        <Grid item xs={4}>
          <Controller name="type" control={control} render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select {...field} label="Type">
                {(['unit', 'integration', 'e2e', 'manual', 'performance'] as TestType[]).map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )} />
        </Grid>

        <Grid item xs={4}>
          <Controller name="priority" control={control} render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select {...field} label="Priority">
                {['critical', 'high', 'medium', 'low'].map((p) => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )} />
        </Grid>

        <Grid item xs={4}>
          <Controller name="status" control={control} render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select {...field} label="Status">
                {(['draft', 'active', 'passed', 'failed', 'skipped', 'blocked'] as TestStatus[]).map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )} />
        </Grid>

        <Grid item xs={6}>
          <Controller name="storyId" control={control} render={({ field }) => (
            <TextField {...field} label="Linked Story ID" fullWidth size="small" placeholder="US-001" />
          )} />
        </Grid>

        <Grid item xs={6}>
          <Controller name="automated" control={control} render={({ field }) => (
            <FormControlLabel
              control={<Switch {...field} checked={field.value} />}
              label="Automated Test"
            />
          )} />
        </Grid>

        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <TestSteps steps={steps} onChange={setSteps} />
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            {onCancel && <Button variant="outlined" onClick={onCancel} sx={{ borderRadius: 2 }}>Cancel</Button>}
            <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ borderRadius: 2 }}>
              {isSubmitting ? 'Saving...' : testCase ? 'Update Test Case' : 'Create Test Case'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TestCaseEditor;
