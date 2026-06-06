/**
 * WorkspacesPage — lists every workspace the user belongs to and lets them
 * create new ones.  Lives at /workspaces.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  IconButton,
  Skeleton,
  Tooltip,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Alert,
} from '@mui/material';
import {
  Plus,
  MoreVertical,
  Trash2,
  FolderKanban,
  Star,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workspacesApi } from '@/api';
import { useAuthStore } from '@store/authStore';
import { useWorkspaceStore } from '@store/workspaceStore';
import CreateWorkspaceDialog from '../components/CreateWorkspaceDialog';

// ── Animation variants ────────────────────────────────────────
const containerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const cardVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

// ── WorkspaceCard ─────────────────────────────────────────────

interface WorkspaceCardProps {
  ws: any;
  onNavigate: (id: string) => void;
  onDelete: (id: string) => void;
}

function WorkspaceCard({ ws, onNavigate, onDelete }: WorkspaceCardProps) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  return (
    <motion.div variants={cardVariants}>
      <Card
        sx={{
          height: '100%',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
          '&:hover': { boxShadow: 4, borderColor: 'primary.200' },
          transition: 'box-shadow 180ms, border-color 180ms',
          position: 'relative',
        }}
      >
        {/* ── Top colour strip ── */}
        <Box
          sx={{
            height: 6,
            bgcolor: ws.color ?? '#6366f1',
            borderRadius: '12px 12px 0 0',
          }}
        />

        <CardActionArea onClick={() => onNavigate(ws.id)} sx={{ borderRadius: '0 0 12px 12px' }}>
          <CardContent sx={{ pb: '12px !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              {/* Colour dot + name */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                  <Box
                    sx={{
                      width: 10, height: 10,
                      borderRadius: '50%',
                      bgcolor: ws.color ?? '#6366f1',
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="subtitle1" fontWeight={700} noWrap>
                    {ws.name}
                  </Typography>
                  {ws.is_default && (
                    <Tooltip title="Default workspace">
                      <Star size={13} style={{ color: '#f59e0b', fill: '#f59e0b', flexShrink: 0 }} />
                    </Tooltip>
                  )}
                </Box>

                {ws.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {ws.description}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: ws.description ? 0 : 1 }}>
                  <FolderKanban size={13} color="#9ca3af" />
                  <Typography variant="caption" color="text.secondary">
                    {ws.slug}
                  </Typography>
                </Box>
              </Box>

              {/* ⋮ menu — stopPropagation so click doesn't navigate */}
              <Box
                onClick={(e) => e.stopPropagation()}
                sx={{ flexShrink: 0 }}
              >
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); setAnchor(e.currentTarget); }}
                  sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
                >
                  <MoreVertical size={16} />
                </IconButton>
                <Menu
                  anchorEl={anchor}
                  open={Boolean(anchor)}
                  onClose={() => setAnchor(null)}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  {!ws.is_default && (
                    <MenuItem
                      onClick={() => { setAnchor(null); onDelete(ws.id); }}
                      sx={{ color: 'error.main' }}
                    >
                      <ListItemIcon sx={{ color: 'inherit' }}>
                        <Trash2 size={15} />
                      </ListItemIcon>
                      <ListItemText>Delete</ListItemText>
                    </MenuItem>
                  )}
                  {ws.is_default && (
                    <MenuItem disabled>
                      <ListItemText>
                        <Typography variant="caption" color="text.disabled">
                          Default workspace cannot be deleted
                        </Typography>
                      </ListItemText>
                    </MenuItem>
                  )}
                </Menu>
              </Box>
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    </motion.div>
  );
}

// ── WorkspacesPage ────────────────────────────────────────────

export default function WorkspacesPage() {
  const navigate        = useNavigate();
  const queryClient     = useQueryClient();
  const setCurrentWs    = useWorkspaceStore((s) => s.setCurrentWorkspace);
  const orgId           = useAuthStore((s) => s.organization?.id ?? '')
                          || '00000000-0000-0000-0000-000000000020';

  const [createOpen, setCreateOpen] = useState(false);

  // ── Fetch workspaces ───────────────────────────────────────
  const { data: page, isLoading, error } = useQuery({
    queryKey: ['workspaces', orgId],
    queryFn:  () => workspacesApi.list(orgId),
    enabled:  !!orgId,
  });

  // Support both raw {items} and normalised {data} shapes
  const workspaces: any[] = (page as any)?.data ?? (page as any)?.items ?? [];

  // ── Delete workspace ───────────────────────────────────────
  const { mutate: deleteWs } = useMutation({
    mutationFn: (id: string) => workspacesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspaces'] }),
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this workspace? This cannot be undone.')) {
      deleteWs(id);
    }
  };

  const handleNavigate = (id: string) => {
    const ws = workspaces.find((w) => w.id === id);
    if (ws) setCurrentWs(ws);
    navigate(`/workspaces/${id}`);
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 960, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={800}>
            Workspaces
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Group your projects into workspaces
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={16} />}
          onClick={() => setCreateOpen(true)}
          sx={{ borderRadius: 2, color: 'white' }}
        >
          New Workspace
        </Button>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Could not load workspaces.
        </Alert>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <Grid container spacing={2}>
          {[1, 2, 3].map((n) => (
            <Grid item xs={12} sm={6} md={4} key={n}>
              <Skeleton variant="rounded" height={130} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Workspace grid */}
      {!isLoading && workspaces.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Grid container spacing={2}>
            {workspaces.map((ws) => (
              <Grid item xs={12} sm={6} md={4} key={ws.id}>
                <WorkspaceCard
                  ws={ws}
                  onNavigate={handleNavigate}
                  onDelete={handleDelete}
                />
              </Grid>
            ))}
          </Grid>
        </motion.div>
      )}

      {/* Empty state */}
      {!isLoading && workspaces.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 10,
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 4,
          }}
        >
          <FolderKanban size={40} color="#9ca3af" style={{ marginBottom: 12 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            No workspaces yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first workspace to start organising projects.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={() => setCreateOpen(true)}
          >
            New Workspace
          </Button>
        </Box>
      )}

      {/* Create dialog */}
      <CreateWorkspaceDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(ws) => navigate(`/workspaces/${ws.id}`)}
      />
    </Box>
  );
}
