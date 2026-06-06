import React, { useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Paper,
  Divider,
} from '@mui/material';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Story } from './StoryCard';
import AcceptanceCriteriaEditor, { AcceptanceCriterion } from './AcceptanceCriteriaEditor';

const schema = z.object({
  title: z.string().min(3, 'Title required'),
  asA: z.string().min(1, 'Role required'),
  iWant: z.string().min(5, 'Feature description required'),
  soThat: z.string().min(5, 'Business value required'),
  type: z.enum(['feature', 'bug', 'tech_debt', 'spike']),
  status: z.enum(['backlog', 'ready', 'in_progress', 'review', 'done']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  points: z.number().min(0).max(100).optional(),
});

type FormValues = z.infer<typeof schema>;

interface StoryEditorProps {
  story?: Story | null;
  onSave: (data: Partial<Story>) => Promise<void>;
  onCancel?: () => void;
}

const ToolbarButton: React.FC<{
  label: string;
  action: () => void;
  active: boolean;
  mono?: boolean;
}> = ({ label, action, active, mono }) => (
  <Button
    size="small"
    onClick={action}
    variant={active ? 'contained' : 'text'}
    sx={{
      minWidth: 28,
      height: 26,
      fontSize: '0.75rem',
      py: 0,
      px: 0.5,
      fontFamily: mono ? 'monospace' : undefined,
      fontWeight: active ? 700 : 400,
    }}
  >
    {label}
  </Button>
);

const StoryEditor: React.FC<StoryEditorProps> = ({ story, onSave, onCancel }) => {
  const [criteria, setCriteria] = React.useState<AcceptanceCriterion[]>(
    story?.acceptanceCriteria?.map((c, i) => ({
      id: `ac-${i}`,
      given: '',
      when: '',
      then: c,
    })) || []
  );

  const notesEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Add implementation notes, design decisions, or technical context...' }),
    ],
    content: '',
    editorProps: {
      attributes: {
        style: 'min-height: 100px; padding: 12px; outline: none; font-size: 0.875rem; line-height: 1.6;',
      },
    },
  });

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: story?.title || '',
      asA: story?.asA || '',
      iWant: story?.iWant || '',
      soThat: story?.soThat || '',
      type: story?.type || 'feature',
      status: story?.status || 'backlog',
      priority: story?.priority || 'medium',
      points: story?.points,
    },
  });

  useEffect(() => {
    if (story) reset({ ...story });
  }, [story, reset]);

  const onSubmit = async (data: FormValues) => {
    const payload: Partial<Story> = {
      title:             data.title,
      status:            data.status,
      type:              data.type,
      priority:          data.priority,
      asA:               data.asA,
      iWant:             data.iWant,
      soThat:            data.soThat,
      acceptanceCriteria: criteria.map((c) => `Given ${c.given}, When ${c.when}, Then ${c.then}`),
    };
    if (data.points !== undefined) payload.points = data.points;
    await onSave(payload);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Grid container spacing={2.5}>
        {/* Story Title */}
        <Grid item xs={12}>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Story Title"
                fullWidth
                error={!!errors.title}
                helperText={errors.title?.message}
                autoFocus
              />
            )}
          />
        </Grid>

        {/* User Story Format */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'primary.main' + '05' }}>
            <Typography variant="caption" color="primary" fontWeight={700} sx={{ mb: 1.5, display: 'block' }}>
              USER STORY FORMAT
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip label="As a" size="small" color="primary" sx={{ minWidth: 56, fontWeight: 700 }} />
                <Controller
                  name="asA"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="registered user, admin, guest..."
                      size="small"
                      fullWidth
                      error={!!errors.asA}
                      helperText={errors.asA?.message}
                      variant="outlined"
                    />
                  )}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip label="I want" size="small" color="secondary" sx={{ minWidth: 56, fontWeight: 700 }} />
                <Controller
                  name="iWant"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="to reset my password via email..."
                      size="small"
                      fullWidth
                      error={!!errors.iWant}
                      helperText={errors.iWant?.message}
                    />
                  )}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip label="So that" size="small" color="success" sx={{ minWidth: 56, fontWeight: 700 }} />
                <Controller
                  name="soThat"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="I can regain access to my account..."
                      size="small"
                      fullWidth
                      error={!!errors.soThat}
                      helperText={errors.soThat?.message}
                    />
                  )}
                />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Metadata */}
        <Grid item xs={6} sm={3}>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select {...field} label="Type">
                  <MenuItem value="feature">Feature</MenuItem>
                  <MenuItem value="bug">Bug</MenuItem>
                  <MenuItem value="tech_debt">Tech Debt</MenuItem>
                  <MenuItem value="spike">Spike</MenuItem>
                </Select>
              </FormControl>
            )}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select {...field} label="Status">
                  {['backlog', 'ready', 'in_progress', 'review', 'done'].map((s) => (
                    <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth size="small">
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
        <Grid item xs={6} sm={3}>
          <Controller
            name="points"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Story Points"
                type="number"
                size="small"
                fullWidth
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
              />
            )}
          />
        </Grid>

        {/* Acceptance Criteria */}
        <Grid item xs={12}>
          <Divider />
          <Box sx={{ mt: 2 }}>
            <AcceptanceCriteriaEditor criteria={criteria} onChange={setCriteria} />
          </Box>
        </Grid>

        {/* Notes */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Implementation Notes
          </Typography>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ display: 'flex', gap: 0.5, p: 1, bgcolor: 'action.hover', flexWrap: 'wrap' }}>
              {notesEditor && [
                { label: 'B', fn: () => notesEditor.chain().focus().toggleBold().run(), active: notesEditor.isActive('bold'), mono: false as const },
                { label: 'I', fn: () => notesEditor.chain().focus().toggleItalic().run(), active: notesEditor.isActive('italic'), mono: false as const },
                { label: 'UL', fn: () => notesEditor.chain().focus().toggleBulletList().run(), active: notesEditor.isActive('bulletList'), mono: false as const },
                { label: '`', fn: () => notesEditor.chain().focus().toggleCode().run(), active: notesEditor.isActive('code'), mono: true as const },
              ].map(({ label, fn, active, mono }) => (
                <ToolbarButton key={label} label={label} action={fn} active={active} {...(mono ? { mono } : {})} />
              ))}
            </Box>
            <EditorContent editor={notesEditor} />
          </Box>
        </Grid>

        {/* Actions */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            {onCancel && (
              <Button variant="outlined" onClick={onCancel} sx={{ borderRadius: 2 }}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              sx={{ borderRadius: 2, minWidth: 120 }}
            >
              {isSubmitting ? 'Saving...' : story ? 'Update Story' : 'Create Story'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StoryEditor;
