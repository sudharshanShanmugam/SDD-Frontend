import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Typography,
  Grid,
  Button,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Skeleton,
  Alert,
  Fab,
  Tooltip,
  Breadcrumbs,
  Link,
  Drawer,
  Divider,
  IconButton,
  Stack,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Search, Add, FilterList, PeopleAlt, Close, PersonAdd, PersonRemove } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProjectCard, { Project as CardProject } from '../components/ProjectCard';
import CreateProjectDialog from '../components/CreateProjectDialog';
import { workspacesApi, projectsApi } from '@/api';
import { get } from '@/api/client';
import { useWorkspaceStore } from '@store/workspaceStore';
import { useUIStore } from '@store/uiStore';
import type { ProjectSummary } from '@/types';

// Map API ProjectSummary → local ProjectCard shape
const toCardProject = (p: ProjectSummary): CardProject => {
  const cardStatus: CardProject['status'] = (['active', 'on_hold', 'completed'].includes(p.status)
    ? p.status
    : p.status === 'planning'
    ? 'draft'
    : 'on_hold') as CardProject['status'];

  return {
    id: p.id,
    name: p.name,
    status: cardStatus,
    stage: 'requirements',
    progress: p.stats?.completionPercentage ?? 0,
    storyCount: p.stats?.totalStories ?? 0,
    completedStories: p.stats?.completedStories ?? 0,
    members: p.owner
      ? [{ id: p.owner.id, name: p.owner.displayName, ...(p.owner.avatar ? { avatar: p.owner.avatar } : {}) }]
      : [],
    updatedAt: new Date().toISOString(),
  };
};

const WorkspaceDashboardPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace);
  const toast = useUIStore((s) => s.toast);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  // ── Fetch workspace and hydrate global store ──────────────────────────────
  const {
    data: workspace,
    isLoading: workspaceLoading,
    error: workspaceError,
  } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => workspacesApi.get(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 min
  });

  useEffect(() => {
    if (workspace) setCurrentWorkspace(workspace);
  }, [workspace, setCurrentWorkspace]);

  // ── Fetch projects list ────────────────────────────────────────────────────
  const {
    data: projectsPage,
    isLoading: projectsLoading,
    error: projectsError,
  } = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => projectsApi.list(workspaceId!, { pageSize: 100 }),
    enabled: !!workspaceId,
  });

  const projects: CardProject[] = (projectsPage?.data ?? []).map(toCardProject);

  // ── Fetch workspace members ───────────────────────────────────────────────
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspacesApi.listMembers(workspaceId!),
    enabled: !!workspaceId && membersOpen,
  });
  const members: any[] = Array.isArray(membersData) ? membersData : [];

  // ── Fetch all org users for "add member" picker ───────────────────────────
  const { data: allUsersData } = useQuery({
    queryKey: ['admin', 'users-all'],
    queryFn: () => get<any>('/admin/users?page_size=100'),
    enabled: membersOpen,
  });
  const allUsers: any[] = (allUsersData as any)?.data ?? [];
  const memberUserIds = new Set(members.map((m) => m.user_id));
  const addableUsers = allUsers.filter((u) => !memberUserIds.has(u.id));

  const addMemberMutation = useMutation({
    mutationFn: (userId: string) => workspacesApi.addMember(workspaceId!, userId),
    onSuccess: () => {
      toast.success('Member added');
      setSelectedUserId('');
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
    },
    onError: () => toast.error('Failed to add member'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => workspacesApi.removeMember(workspaceId!, userId),
    onSuccess: () => {
      toast.success('Member removed');
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
    },
    onError: () => toast.error('Failed to remove member'),
  });

  const loading = workspaceLoading || projectsLoading;
  const error   = workspaceError ?? projectsError;

  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, position: 'relative', minHeight: '100vh' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Breadcrumb */}
        <Breadcrumbs sx={{ mb: 1 }}>
          <Link
            component="button"
            underline="hover"
            color="text.secondary"
            variant="body2"
            onClick={() => navigate('/workspaces')}
          >
            Workspaces
          </Link>
          <Typography variant="body2" color="text.primary">
            {workspace?.name ?? '…'}
          </Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 4, gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {(workspace as any)?.color && (
                <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: (workspace as any).color, flexShrink: 0 }} />
              )}
              <Typography variant="h4" fontWeight={700}>
                {workspace?.name ?? 'Workspace'}
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              {(workspace as any)?.description || 'Projects in this workspace'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<PeopleAlt />}
              onClick={() => setMembersOpen(true)}
              sx={{ borderRadius: 2, flexShrink: 0 }}
            >
              Members
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateOpen(true)}
              sx={{ borderRadius: 2, flexShrink: 0 }}
            >
              New Project
            </Button>
          </Stack>
        </Box>
      </motion.div>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {(error as Error).message ?? 'Failed to load workspace data'}
        </Alert>
      )}

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 3,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <TextField
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flexGrow: 1, maxWidth: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="on_hold">On Hold</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" startIcon={<FilterList />} sx={{ borderRadius: 2 }}>
          More Filters
        </Button>
      </Box>

      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid item xs={12} sm={6} lg={4} key={i}>
              <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No projects yet
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
            Click the + button below to create your first project
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filtered.map((project, index) => (
            <Grid item xs={12} sm={6} lg={4} key={project.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <ProjectCard project={project} workspaceId={workspaceId || ''} />
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}

      <Tooltip title="New Project" placement="left">
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 32, right: 32 }}
          onClick={() => setCreateOpen(true)}
        >
          <Add />
        </Fab>
      </Tooltip>

      <CreateProjectDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* ── Members Drawer ── */}
      <Drawer
        anchor="right"
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, p: 3 } }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>Workspace Members</Typography>
            <Typography variant="caption" color="text.secondary">
              People in this workspace can be assigned to its projects
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setMembersOpen(false)}>
            <Close />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Add member */}
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Add Member</Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Select a user</InputLabel>
            <Select
              value={selectedUserId}
              label="Select a user"
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              {addableUsers.length === 0 && (
                <MenuItem disabled value=""><em>All org users are already members</em></MenuItem>
              )}
              {addableUsers.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                      {u.full_name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">{u.full_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                    </Box>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={addMemberMutation.isPending ? <CircularProgress size={14} color="inherit" /> : <PersonAdd />}
            disabled={!selectedUserId || addMemberMutation.isPending}
            onClick={() => selectedUserId && addMemberMutation.mutate(selectedUserId)}
            sx={{ flexShrink: 0 }}
          >
            Add
          </Button>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Member list */}
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
          Current Members {!membersLoading && `(${members.length})`}
        </Typography>

        {membersLoading ? (
          <Stack spacing={1}>
            {[1, 2, 3].map((n) => <Skeleton key={n} height={52} sx={{ borderRadius: 2 }} />)}
          </Stack>
        ) : members.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No members yet.</Typography>
        ) : (
          <Stack spacing={1}>
            {members.map((m) => (
              <Box
                key={m.user_id}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Avatar sx={{ width: 36, height: 36, fontSize: '0.85rem', bgcolor: 'primary.main' }}>
                  {m.full_name?.[0]?.toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>{m.full_name}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>{m.email}</Typography>
                </Box>
                <Chip label={m.role} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                {m.role !== 'owner' && (
                  <Tooltip title="Remove member">
                    <IconButton
                      size="small"
                      onClick={() => removeMemberMutation.mutate(m.user_id)}
                      disabled={removeMemberMutation.isPending}
                      sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                    >
                      <PersonRemove fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Drawer>
    </Box>
  );
};

export default WorkspaceDashboardPage;
