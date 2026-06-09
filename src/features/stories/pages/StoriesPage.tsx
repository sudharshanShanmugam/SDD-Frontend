import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, IconButton, CircularProgress,
  Snackbar, Alert, Tooltip, InputAdornment, TextField, Stack,
} from '@mui/material';
import {
  Add, Close, AutoAwesome, DeleteSweep, CheckCircle,
  Refresh, Search, BookmarkBorder,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { storiesApi } from '@/api';
import StoryRow, { Story, StoryStatus, STATUS_CONFIG, PRIORITY_CONFIG } from '../components/StoryCard';
import { StoryDetailPanel } from '../components/StoryDetailPanel';
import StoryEditor from '../components/StoryEditor';

const ALL_STATUSES: StoryStatus[] = ['in_progress', 'review', 'ready', 'backlog', 'approved', 'done', 'rejected'];
const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

/* ── helpers ─────────────────────────────────────────────────────────────── */
function StatPill({ label, value, color }: { label: string; value: string | number; color?: string | undefined }) {
  return (
    <Box sx={{ textAlign: 'center', px: 2, py: 1 }}>
      <Typography variant="h6" fontWeight={800} sx={{ color: color ?? 'text.primary', lineHeight: 1.1 }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{label}</Typography>
    </Box>
  );
}

/* ── table header ────────────────────────────────────────────────────────── */
function TableHeader() {
  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: '4px 80px 1fr 100px 52px 32px 80px 32px',
      gap: 2, px: 2, py: 0.75,
      bgcolor: 'action.hover',
      borderBottom: '1px solid', borderColor: 'divider',
    }}>
      <Box />
      <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID</Typography>
      <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Story</Typography>
      <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</Typography>
      <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Pts</Typography>
      <Box />
      <Box />
      <Box />
    </Box>
  );
}

/* ── main page ───────────────────────────────────────────────────────────── */
const StoriesPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();

  const [search, setSearch]                     = useState('');
  const [activeStatus, setActiveStatus]         = useState<StoryStatus | 'all'>('all');
  const [activePriorities, setActivePriorities] = useState<string[]>([]);
  const [detailStoryId, setDetailStoryId]       = useState<string | null>(null);
  const [formOpen, setFormOpen]                 = useState(false);
  const [editStory, setEditStory]               = useState<Story | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [confirmAcceptOpen, setConfirmAcceptOpen] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  /* ── data ─────────────────────────────────────────────────────────────── */
  const { data, isLoading } = useQuery({
    queryKey: ['stories', projectId],
    queryFn: () => storiesApi.list(projectId!),
    enabled: !!projectId,
  });
  const stories: Story[] = (data?.data ?? []) as unknown as Story[];

  const { mutateAsync: createStory } = useMutation({
    mutationFn: (d: Partial<Story>) => storiesApi.create(projectId!, d as never),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stories', projectId] }),
  });
  const { mutate: patchStory } = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Story> }) => storiesApi.patch(id, updates as never),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stories', projectId] }),
  });
  const { mutate: deleteStory } = useMutation({
    mutationFn: (id: string) => storiesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stories', projectId] }),
  });
  const { mutate: generateStories, isPending: generating } = useMutation({
    mutationFn: () => storiesApi.generateFromRequirements(projectId!),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['stories', projectId] });
      setSnack({ open: true, severity: 'success', message: `Generated ${res?.count ?? 0} stories` });
    },
    onError: (err: any) => {
      queryClient.invalidateQueries({ queryKey: ['stories', projectId] });
      const isTimeout = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout');
      setSnack({ open: true, severity: 'error', message: isTimeout ? 'Timed out — refresh in a moment.' : err?.response?.data?.detail ?? 'Generation failed.' });
    },
  });
  const { mutate: clearAll, isPending: clearing } = useMutation({
    mutationFn: () => storiesApi.clearAll(projectId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories', projectId] });
      setConfirmClearOpen(false);
    },
  });

  const busy = generating || clearing;

  /* ── derived ──────────────────────────────────────────────────────────── */
  const countByStatus = useMemo(() => {
    const m: Partial<Record<StoryStatus, number>> = {};
    stories.forEach((s) => { m[s.status] = (m[s.status] ?? 0) + 1; });
    return m;
  }, [stories]);

  const filtered = useMemo(() => stories
    .filter((s) => {
      if (activeStatus !== 'all' && s.status !== activeStatus) return false;
      if (activePriorities.length && !activePriorities.includes(s.priority)) return false;
      if (search && !s.title.toLowerCase().includes(search.toLowerCase()) &&
          !s.storyId.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)),
  [stories, activeStatus, activePriorities, search]);

  const totalPts     = stories.reduce((a, s) => a + (s.points ?? 0), 0);
  const pendingCount = stories.filter((s) => s.status !== 'approved' && s.status !== 'rejected').length;
  const acceptedCount = stories.filter((s) => s.status === 'approved').length;

  const togglePriority = (p: string) =>
    setActivePriorities((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  if (isLoading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.default' }}>

      {/* ══ Header ══════════════════════════════════════════════════════════ */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>

        {/* Top bar */}
        <Stack direction="row" alignItems="center" sx={{ px: 3, py: 1.5, gap: 2 }}>
          {/* Icon + title */}
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Box sx={{
              width: 32, height: 32, borderRadius: 1.5,
              bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BookmarkBorder sx={{ fontSize: 17, color: '#fff' }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} letterSpacing="-0.3px" lineHeight={1.2}>
                User Stories
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {stories.length} stories · {totalPts} points
              </Typography>
            </Box>
          </Stack>

          {/* Stats */}
          <Stack direction="row" divider={<Box sx={{ width: 1, bgcolor: 'divider', alignSelf: 'stretch', my: 0.5 }} />}
            sx={{ ml: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <StatPill label="Total"    value={stories.length} />
            <StatPill label="Pending"  value={pendingCount}  color={pendingCount  > 0 ? '#f59e0b' : undefined} />
            <StatPill label="Accepted" value={acceptedCount} color={acceptedCount > 0 ? '#10b981' : undefined} />
            <StatPill label="Points"   value={totalPts} />
          </Stack>

          <Box sx={{ flex: 1 }} />

          {/* Actions */}
          <Stack direction="row" spacing={1}>
            {pendingCount > 0 && (
              <Button size="small" variant="outlined" startIcon={<CheckCircle sx={{ fontSize: 14 }} />}
                onClick={() => setConfirmAcceptOpen(true)}
                sx={{ textTransform: 'none', borderRadius: 2, fontSize: '0.78rem', height: 32,
                  color: '#10b981', borderColor: '#10b981', '&:hover': { bgcolor: '#f0fdf4' } }}>
                Accept All
              </Button>
            )}
            <Button size="small" variant="outlined" color="secondary"
              startIcon={busy
                ? <CircularProgress size={12} color="inherit" />
                : stories.length > 0 ? <Refresh sx={{ fontSize: 14 }} /> : <AutoAwesome sx={{ fontSize: 14 }} />}
              onClick={() => generateStories()} disabled={busy}
              sx={{ textTransform: 'none', borderRadius: 2, fontSize: '0.78rem', height: 32 }}>
              {generating ? 'Generating…' : stories.length > 0 ? 'Regenerate' : 'Generate'}
            </Button>
            {stories.length > 0 && (
              <Tooltip title="Delete all stories">
                <IconButton size="small" onClick={() => setConfirmClearOpen(true)} disabled={busy}
                  sx={{ color: 'error.main', border: '1px solid', borderColor: 'error.light', borderRadius: 1.5, width: 32, height: 32 }}>
                  <DeleteSweep sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            )}
            <Button size="small" variant="contained" startIcon={<Add sx={{ fontSize: 15 }} />}
              onClick={() => { setEditStory(null); setFormOpen(true); }}
              sx={{ textTransform: 'none', borderRadius: 2, fontSize: '0.78rem', fontWeight: 700, height: 32, px: 2 }}>
              New Story
            </Button>
          </Stack>
        </Stack>

        {/* Filter strip */}
        <Stack direction="row" alignItems="stretch" sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
          {/* Search */}
          <Box sx={{ px: 2, display: 'flex', alignItems: 'center', borderRight: '1px solid', borderColor: 'divider' }}>
            <TextField size="small" placeholder="Search…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{
                width: 180,
                '& .MuiOutlinedInput-root': { fontSize: '0.8rem', borderRadius: 1.5 },
                '& fieldset': { border: 'none' },
              }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 15, color: 'text.disabled' }} /></InputAdornment> } }}
            />
          </Box>

          {/* Status tabs */}
          <Stack direction="row" sx={{ flex: 1, overflowX: 'auto' }}>
            {/* All */}
            <Box onClick={() => setActiveStatus('all')}
              sx={{
                px: 2.5, display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                borderBottom: '2px solid', borderBottomColor: activeStatus === 'all' ? 'primary.main' : 'transparent',
                color: activeStatus === 'all' ? 'primary.main' : 'text.secondary',
                fontWeight: activeStatus === 'all' ? 700 : 500, fontSize: '0.8rem',
                whiteSpace: 'nowrap', transition: 'color 0.1s',
                '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
              }}>
              <Typography variant="body2" fontWeight="inherit" fontSize="inherit">All</Typography>
              <Box sx={{ px: 0.75, borderRadius: 10, bgcolor: activeStatus === 'all' ? 'primary.main' : 'action.selected', minWidth: 20, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: activeStatus === 'all' ? '#fff' : 'text.secondary', lineHeight: 1.6 }}>
                  {stories.length}
                </Typography>
              </Box>
            </Box>

            {ALL_STATUSES.map((st) => {
              const cfg   = STATUS_CONFIG[st];
              const count = countByStatus[st] ?? 0;
              const active = activeStatus === st;
              return (
                <Box key={st} onClick={() => setActiveStatus(active ? 'all' : st)}
                  sx={{
                    px: 2.5, display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                    borderBottom: '2px solid', borderBottomColor: active ? cfg.color : 'transparent',
                    color: active ? cfg.color : 'text.secondary',
                    fontWeight: active ? 700 : 500, fontSize: '0.8rem',
                    whiteSpace: 'nowrap', transition: 'color 0.1s',
                    '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
                    opacity: count === 0 ? 0.4 : 1,
                  }}>
                  <Typography variant="body2" fontWeight="inherit" fontSize="inherit">{cfg.label}</Typography>
                  {count > 0 && (
                    <Box sx={{ px: 0.75, borderRadius: 10, bgcolor: active ? cfg.color : 'action.selected', minWidth: 20, textAlign: 'center' }}>
                      <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: active ? '#fff' : 'text.secondary', lineHeight: 1.6 }}>
                        {count}
                      </Typography>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Stack>

          {/* Priority dots */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
            {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => {
              const active = activePriorities.includes(key);
              return (
                <Tooltip key={key} title={cfg.label}>
                  <Box onClick={() => togglePriority(key)} sx={{
                    width: 10, height: 10, borderRadius: '50%', cursor: 'pointer',
                    bgcolor: cfg.color, opacity: active ? 1 : 0.2,
                    outline: active ? `2px solid ${cfg.color}` : 'none', outlineOffset: 2,
                    transform: active ? 'scale(1.3)' : 'scale(1)', transition: 'all 0.15s',
                    '&:hover': { opacity: 0.75, transform: 'scale(1.2)' },
                  }} />
                </Tooltip>
              );
            })}
            {(search || activePriorities.length > 0) && (
              <Tooltip title="Clear filters">
                <IconButton size="small" onClick={() => { setSearch(''); setActivePriorities([]); }}
                  sx={{ p: 0.3, color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                  <Close sx={{ fontSize: 13 }} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* ── Generating banner ─────────────────────────────────────────────── */}
      {busy && (
        <Stack direction="row" spacing={1.5} alignItems="center"
          sx={{ mx: 3, mt: 1.5, px: 2.5, py: 1.25, bgcolor: 'secondary.main', color: '#fff', borderRadius: 2, flexShrink: 0 }}>
          <CircularProgress size={15} color="inherit" thickness={4} />
          <Typography variant="body2" fontWeight={600} fontSize="0.82rem">
            {clearing ? 'Deleting stories…' : 'AI is generating user stories from your requirements…'}
          </Typography>
        </Stack>
      )}

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2 }}>

        {/* Empty — no stories */}
        {stories.length === 0 && !busy && (
          <Box sx={{
            height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 2,
          }}>
            <Box sx={{ width: 64, height: 64, borderRadius: 3, bgcolor: 'primary.main', opacity: 0.08 }} />
            <BookmarkBorder sx={{ fontSize: 36, color: 'primary.main', mt: -9 }} />
            <Box>
              <Typography variant="h6" fontWeight={800}>No user stories yet</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 380, mx: 'auto' }}>
                Generate from requirements with AI or add them manually.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5} mt={1}>
              <Button variant="contained" color="secondary" startIcon={<AutoAwesome />}
                onClick={() => generateStories()}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
                Generate from Requirements
              </Button>
              <Button variant="outlined" startIcon={<Add />}
                onClick={() => { setEditStory(null); setFormOpen(true); }}
                sx={{ borderRadius: 2, textTransform: 'none' }}>
                Add Manually
              </Button>
            </Stack>
          </Box>
        )}

        {/* No filter results */}
        {stories.length > 0 && filtered.length === 0 && !busy && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary">No stories match your filters.</Typography>
            <Button size="small" onClick={() => { setSearch(''); setActiveStatus('all'); setActivePriorities([]); }}
              sx={{ mt: 1, textTransform: 'none' }}>Reset filters</Button>
          </Box>
        )}

        {/* Table */}
        {filtered.length > 0 && (
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper' }}>
            <TableHeader />
            {filtered.map((story) => (
              <StoryRow
                key={story.id}
                story={story}
                onView={(s) => setDetailStoryId(s.id)}
                onEdit={(s) => { setEditStory(s); setFormOpen(true); }}
                onDelete={(id) => deleteStory(id)}
                onStatusChange={(id, st) => patchStory({ id, updates: { status: st } })}
              />
            ))}
            {/* Footer */}
            <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover', borderTop: '1px solid', borderColor: 'divider',
              display: 'grid', gridTemplateColumns: '4px 80px 1fr 100px 52px 32px 80px 32px', gap: 2, alignItems: 'center' }}>
              <Box /><Box />
              <Typography variant="caption" color="text.disabled">{filtered.length} {filtered.length === 1 ? 'story' : 'stories'}</Typography>
              <Box />
              <Typography variant="caption" fontWeight={700} color="text.secondary" textAlign="center">
                {filtered.reduce((a, s) => a + (s.points ?? 0), 0)}p
              </Typography>
              <Box /><Box /><Box />
            </Box>
          </Box>
        )}
      </Box>

      {/* ── Detail panel ─────────────────────────────────────────────────── */}
      <StoryDetailPanel storyId={detailStoryId} onClose={() => setDetailStoryId(null)} />

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editStory ? `Edit ${editStory.storyId}` : 'New Story'}
          <IconButton size="small" onClick={() => setFormOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          <StoryEditor
            story={editStory}
            onSave={async (d) => {
              if (editStory) patchStory({ id: editStory.id, updates: d });
              else await createStory(d);
              setFormOpen(false);
            }}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={confirmClearOpen} onClose={() => setConfirmClearOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Delete all stories?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Permanently deletes all <strong>{stories.length} stories</strong>. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmClearOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button onClick={() => clearAll()} variant="contained" color="error"
            startIcon={clearing ? <CircularProgress size={13} color="inherit" /> : <DeleteSweep />}
            disabled={clearing} sx={{ textTransform: 'none' }}>
            Delete All
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmAcceptOpen} onClose={() => setConfirmAcceptOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Accept all pending stories?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Marks <strong>{pendingCount} stories</strong> as accepted. Accepted stories can be added to sprints.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmAcceptOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button onClick={async () => {
            const ids = stories.filter((s) => s.status !== 'approved' && s.status !== 'rejected').map((s) => s.id);
            await storiesApi.bulkUpdateStatus(ids, 'approved');
            queryClient.invalidateQueries({ queryKey: ['stories', projectId] });
            setConfirmAcceptOpen(false);
          }} variant="contained" startIcon={<CheckCircle />}
            sx={{ textTransform: 'none', bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}>
            Accept All
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={7000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{ borderRadius: 2, boxShadow: 4 }}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default StoriesPage;
