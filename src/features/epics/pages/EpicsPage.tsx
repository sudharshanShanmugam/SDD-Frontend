import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Drawer,
  IconButton,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Add,
  Close,
  ViewKanban,
  ViewList,
  AutoAwesome,
  DeleteSweep,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { epicsApi } from '@/api';
import EpicKanban from '../components/EpicKanban';
import EpicList from '../components/EpicList';
import EpicForm from '../components/EpicForm';
import EpicDetail from '../components/EpicDetail';
import type { Epic, EpicStatus } from '../components/EpicCard';

const EpicsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedEpic, setSelectedEpic] = useState<Epic | null>(null);
  const [initialStatus, setInitialStatus] = useState<EpicStatus>('backlog');
  const [detailEpic, setDetailEpic] = useState<Epic | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // Fetch epics to know if any exist (for empty-state UI)
  const { data: epicsData } = useQuery({
    queryKey: ['epics', projectId],
    queryFn: () => epicsApi.list(projectId!),
    enabled: !!projectId,
  });
  const epicCount = (epicsData?.data ?? []).length;

  const { mutateAsync: createEpic } = useMutation({
    mutationFn: (data: Partial<Epic>) => epicsApi.create(projectId!, data as Parameters<typeof epicsApi.create>[1]),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['epics', projectId] }),
  });

  const { mutateAsync: updateEpic } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Epic> }) =>
      epicsApi.update(id, data as Parameters<typeof epicsApi.update>[1]),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['epics', projectId] }),
  });

  const { mutate: generateEpics, isPending: generating } = useMutation({
    mutationFn: () => epicsApi.generateFromRequirements(projectId!),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['epics', projectId] });
      const d = res?.data ?? res;
      const count = d?.count ?? 0;
      const reqs  = d?.requirements_used ?? '?';
      const chunks = d?.chunks_processed ?? '?';
      setSnack({
        open: true,
        message: `✅ Generated ${count} epics from ${reqs} requirements (${chunks} passes)`,
        severity: 'success',
      });
    },
    onError: (err: any) => {
      // Invalidate so the query re-fetches — epics may have been created despite the error
      queryClient.invalidateQueries({ queryKey: ['epics', projectId] });
      const isTimeout = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout');
      const detail = isTimeout
        ? 'Request timed out — but epics may still be generating. Refresh in a moment.'
        : (err?.response?.data?.detail ?? 'Generation failed. Please try again.');
      setSnack({ open: true, message: `⚠️ ${detail}`, severity: 'error' });
    },
  });

  const { mutate: clearAndRegenerate, isPending: clearing } = useMutation({
    mutationFn: async () => {
      // Step 1: clear all epics
      await epicsApi.clearAll(projectId!);
      // Step 2: regenerate
      return epicsApi.generateFromRequirements(projectId!);
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['epics', projectId] });
      const d = (res as any)?.data ?? res;
      const count = d?.count ?? 0;
      const reqs  = d?.requirements_used ?? '?';
      setSnack({
        open: true,
        message: `✅ Cleared old epics and generated ${count} new epics from ${reqs} requirements`,
        severity: 'success',
      });
    },
    onError: (err: any) => {
      queryClient.invalidateQueries({ queryKey: ['epics', projectId] });
      const isTimeout = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout');
      const detail = isTimeout
        ? 'Request timed out — but epics may still be generating. Refresh in a moment.'
        : (err?.response?.data?.detail ?? 'Regeneration failed. Please try again.');
      setSnack({ open: true, message: `⚠️ ${detail}`, severity: 'error' });
    },
  });

  const handleSave = async (data: Partial<Epic>) => {
    if (selectedEpic) {
      await updateEpic({ id: selectedEpic.id, data });
    } else {
      await createEpic(data);
    }
    setFormOpen(false);
  };

  const handleViewEpic = (epic: Epic) => {
    setDetailEpic(epic);
    setDrawerOpen(true);
  };

  const handleEditEpic = (epic: Epic) => {
    setSelectedEpic(epic);
    setInitialStatus(epic.status);
    setFormOpen(true);
  };

  const handleAddEpic = (status: EpicStatus) => {
    setSelectedEpic(null);
    setInitialStatus(status);
    setFormOpen(true);
  };

  const busy = generating || clearing;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
            <Typography variant="h4" fontWeight={700}>
              Epics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Feature groups that organize your requirements into deliverable chunks
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant={view === 'kanban' ? 'contained' : 'outlined'}
              size="small"
              startIcon={<ViewKanban />}
              onClick={() => setView('kanban')}
              sx={{ borderRadius: 2 }}
            >
              Kanban
            </Button>
            <Button
              variant={view === 'list' ? 'contained' : 'outlined'}
              size="small"
              startIcon={<ViewList />}
              onClick={() => setView('list')}
              sx={{ borderRadius: 2 }}
            >
              List
            </Button>

            {/* AI Generate — shown only when NO epics exist */}
            {epicCount === 0 && (
              <Tooltip title="Use AI to automatically group your requirements into epics">
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <AutoAwesome />}
                  onClick={() => generateEpics()}
                  disabled={busy}
                  sx={{ borderRadius: 2, borderColor: 'secondary.main' }}
                >
                  {generating ? 'Generating…' : 'Generate from Requirements'}
                </Button>
              </Tooltip>
            )}

            {/* Regenerate — shown when epics already exist (clears first, then generates) */}
            {epicCount > 0 && (
              <Tooltip title="Clear all existing epics and regenerate a fresh set from requirements">
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <AutoAwesome />}
                  onClick={() => setConfirmClearOpen(true)}
                  disabled={busy}
                  sx={{ borderRadius: 2, borderColor: 'secondary.main' }}
                >
                  {clearing ? 'Regenerating…' : 'Regenerate Epics'}
                </Button>
              </Tooltip>
            )}

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleAddEpic('backlog')}
              sx={{ borderRadius: 2 }}
            >
              New Epic
            </Button>
          </Box>
        </Box>
      </motion.div>

      {/* Empty state — shown only when no epics and not loading */}
      {epicCount === 0 && !busy && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              px: 4,
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 3,
              mb: 3,
              bgcolor: 'background.paper',
            }}
          >
            <AutoAwesome sx={{ fontSize: 56, color: 'secondary.main', mb: 2, opacity: 0.7 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              No epics yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 480, mx: 'auto' }}>
              Epics group your requirements into feature areas. You can let AI automatically
              create epics from your requirements, or add them manually.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <AutoAwesome />}
                onClick={() => generateEpics()}
                disabled={busy}
                sx={{ borderRadius: 2, px: 4 }}
              >
                {generating ? 'Generating Epics…' : 'Generate Epics from Requirements'}
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<Add />}
                onClick={() => handleAddEpic('backlog')}
                sx={{ borderRadius: 2 }}
              >
                Create Manually
              </Button>
            </Box>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2 }}>
              Make sure you have requirements extracted before auto-generating epics
            </Typography>
          </Box>
        </motion.div>
      )}

      {/* Generating / clearing banner */}
      {busy && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 2, bgcolor: 'secondary.main', color: 'white', borderRadius: 2 }}>
          <CircularProgress size={20} color="inherit" />
          <Typography variant="body2" fontWeight={600}>
            {clearing
              ? 'Clearing old epics and regenerating from requirements…'
              : 'AI is analyzing your requirements and grouping them into epics…'}
          </Typography>
        </Box>
      )}

      {/* Kanban / List view */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {view === 'kanban' ? (
          <EpicKanban
            onEpicEdit={handleEditEpic}
            onEpicView={handleViewEpic}
            onAddEpic={handleAddEpic}
          />
        ) : (
          <EpicList
            onEpicEdit={handleEditEpic}
            onEpicView={handleViewEpic}
          />
        )}
      </Box>

      {/* Epic Form Dialog */}
      <EpicForm
        open={formOpen}
        onClose={() => { setFormOpen(false); }}
        onSave={handleSave}
        epic={selectedEpic}
        initialStatus={initialStatus}
      />

      {/* Epic Detail Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 520 } } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <Close />
          </IconButton>
        </Box>
        {detailEpic && (
          <EpicDetail
            epic={detailEpic}
            onEdit={() => {
              setSelectedEpic(detailEpic);
              setFormOpen(true);
              setDrawerOpen(false);
            }}
          />
        )}
      </Drawer>

      {/* Confirm Clear & Regenerate dialog */}
      <Dialog open={confirmClearOpen} onClose={() => setConfirmClearOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteSweep color="error" />
          Clear & Regenerate Epics?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will <strong>permanently delete all {epicCount} existing epic{epicCount !== 1 ? 's' : ''}</strong> for this
            project and generate a fresh set using AI from your requirements.
            <br /><br />
            This is recommended when the existing epics are outdated or were generated from
            incomplete requirements.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setConfirmClearOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            onClick={() => { setConfirmClearOpen(false); clearAndRegenerate(); }}
            variant="contained"
            color="error"
            startIcon={<AutoAwesome />}
            sx={{ borderRadius: 2 }}
          >
            Yes, Clear & Regenerate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast notifications */}
      <Snackbar
        open={snack.open}
        autoHideDuration={8000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{ borderRadius: 2 }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EpicsPage;
