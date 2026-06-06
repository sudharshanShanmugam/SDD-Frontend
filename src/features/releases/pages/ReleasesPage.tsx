import React, { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { AddOutlined } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { releasesApi } from '@/api';
import { ReleaseCard, type ReleaseCardData } from '../components/ReleaseCard';
import type { UUID } from '@/types';

// ── Inline detail view (right panel) ─────────────────────────────────────────

interface ReleaseDetailViewProps {
  releaseId: UUID | null;
  releases: ReleaseCardData[];
}

function ReleaseDetailView({ releaseId, releases }: ReleaseDetailViewProps) {
  const release = releases.find((r) => r.id === releaseId);

  if (!releaseId || !release) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'text.disabled',
          gap: 1.5,
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Select a release to view details
        </Typography>
      </Box>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={releaseId}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -8 }}
        transition={{ duration: 0.2 }}
        style={{ height: '100%' }}
      >
        <Box p={3}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box>
              <Typography variant="h5" fontWeight={700}>{release.version}</Typography>
              <Typography variant="body2" color="text.secondary" mt={0.25}>
                {release.description}
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={1.5}>
            <Box display="flex" gap={2}>
              <Box flex={1} p={2} borderRadius={2} bgcolor="action.hover">
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Typography variant="body1" fontWeight={600}>{release.status}</Typography>
              </Box>
              <Box flex={1} p={2} borderRadius={2} bgcolor="action.hover">
                <Typography variant="caption" color="text.secondary">Sprints</Typography>
                <Typography variant="body1" fontWeight={600}>{release.sprintCount}</Typography>
              </Box>
              <Box flex={1} p={2} borderRadius={2} bgcolor="action.hover">
                <Typography variant="caption" color="text.secondary">Story Points</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {release.completedStoryPoints}/{release.totalStoryPoints}
                </Typography>
              </Box>
            </Box>
          </Stack>
          <Typography variant="body2" color="text.disabled" mt={2}>
            Open the full release detail page for Sprint Coverage, Release Notes, and Deployment tabs.
          </Typography>
        </Box>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReleasesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<UUID | null>(null);
  const [newReleaseOpen, setNewReleaseOpen] = useState(false);
  const [newReleaseName, setNewReleaseName] = useState('');
  const [newReleaseVersion, setNewReleaseVersion] = useState('');

  const { data: releasesResult, isLoading } = useQuery({
    queryKey: ['releases', projectId],
    queryFn: () => releasesApi.list(projectId!),
    enabled: !!projectId,
  });
  const releases: ReleaseCardData[] = (releasesResult?.data ?? []) as unknown as ReleaseCardData[];

  const { mutate: createRelease, isPending: isCreating } = useMutation({
    mutationFn: () =>
      releasesApi.create(projectId!, { name: newReleaseName, version: newReleaseVersion }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releases', projectId] });
      setNewReleaseOpen(false);
      setNewReleaseName('');
      setNewReleaseVersion('');
    },
  });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Page header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>Releases</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage product releases, RC builds, and deployment history
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={() => setNewReleaseOpen(true)}
        >
          New Release
        </Button>
      </Box>

      {/* Two-panel layout */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left panel — release list */}
        <Box
          sx={{
            width: '35%',
            minWidth: 280,
            maxWidth: 400,
            borderRight: 1,
            borderColor: 'divider',
            overflowY: 'auto',
            p: 2,
          }}
        >
          {isLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {(releases ?? []).map((release) => (
                <motion.div
                  key={release.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ReleaseCard
                    release={{ ...release, isSelected: release.id === selectedId }}
                    onClick={(id) => setSelectedId(id === selectedId ? null : id)}
                  />
                </motion.div>
              ))}
            </Stack>
          )}
        </Box>

        {/* Right panel — detail */}
        <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: 'background.default' }}>
          <ReleaseDetailView
            releaseId={selectedId}
            releases={releases ?? []}
          />
        </Box>
      </Box>

      {/* New Release Dialog */}
      <Dialog open={newReleaseOpen} onClose={() => setNewReleaseOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>New Release</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Release Name"
              fullWidth
              value={newReleaseName}
              onChange={(e) => setNewReleaseName(e.target.value)}
              placeholder="e.g. Sprint Release 1.0"
            />
            <TextField
              label="Version"
              fullWidth
              value={newReleaseVersion}
              onChange={(e) => setNewReleaseVersion(e.target.value)}
              placeholder="e.g. 1.0.0"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setNewReleaseOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!newReleaseName || !newReleaseVersion || isCreating}
            onClick={() => createRelease()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
