import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  Add,
  Close,
  AutoAwesome,
  DeleteSweep,
  ExpandMore,
  ExpandLess,
  CheckCircle,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { storiesApi } from '@/api';
import StoryCard, { Story } from '../components/StoryCard';
import StoryFilters, { StoryFilterState } from '../components/StoryFilters';
import { StoryDetailPanel } from '../components/StoryDetailPanel';
import StoryEditor from '../components/StoryEditor';

const initialFilters: StoryFilterState = {
  search: '',
  statuses: [],
  priorities: [],
};

/* ── Epic group section ────────────────────────────────────────────────────── */
interface EpicGroupProps {
  epicId: string;
  topic: string;
  stories: Story[];
  onView: (s: Story) => void;
  onEdit: (s: Story) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: any) => void;
}

const EpicGroup: React.FC<EpicGroupProps> = ({ epicId, topic, stories, onView, onEdit, onDelete, onStatusChange }) => {
  const [open, setOpen] = useState(true);

  return (
    <Box sx={{ mb: 2 }}>
      {/* Group header */}
      <Box
        onClick={() => setOpen(!open)}
        sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          px: 2, py: 1.25, borderRadius: 2, cursor: 'pointer',
          bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider',
          mb: open ? 1.5 : 0,
          '&:hover': { bgcolor: 'action.selected' },
          transition: 'background-color 0.15s',
        }}
      >
        <IconButton size="small" sx={{ p: 0 }}>
          {open ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
        </IconButton>
        <Box
          sx={{
            px: 0.9, py: 0.2, borderRadius: 1,
            bgcolor: '#6366f1', color: 'white',
            fontSize: '0.65rem', fontWeight: 800, fontFamily: 'monospace',
            flexShrink: 0,
          }}
        >
          {epicId}
        </Box>
        <Typography variant="body2" fontWeight={700} sx={{ flex: 1 }}>
          {topic}
        </Typography>
        <Chip
          label={`${stories.length} stor${stories.length === 1 ? 'y' : 'ies'}`}
          size="small"
          sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#6366f1' + '1a', color: '#6366f1' }}
        />
        <Typography variant="caption" color="text.secondary">
          {stories.reduce((a, s) => a + (s.points || 0), 0)} pts total
        </Typography>
      </Box>

      <Collapse in={open}>
        <Grid container spacing={2} sx={{ pl: 1 }}>
          {stories.map((story, index) => (
            <Grid item xs={12} sm={6} lg={4} key={story.id}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <StoryCard
                  story={story}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onStatusChange={onStatusChange}
                />
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Collapse>
    </Box>
  );
};

/* ── Main page ─────────────────────────────────────────────────────────────── */
const StoriesPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<StoryFilterState>(initialFilters);
  const [detailStoryId, setDetailStoryId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editStory, setEditStory] = useState<Story | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // ── Fetch stories ────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['stories', projectId],
    queryFn: () => storiesApi.list(projectId!),
    enabled: !!projectId,
  });
  const stories: Story[] = (data?.data ?? []) as unknown as Story[];
  const storyCount = stories.length;

  // ── Mutations ────────────────────────────────────────────────────────────────
  const { mutateAsync: createStory } = useMutation({
    mutationFn: (storyData: Partial<Story>) => storiesApi.create(projectId!, storyData as never),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stories', projectId] }),
  });

  const { mutate: patchStory } = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Story> }) =>
      storiesApi.patch(id, updates as never),
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
      const count = res?.count ?? 0;
      const reqs  = res?.requirements_used ?? '?';
      setSnack({
        open: true,
        message: `✅ Generated ${count} user stories from ${reqs} requirements`,
        severity: 'success',
      });
    },
    onError: (err: any) => {
      queryClient.invalidateQueries({ queryKey: ['stories', projectId] });
      const isTimeout = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout');
      const detail = isTimeout
        ? 'Request timed out — stories may still be generating. Refresh in a moment.'
        : (err?.response?.data?.detail ?? 'Generation failed. Please try again.');
      setSnack({ open: true, message: `⚠️ ${detail}`, severity: 'error' });
    },
  });

  const { mutate: clearAndRegenerate, isPending: clearing } = useMutation({
    mutationFn: async () => {
      await storiesApi.clearAll(projectId!);
      return storiesApi.generateFromRequirements(projectId!);
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['stories', projectId] });
      const count = res?.count ?? 0;
      const reqs  = res?.requirements_used ?? '?';
      setSnack({
        open: true,
        message: `✅ Cleared old stories and generated ${count} new user stories from ${reqs} requirements`,
        severity: 'success',
      });
    },
    onError: (err: any) => {
      queryClient.invalidateQueries({ queryKey: ['stories', projectId] });
      const isTimeout = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout');
      const detail = isTimeout
        ? 'Request timed out — stories may still be generating. Refresh in a moment.'
        : (err?.response?.data?.detail ?? 'Regeneration failed. Please try again.');
      setSnack({ open: true, message: `⚠️ ${detail}`, severity: 'error' });
    },
  });

  const busy = generating || clearing;

  // ── Filtering ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return stories.filter((s) => {
      if (filters.search && !s.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.statuses.length && !filters.statuses.includes(s.status)) return false;
      if (filters.priorities.length && !filters.priorities.includes(s.priority)) return false;
      return true;
    });
  }, [stories, filters]);

  // ── Epic grouping ─────────────────────────────────────────────────────────────
  const { epicGroups, ungrouped } = useMemo(() => {
    const groups = new Map<string, { topic: string; stories: Story[] }>();
    const plain: Story[] = [];

    for (const s of filtered) {
      const epicMatch = s.storyId?.match(/^(E\d+)-/);
      if (epicMatch) {
        const epicId: string = epicMatch[1] ?? '';
        if (!epicId) { plain.push(s); continue; }
        const topicTag = (s.tags ?? []).find((t: string) => t.startsWith('epic-topic:'));
        const topic: string = topicTag ? topicTag.slice(11) : epicId;
        if (!groups.has(epicId)) groups.set(epicId, { topic, stories: [] });
        groups.get(epicId)!.stories.push(s);
      } else {
        plain.push(s);
      }
    }

    // Sort epic IDs numerically: E1, E2, E3...
    const sorted = new Map(
      [...groups.entries()].sort((a, b) => {
        const na = parseInt(a[0].slice(1), 10);
        const nb = parseInt(b[0].slice(1), 10);
        return na - nb;
      })
    );

    return { epicGroups: sorted, ungrouped: plain };
  }, [filtered]);

  const hasEpics = epicGroups.size > 0;
  const totalPoints = filtered.reduce((a, s) => a + (s.points || 0), 0);

  const handleUpdate = async (id: string, updates: Partial<Story>) => {
    patchStory({ id, updates });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

      {/* Left: Filters panel */}
      <Box sx={{
        width: 240, flexShrink: 0, borderRight: '1px solid',
        borderColor: 'divider', p: 2, overflowY: 'auto',
      }}>
        <StoryFilters
          filters={filters}
          onChange={setFilters}
          totalCount={stories.length}
          filteredCount={filtered.length}
        />
      </Box>

      {/* Right: Main content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <Box sx={{
          p: 2, borderBottom: '1px solid', borderColor: 'divider',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: 1,
        }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>User Stories</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Chip label={`${filtered.length} stories`} size="small" />
              {hasEpics && (
                <Chip label={`${epicGroups.size} epic${epicGroups.size !== 1 ? 's' : ''}`} size="small" color="secondary" />
              )}
              {totalPoints > 0 && (
                <Chip label={`${totalPoints} total points`} size="small" color="primary" />
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {storyCount === 0 && (
              <Tooltip title="Use AI to automatically generate user stories from your requirements">
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <AutoAwesome />}
                  onClick={() => generateStories()}
                  disabled={busy}
                  sx={{ borderRadius: 2, borderColor: 'secondary.main' }}
                >
                  {generating ? 'Generating…' : 'Generate from Requirements'}
                </Button>
              </Tooltip>
            )}

            {storyCount > 0 && (
              <Tooltip title="Clear all existing stories and regenerate a fresh set from requirements">
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <AutoAwesome />}
                  onClick={() => setConfirmClearOpen(true)}
                  disabled={busy}
                  sx={{ borderRadius: 2, borderColor: 'secondary.main' }}
                >
                  {clearing ? 'Regenerating…' : 'Regenerate Stories'}
                </Button>
              </Tooltip>
            )}

            {filtered.some(s => s.status !== 'approved' && s.status !== 'rejected') && (
              <Tooltip title="Mark all visible stories as accepted">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CheckCircle />}
                  onClick={() => filtered
                    .filter(s => s.status !== 'approved' && s.status !== 'rejected')
                    .forEach(s => handleUpdate(s.id, { status: 'approved' }))
                  }
                  sx={{ borderRadius: 2, color: '#10b981', borderColor: '#10b981',
                    '&:hover': { bgcolor: '#f0fdf4', borderColor: '#10b981' } }}
                >
                  Accept All
                </Button>
              </Tooltip>
            )}

            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={() => { setEditStory(null); setFormOpen(true); }}
              sx={{ borderRadius: 2 }}
            >
              New Story
            </Button>
          </Box>
        </Box>

        {/* Generating / clearing banner */}
        {busy && (
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 2, mx: 2, mt: 2, p: 2,
            bgcolor: 'secondary.main', color: 'white', borderRadius: 2,
          }}>
            <CircularProgress size={20} color="inherit" />
            <Typography variant="body2" fontWeight={600}>
              {clearing
                ? 'Clearing old stories and regenerating from requirements…'
                : 'AI is analysing your requirements and writing user stories…'}
            </Typography>
          </Box>
        )}

        {/* Empty state */}
        {storyCount === 0 && !busy && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Box sx={{
              textAlign: 'center', py: 8, px: 4,
              border: '2px dashed', borderColor: 'divider',
              borderRadius: 3, m: 3, bgcolor: 'background.paper',
            }}>
              <AutoAwesome sx={{ fontSize: 56, color: 'secondary.main', mb: 2, opacity: 0.7 }} />
              <Typography variant="h5" fontWeight={700} gutterBottom>
                No user stories yet
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 480, mx: 'auto' }}>
                User stories describe features from a user's perspective. Let AI automatically
                generate them from your requirements, or add them manually.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <AutoAwesome />}
                  onClick={() => generateStories()}
                  disabled={busy}
                  sx={{ borderRadius: 2, px: 4 }}
                >
                  {generating ? 'Generating Stories…' : 'Generate Stories from Requirements'}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Add />}
                  onClick={() => { setEditStory(null); setFormOpen(true); }}
                  sx={{ borderRadius: 2 }}
                >
                  Create Manually
                </Button>
              </Box>
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2 }}>
                Tip: Group your requirements by topic first for epic-organised stories (E1-US1, E1-US2…)
              </Typography>
            </Box>
          </motion.div>
        )}

        {/* Story grid — grouped or flat */}
        {filtered.length > 0 && (
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
            {hasEpics ? (
              <>
                {/* Epic-grouped stories */}
                {[...epicGroups.entries()].map(([epicId, { topic, stories: epicStories }]) => (
                  <EpicGroup
                    key={epicId}
                    epicId={epicId}
                    topic={topic}
                    stories={epicStories}
                    onView={(s) => setDetailStoryId(s.id)}
                    onEdit={(s) => { setEditStory(s); setFormOpen(true); }}
                    onDelete={(id) => deleteStory(id)}
                    onStatusChange={(id, status) => handleUpdate(id, { status })}
                  />
                ))}

                {/* Ungrouped stories at the bottom */}
                {ungrouped.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1, pl: 0.5 }}>
                      OTHER STORIES
                    </Typography>
                    <Grid container spacing={2}>
                      {ungrouped.map((story, index) => (
                        <Grid item xs={12} sm={6} lg={4} key={story.id}>
                          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                            <StoryCard
                              story={story}
                              onView={(s) => setDetailStoryId(s.id)}
                              onEdit={(s) => { setEditStory(s); setFormOpen(true); }}
                              onDelete={(id) => deleteStory(id)}
                              onStatusChange={(id, status) => handleUpdate(id, { status })}
                            />
                          </motion.div>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </>
            ) : (
              /* Flat grid when no epics */
              <Grid container spacing={2}>
                {filtered.map((story, index) => (
                  <Grid item xs={12} sm={6} lg={4} key={story.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <StoryCard
                        story={story}
                        onView={(s) => setDetailStoryId(s.id)}
                        onEdit={(s) => { setEditStory(s); setFormOpen(true); }}
                        onDelete={(id) => deleteStory(id)}
                        onStatusChange={(id, status) => handleUpdate(id, { status })}
                      />
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* No results after filtering */}
        {storyCount > 0 && filtered.length === 0 && !busy && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body1" color="text.secondary">
              No stories match your filters
            </Typography>
          </Box>
        )}
      </Box>

      {/* Story detail panel */}
      <StoryDetailPanel
        storyId={detailStoryId}
        onClose={() => setDetailStoryId(null)}
      />

      {/* Create / edit story dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editStory ? `Edit ${editStory.storyId}` : 'Create Story'}
          <IconButton onClick={() => setFormOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          <StoryEditor
            story={editStory}
            onSave={async (storyData) => {
              if (editStory) {
                await handleUpdate(editStory.id, storyData);
              } else {
                await createStory(storyData);
              }
              setFormOpen(false);
            }}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Confirm Clear & Regenerate dialog */}
      <Dialog open={confirmClearOpen} onClose={() => setConfirmClearOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteSweep color="error" />
          Clear & Regenerate Stories?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will <strong>permanently delete all {storyCount} existing
            {storyCount !== 1 ? ' stories' : ' story'}</strong> for this project and generate
            a fresh set using AI from your requirements.
            <br /><br />
            This is recommended when the existing stories are outdated or were generated from
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

export default StoriesPage;
