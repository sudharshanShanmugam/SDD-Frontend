import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ArrowBackOutlined,
  AutorenewOutlined,
  ContentCopyOutlined,
  FileDownloadOutlined,
  PublishOutlined,
  TagOutlined,
  MoreVertOutlined,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { get, post, put } from '@api/client';
import { useUIStore } from '@store/uiStore';
import { ReleaseNotes } from '../components/ReleaseNotes';
import type { UUID } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

type ReleaseStatus = 'DRAFT' | 'RC' | 'PUBLISHED';

interface ReleaseDetail {
  id: UUID;
  version: string;
  status: ReleaseStatus;
  description: string;
  startDate: string;
  endDate: string;
  sprintCount: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  bugCount: number;
  fixedBugCount: number;
  testPassRate: number;
  releaseNotes: string;
  sprints: SprintCoverage[];
  deployments: DeploymentRecord[];
}

interface SprintCoverage {
  id: UUID;
  name: string;
  storyCount: number;
  completedStoryCount: number;
  storyPoints: number;
  startDate: string;
  endDate: string;
}

interface DeploymentRecord {
  id: UUID;
  environment: string;
  status: 'success' | 'failed' | 'pending';
  deployedAt: string;
  deployedBy: string;
  version: string;
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CHIP: Record<ReleaseStatus, { color: 'success' | 'primary' | 'default'; label: string }> = {
  PUBLISHED: { color: 'success', label: 'Published' },
  RC: { color: 'primary', label: 'Release Candidate' },
  DRAFT: { color: 'default', label: 'Draft' },
};

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
      <Typography variant="h4" fontWeight={700} color="primary.main">
        {value}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {label}
      </Typography>
      {sub && (
        <Typography variant="caption" color="text.secondary">
          {sub}
        </Typography>
      )}
    </Paper>
  );
}

// ── Deployment status chip ────────────────────────────────────────────────────

function DeployStatusChip({ status }: { status: 'success' | 'failed' | 'pending' }) {
  const map = {
    success: { color: 'success' as const, label: 'Deployed' },
    failed: { color: 'error' as const, label: 'Failed' },
    pending: { color: 'warning' as const, label: 'Pending' },
  };
  const cfg = map[status];
  return <Chip label={cfg.label} color={cfg.color} size="small" />;
}

// ── Tab panels ────────────────────────────────────────────────────────────────

function OverviewTab({ release }: { release: ReleaseDetail }) {
  const completionPct =
    release.totalStoryPoints > 0
      ? ((release.completedStoryPoints / release.totalStoryPoints) * 100).toFixed(0)
      : '0';

  return (
    <Grid container spacing={2} mt={0.5}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          label="Stories Completed"
          value={`${release.completedStoryPoints}/${release.totalStoryPoints}`}
          sub={`${completionPct}% story points`}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          label="Bugs Fixed"
          value={`${release.fixedBugCount}/${release.bugCount}`}
          sub="reported vs resolved"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          label="Test Pass Rate"
          value={`${release.testPassRate}%`}
          sub="automated test suite"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          label="Sprints"
          value={release.sprintCount}
          sub="included in release"
        />
      </Grid>
    </Grid>
  );
}

function SprintCoverageTab({ sprints }: { sprints: SprintCoverage[] }) {
  return (
    <Stack spacing={1.5} mt={1}>
      {sprints.map((sprint) => (
        <Paper key={sprint.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
            <Typography variant="subtitle2" fontWeight={600}>
              {sprint.name}
            </Typography>
            <Chip
              label={`${sprint.completedStoryCount}/${sprint.storyCount} stories`}
              size="small"
              color={sprint.completedStoryCount === sprint.storyCount ? 'success' : 'default'}
            />
          </Box>
          <Box display="flex" gap={3}>
            <Typography variant="caption" color="text.secondary">
              {sprint.storyPoints} story points
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {sprint.startDate} – {sprint.endDate}
            </Typography>
          </Box>
        </Paper>
      ))}
    </Stack>
  );
}

function ReleaseNotesTab({
  release,
  onSave,
}: {
  release: ReleaseDetail;
  onSave: (html: string) => void;
}) {
  const queryClient = useQueryClient();
  const toast = useUIStore((s) => s.toast);

  const regenMutation = useMutation({
    mutationFn: () => post(`/releases/${release.id}/generate-notes`, {}),
    onSuccess: () => {
      toast.success('Release notes regenerated by AI');
      queryClient.invalidateQueries({ queryKey: ['release', release.id] });
    },
    onError: () => toast.error('Failed to regenerate notes'),
  });

  return (
    <Box mt={1}>
      <Box display="flex" justifyContent="flex-end" mb={1.5}>
        <Button
          size="small"
          startIcon={
            regenMutation.isPending ? (
              <CircularProgress size={14} />
            ) : (
              <AutorenewOutlined />
            )
          }
          onClick={() => regenMutation.mutate()}
          disabled={regenMutation.isPending}
        >
          Regenerate with AI
        </Button>
      </Box>
      <ReleaseNotes content={release.releaseNotes} onSave={onSave} />
    </Box>
  );
}

function DeploymentTab({ deployments }: { deployments: DeploymentRecord[] }) {
  return (
    <Stack spacing={1.5} mt={1}>
      {deployments.map((dep) => (
        <Paper key={dep.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                {dep.environment}
              </Typography>
              {dep.deployedAt && (
                <Typography variant="caption" color="text.secondary">
                  Deployed by {dep.deployedBy} on{' '}
                  {format(parseISO(dep.deployedAt), 'MMM d, yyyy HH:mm')}
                </Typography>
              )}
              {!dep.deployedAt && (
                <Typography variant="caption" color="text.secondary">
                  Not yet deployed
                </Typography>
              )}
            </Box>
            <DeployStatusChip status={dep.status} />
          </Box>
        </Paper>
      ))}
    </Stack>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'sprints' | 'notes' | 'deployment';

export default function ReleaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useUIStore((s) => s.toast);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [actionMenuAnchor, setActionMenuAnchor] = useState<HTMLElement | null>(null);

  const { data: release, isLoading } = useQuery<ReleaseDetail>({
    queryKey: ['release', id],
    queryFn: () => get<ReleaseDetail>(`/releases/${id}`),
    enabled: !!id,
  });

  const saveNotesMutation = useMutation({
    mutationFn: (html: string) => put(`/releases/${id}/notes`, { content: html }),
    onSuccess: () => {
      toast.success('Release notes saved');
      queryClient.invalidateQueries({ queryKey: ['release', id] });
    },
    onError: () => toast.error('Failed to save notes'),
  });

  const publishMutation = useMutation({
    mutationFn: () => post(`/releases/${id}/publish`, {}),
    onSuccess: () => {
      toast.success(`Release ${release?.version} published`);
      queryClient.invalidateQueries({ queryKey: ['releases'] });
      queryClient.invalidateQueries({ queryKey: ['release', id] });
    },
    onError: () => toast.error('Publish failed'),
  });

  const createRCMutation = useMutation({
    mutationFn: () => post(`/releases/${id}/create-rc`, {}),
    onSuccess: () => {
      toast.success('Release candidate created');
      queryClient.invalidateQueries({ queryKey: ['releases'] });
    },
    onError: () => toast.error('Failed to create RC'),
  });

  if (isLoading || !release) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  const statusCfg = STATUS_CHIP[release.status];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>
      {/* Back nav */}
      <Button
        startIcon={<ArrowBackOutlined />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
        size="small"
      >
        Releases
      </Button>

      {/* Release header */}
      <Box
        display="flex"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={2}
        mb={3}
      >
        <Box>
          <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
            <TagOutlined color="action" />
            <Typography variant="h4" fontWeight={800}>
              {release.version}
            </Typography>
            <Chip label={statusCfg.label} color={statusCfg.color} size="small" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {release.description}
          </Typography>
          <Typography variant="caption" color="text.disabled" display="block" mt={0.5}>
            {release.startDate} – {release.endDate}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          {release.status === 'DRAFT' && (
            <Button
              variant="outlined"
              startIcon={<TagOutlined />}
              onClick={() => createRCMutation.mutate()}
              disabled={createRCMutation.isPending}
            >
              Create RC
            </Button>
          )}
          {release.status !== 'PUBLISHED' && (
            <Button
              variant="contained"
              startIcon={<PublishOutlined />}
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
            >
              Publish
            </Button>
          )}
          <Tooltip title="More actions">
            <IconButton
              onClick={(e) => setActionMenuAnchor(e.currentTarget)}
            >
              <MoreVertOutlined />
            </IconButton>
          </Tooltip>
        </Stack>

        <Menu
          anchorEl={actionMenuAnchor}
          open={Boolean(actionMenuAnchor)}
          onClose={() => setActionMenuAnchor(null)}
        >
          <MenuItem
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.info('Link copied to clipboard');
              setActionMenuAnchor(null);
            }}
          >
            <ContentCopyOutlined fontSize="small" sx={{ mr: 1 }} />
            Copy Link
          </MenuItem>
          <MenuItem onClick={() => { toast.info('PDF export started'); setActionMenuAnchor(null); }}>
            <FileDownloadOutlined fontSize="small" sx={{ mr: 1 }} />
            Export PDF
          </MenuItem>
        </Menu>
      </Box>

      <Divider />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v: TabId) => setActiveTab(v)}
        sx={{ mb: 3 }}
      >
        <Tab value="overview" label="Overview" />
        <Tab value="sprints" label="Sprint Coverage" />
        <Tab value="notes" label="Release Notes" />
        <Tab value="deployment" label="Deployment" />
      </Tabs>

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewTab release={release} />}
      {activeTab === 'sprints' && <SprintCoverageTab sprints={release.sprints} />}
      {activeTab === 'notes' && (
        <ReleaseNotesTab
          release={release}
          onSave={(html) => saveNotesMutation.mutate(html)}
        />
      )}
      {activeTab === 'deployment' && <DeploymentTab deployments={release.deployments} />}
    </Box>
  );
}
