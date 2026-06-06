import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workspacesApi } from '@/api';
import { useAuthStore } from '@store/authStore';
import { useWorkspaceStore } from '@store/workspaceStore';

// ── Colour swatches ───────────────────────────────────────────
const COLOR_SWATCHES = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
];

interface CreateWorkspaceDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called after successful creation with the new workspace */
  onCreated?: (ws: any) => void;
}

export default function CreateWorkspaceDialog({
  open,
  onClose,
  onCreated,
}: CreateWorkspaceDialogProps) {
  const queryClient      = useQueryClient();
  const setCurrentWs     = useWorkspaceStore((s) => s.setCurrentWorkspace);
  const orgId            = useAuthStore((s) => s.organization?.id ?? '')
                           || '00000000-0000-0000-0000-000000000020';

  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [color,       setColor]       = useState(COLOR_SWATCHES[0]);

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: () =>
      workspacesApi.create(orgId, {
        name:  name.trim(),
        color: color,
        ...(description.trim() ? { description: description.trim() } : {}),
      } as { name: string; description?: string; color?: string }),
    onSuccess: (ws) => {
      setCurrentWs(ws as any);
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      onCreated?.(ws);
      handleClose();
    },
  });

  const handleClose = () => {
    setName('');
    setDescription('');
    setColor(COLOR_SWATCHES[0]);
    reset();
    onClose();
  };

  const canSubmit = name.trim().length >= 2 && !isPending;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>New Workspace</DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(error as Error).message ?? 'Failed to create workspace'}
          </Alert>
        )}

        <TextField
          label="Workspace Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          required
          autoFocus
          inputProps={{ maxLength: 80 }}
          helperText="2–80 characters"
          sx={{ mb: 2 }}
        />

        <TextField
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          rows={2}
          inputProps={{ maxLength: 300 }}
          sx={{ mb: 2 }}
        />

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
          Colour
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {COLOR_SWATCHES.map((c) => (
            <Box
              key={c}
              onClick={() => setColor(c)}
              sx={{
                width: 28, height: 28,
                borderRadius: '50%',
                bgcolor: c,
                cursor: 'pointer',
                border: color === c ? '3px solid' : '2px solid transparent',
                borderColor: color === c ? 'text.primary' : 'transparent',
                transition: 'transform 0.1s',
                '&:hover': { transform: 'scale(1.15)' },
              }}
            />
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => mutate()}
          disabled={!canSubmit}
          disableElevation
          startIcon={isPending ? <CircularProgress size={14} sx={{ color: 'white' }} /> : null}
          sx={{
            borderRadius: 2, px: 3,
            bgcolor: color,
            color: 'white',
            '&:hover': { bgcolor: color, filter: 'brightness(0.88)', color: 'white' },
            '&.Mui-disabled': { bgcolor: color, opacity: 0.45, color: 'white' },
          }}
        >
          {isPending ? 'Creating…' : 'Create Workspace'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
