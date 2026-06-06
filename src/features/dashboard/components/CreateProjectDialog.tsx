import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  Close as CloseIcon,
  FolderOpen,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi, workspacesApi } from '@/api';
import { useWorkspaceStore } from '@store/workspaceStore';
import { useAuthStore } from '@store/authStore';

// ─────────────────────────────────────────────────────────────
const COLOR_OPTIONS = [
  { value: '#6366f1', label: 'Indigo'  },
  { value: '#3b82f6', label: 'Blue'    },
  { value: '#10b981', label: 'Emerald' },
  { value: '#f59e0b', label: 'Amber'   },
  { value: '#ef4444', label: 'Red'     },
  { value: '#8b5cf6', label: 'Violet'  },
  { value: '#ec4899', label: 'Pink'    },
  { value: '#14b8a6', label: 'Teal'    },
];

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateProjectDialog({ open, onClose }: CreateProjectDialogProps) {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const currentWorkspace    = useWorkspaceStore((s) => s.currentWorkspace);
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace);
  const orgId = (useAuthStore((s) => s.organization?.id ?? '') || '00000000-0000-0000-0000-000000000020');

  // ── Workspace state ───────────────────────────────────────
  const [selectedWsId, setSelectedWsId]         = useState(currentWorkspace?.id ?? '');
  const [showCreateWs, setShowCreateWs]          = useState(false);
  const [newWsName,    setNewWsName]             = useState('');

  useEffect(() => {
    if (currentWorkspace?.id && !selectedWsId) setSelectedWsId(currentWorkspace.id);
  }, [currentWorkspace?.id, selectedWsId]);

  // Always fetch workspaces when dialog opens (no-op if cached)
  const { data: wsPage, isLoading: wsLoading } = useQuery({
    queryKey: ['workspaces', orgId],
    queryFn: () => workspacesApi.list(orgId),
    enabled: !!orgId && open,
    staleTime: 5 * 60 * 1000,
  });
  const workspaces: any[] = (wsPage as any)?.data ?? (wsPage as any)?.items ?? [];

  // Auto-select: use first workspace if none selected in store
  useEffect(() => {
    if (!selectedWsId && workspaces.length > 0) {
      // prefer default workspace, fall back to first
      const def = workspaces.find((w) => w.is_default) ?? workspaces[0];
      if (def) { setSelectedWsId(def.id); setCurrentWorkspace(def as any); }
    }
  }, [workspaces, selectedWsId, setCurrentWorkspace]);

  const { mutate: createWs, isPending: wsCreating, error: wsError, reset: resetWs } = useMutation({
    mutationFn: () => workspacesApi.create(orgId, { name: newWsName.trim(), color: selectedColor }),
    onSuccess: (ws) => {
      setCurrentWorkspace(ws as any);
      setSelectedWsId(ws.id);
      setShowCreateWs(false);
      setNewWsName('');
      resetWs();
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  // ── Project form ──────────────────────────────────────────
  const [name,         setName]        = useState('');
  const [key,          setKey]         = useState('');
  const [desc,         setDesc]        = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]!.value);
  const [keyTouched,   setKeyTouched]  = useState(false);

  useEffect(() => {
    if (!keyTouched && name) {
      const words = name.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
      const derived =
        words.length >= 2
          ? words.map((w) => w[0]!.toUpperCase()).join('').slice(0, 6)
          : name.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
      setKey(derived || '');
    }
  }, [name, keyTouched]);

  const { mutate, isPending, error, reset: resetProject } = useMutation({
    mutationFn: () =>
      projectsApi.create(selectedWsId, {
        name: name.trim(),
        key:  key.trim().toUpperCase(),
        ...(desc.trim() ? { description: desc.trim() } : {}),
      }),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      handleClose();
      navigate(`/projects/${project.id}`);
    },
  });

  const handleClose = () => {
    setName(''); setKey(''); setDesc('');
    setSelectedColor(COLOR_OPTIONS[0]!.value);
    setKeyTouched(false);
    setShowCreateWs(false);
    setNewWsName('');
    setSelectedWsId(currentWorkspace?.id ?? '');
    resetProject(); resetWs();
    onClose();
  };

  const canSubmit = name.trim().length > 0 && key.trim().length >= 2 && !!selectedWsId && !showCreateWs;

  // ─────────────────────────────────────────────────────────
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      {/* ══ Coloured banner ══════════════════════════════════ */}
      <Box
        sx={{
          bgcolor: selectedColor,
          px: 3,
          pt: 3,
          pb: 2.5,
          position: 'relative',
        }}
      >
        {/* Close */}
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            position: 'absolute', top: 12, right: 12,
            color: 'rgba(255,255,255,0.75)',
            '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.15)' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        {/* Icon + label row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Box
            sx={{
              width: 40, height: 40, borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <FolderOpen sx={{ color: 'white', fontSize: 22 }} />
          </Box>
          <Typography
            variant="overline"
            sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700, letterSpacing: '0.1em' }}
          >
            New Project
          </Typography>
        </Box>

        {/* Live project name preview */}
        <Typography
          variant="h5"
          fontWeight={800}
          sx={{ color: 'white', lineHeight: 1.2, minHeight: 32, mb: 1.5, pr: 4 }}
        >
          {name || <span style={{ opacity: 0.4, fontWeight: 400 }}>Untitled Project</span>}
        </Typography>

        {/* Key chip + colour swatches in one row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {key && (
            <Chip
              label={key.toUpperCase()}
              size="small"
              sx={{
                height: 22, fontSize: '0.7rem', fontWeight: 800,
                letterSpacing: '0.08em', fontFamily: 'monospace',
                bgcolor: 'rgba(255,255,255,0.22)', color: 'white',
              }}
            />
          )}

          {/* Colour dots */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, ml: key ? 0.5 : 0 }}>
            {COLOR_OPTIONS.map(({ value, label }) => (
              <Tooltip key={value} title={label} placement="top" arrow>
                <Box
                  onClick={() => setSelectedColor(value)}
                  sx={{
                    width: 18, height: 18, borderRadius: '50%', cursor: 'pointer',
                    bgcolor: value,
                    outline: value === selectedColor ? '2.5px solid white' : '2px solid rgba(255,255,255,0.3)',
                    outlineOffset: value === selectedColor ? '2px' : '0px',
                    transition: 'transform 0.12s, outline 0.12s',
                    '&:hover': { transform: 'scale(1.25)' },
                    boxShadow: value === selectedColor ? '0 0 0 1px rgba(0,0,0,0.15)' : 'none',
                  }}
                />
              </Tooltip>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ══ Form body ════════════════════════════════════════ */}
      <DialogContent sx={{ px: 3, pt: 2.5, pb: 0 }}>

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => resetProject()}>
            {(error as any)?.response?.data?.detail ?? (error as Error).message ?? 'Failed to create project'}
          </Alert>
        )}

        {/* ── Workspace selector — always visible ────────── */}
        <Box sx={{ mb: 2.5 }}>
          {wsLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
              <CircularProgress size={14} />
              <Typography variant="body2" color="text.secondary">Loading workspaces…</Typography>
            </Box>
          ) : showCreateWs ? (
            /* ── Inline create workspace ── */
            <Box>
              {wsError && (
                <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => resetWs()}>
                  {(wsError as Error).message ?? 'Failed to create workspace'}
                </Alert>
              )}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  label="New workspace name"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  size="small"
                  fullWidth
                  autoFocus
                  inputProps={{ maxLength: 80 }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && newWsName.trim()) createWs(); }}
                />
                <Button
                  variant="outlined"
                  onClick={() => createWs()}
                  disabled={!newWsName.trim() || wsCreating}
                  disableElevation
                  sx={{ height: 40, whiteSpace: 'nowrap', minWidth: 90, flexShrink: 0, bgcolor: 'white' }}
                >
                  {wsCreating ? <CircularProgress size={14} /> : 'Create'}
                </Button>
              </Box>
              {workspaces.length > 0 && (
                <Button
                  size="small"
                  sx={{ mt: 0.75, color: 'text.secondary', fontSize: '0.78rem' }}
                  onClick={() => { setShowCreateWs(false); setNewWsName(''); resetWs(); }}
                >
                  ← Back to list
                </Button>
              )}
            </Box>
          ) : workspaces.length > 0 ? (
            /* ── Dropdown — always shown ── */
            <TextField
              select
              label="Workspace"
              value={selectedWsId}
              onChange={(e) => {
                setSelectedWsId(e.target.value);
                const ws = workspaces.find((w) => w.id === e.target.value);
                if (ws) setCurrentWorkspace(ws as any);
              }}
              fullWidth
              size="small"
              SelectProps={{ IconComponent: KeyboardArrowDown }}
            >
              {workspaces.map((ws) => (
                <MenuItem key={ws.id} value={ws.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ws.color ?? '#6366f1', flexShrink: 0 }} />
                    {ws.name}
                  </Box>
                </MenuItem>
              ))}
              <MenuItem
                value="__new__"
                onClick={(e) => { e.stopPropagation(); setShowCreateWs(true); setSelectedWsId(''); }}
                sx={{ color: 'primary.main', fontWeight: 600 }}
              >
                <AddIcon fontSize="small" sx={{ mr: 0.75 }} /> New workspace
              </MenuItem>
            </TextField>
          ) : (
            /* ── No workspaces at all ── */
            <Box>
              {wsError && (
                <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => resetWs()}>
                  {(wsError as Error).message ?? 'Failed to create workspace'}
                </Alert>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
                You need a workspace first.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  label="Workspace name"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  size="small"
                  fullWidth
                  autoFocus
                  inputProps={{ maxLength: 80 }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && newWsName.trim()) createWs(); }}
                />
                <Button
                  variant="outlined"
                  onClick={() => createWs()}
                  disabled={!newWsName.trim() || wsCreating}
                  disableElevation
                  sx={{ height: 40, whiteSpace: 'nowrap', minWidth: 90, flexShrink: 0, bgcolor: 'white' }}
                >
                  {wsCreating ? <CircularProgress size={14} /> : 'Create'}
                </Button>
              </Box>
            </Box>
          )}
        </Box>

        {/* ── Project fields ─────────────────────────────── */}
        <Collapse in={!!selectedWsId}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pb: 2.5 }}>
            {/* Name + Key */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <TextField
                label="Project Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus={!!selectedWsId || !!currentWorkspace?.id}
                inputProps={{ maxLength: 80 }}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Key"
                value={key}
                onChange={(e) => { setKey(e.target.value.toUpperCase()); setKeyTouched(true); }}
                required
                inputProps={{
                  maxLength: 6,
                  style: { fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' },
                }}
                helperText="2–6 chars"
                sx={{ width: 104 }}
              />
            </Box>

            {/* Description */}
            <TextField
              label="Description"
              placeholder="What is this project about? (optional)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              multiline
              rows={2}
              inputProps={{ maxLength: 300 }}
            />
          </Box>
        </Collapse>
      </DialogContent>

      {/* ══ Actions ══════════════════════════════════════════ */}
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
        <Button onClick={handleClose} disabled={isPending} color="inherit" sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => mutate()}
          disabled={!canSubmit || isPending}
          disableElevation
          sx={{
            borderRadius: 2, px: 3, minWidth: 140,
            bgcolor: selectedColor,
            color: 'white',
            '&:hover': { bgcolor: selectedColor, filter: 'brightness(0.88)', color: 'white' },
            '&.Mui-disabled': { bgcolor: selectedColor, opacity: 0.45, color: 'white' },
          }}
          startIcon={isPending ? <CircularProgress size={15} sx={{ color: 'inherit' }} /> : null}
        >
          {isPending ? 'Creating…' : 'Create Project'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
