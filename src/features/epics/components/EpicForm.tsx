import React, { useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Typography,
  Autocomplete,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { Epic, EpicStatus } from './EpicCard';

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional().default(''),
  status: z.enum(['backlog', 'in_progress', 'review', 'done']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  tags: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof schema>;

interface EpicFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Epic>) => Promise<void>;
  epic?: Epic | null;
  initialStatus?: EpicStatus;
}

const TipTapToolbar: React.FC<{ editor: ReturnType<typeof useEditor> }> = ({ editor }) => {
  if (!editor) return null;
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 0.5,
        p: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'action.hover',
        flexWrap: 'wrap',
      }}
    >
      {[
        { label: 'B', action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
        { label: 'I', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
        { label: 'H1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }) },
        { label: 'H2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
        { label: 'UL', action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
        { label: 'OL', action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
        { label: '`', action: () => editor.chain().focus().toggleCode().run(), active: editor.isActive('code') },
      ].map(({ label, action, active }) => (
        <Button
          key={label}
          size="small"
          onClick={action}
          variant={active ? 'contained' : 'outlined'}
          sx={{
            minWidth: 32,
            height: 28,
            fontSize: '0.75rem',
            py: 0,
            px: 0.75,
            fontWeight: active ? 700 : 400,
          }}
        >
          {label}
        </Button>
      ))}
    </Box>
  );
};

const EpicForm: React.FC<EpicFormProps> = ({ open, onClose, onSave, epic, initialStatus }) => {
  const isEdit = !!epic;

  const editor = useEditor({
    extensions: [StarterKit],
    content: epic?.description || '',
    editorProps: {
      attributes: {
        style: 'min-height: 120px; padding: 12px; outline: none; font-size: 0.875rem; line-height: 1.6;',
      },
    },
  });

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: 'No description.',
      status: initialStatus || 'backlog',
      priority: 'medium',
      tags: [],
    },
  });

  // Reset form whenever the dialog opens (edit or new)
  useEffect(() => {
    if (!open) return;
    const desc = epic?.description || '';
    reset({
      title:       epic?.title       || '',
      description: desc              || 'No description.',
      status:      epic?.status      || initialStatus || 'backlog',
      priority:    epic?.priority    || 'medium',
      tags:        epic?.tags        || [],
    });
    editor?.commands.setContent(desc || '');
  }, [open, epic, initialStatus, reset, editor]);

  const onSubmit = async (data: FormValues) => {
    const payload: Partial<Epic> = {
      title:       data.title,
      description: editor?.getHTML() || data.description,
      status:      data.status,
      priority:    data.priority,
    };
    if (data.tags && data.tags.length > 0) payload.tags = data.tags;
    await onSave(payload);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isEdit ? `Edit Epic: ${epic?.epicId}` : 'Create New Epic'}
      </DialogTitle>
      <DialogContent dividers>
        <Box
          component="form"
          id="epic-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}
        >
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Epic Title"
                fullWidth
                error={!!errors.title}
                helperText={errors.title?.message}
                autoFocus
              />
            )}
          />

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Description
            </Typography>
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                overflow: 'hidden',
                '& .ProseMirror p': { margin: 0 },
                '& .ProseMirror ul, & .ProseMirror ol': { pl: 2 },
              }}
            >
              <TipTapToolbar editor={editor} />
              <EditorContent editor={editor} />
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select {...field} label="Status">
                      <MenuItem value="backlog">Backlog</MenuItem>
                      <MenuItem value="in_progress">In Progress</MenuItem>
                      <MenuItem value="review">Review</MenuItem>
                      <MenuItem value="done">Done</MenuItem>
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
                      <MenuItem value="critical">Critical</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="low">Low</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>

          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <Autocomplete
                multiple
                freeSolo
                options={['auth', 'payments', 'mobile', 'api', 'ui', 'backend', 'security']}
                value={field.value || []}
                onChange={(_, newValue) => field.onChange(newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  <TextField {...(params as any)} label="Tags" placeholder="Add tags..." />
                )}
              />
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="epic-form"
          variant="contained"
          disabled={isSubmitting}
          sx={{ borderRadius: 2 }}
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Epic' : 'Create Epic'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EpicForm;
