import React, { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  DataGrid,
  type GridColDef,
  type GridRowSelectionModel,
  type GridRenderCellParams,
} from '@mui/x-data-grid';
import {
  AddOutlined,
  SearchOutlined,
  MoreVertOutlined,
  PersonOffOutlined,
  CheckCircleOutlined,
  FileDownloadOutlined,
  SupervisorAccountOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { get, post, put, patch, del } from '@api/client';
import { useAuthStore } from '@store/authStore';
import { useUIStore } from '@store/uiStore';
import type { UUID } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserRow {
  id: UUID;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string | null;
}

interface UsersResponse {
  // Axios interceptor normalises { items, total } → { data, meta }
  data: UserRow[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

// ── Create user form schema ───────────────────────────────────────────────────

const createUserSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.string().min(1, 'Select a role'),
  organization: z.string().min(1, 'Select an organization'),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

// ── Row action menu ───────────────────────────────────────────────────────────

interface UserRowActionsProps {
  row: UserRow;
  canImpersonate: boolean;
  onAction: (action: 'edit' | 'suspend' | 'activate' | 'impersonate' | 'delete', row: UserRow) => void;
}

function UserRowActions({ row, canImpersonate, onAction }: UserRowActionsProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)}>
        <MoreVertOutlined fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <MenuItem onClick={() => { onAction('edit', row); setAnchor(null); }}>
          <EditOutlined fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        {row.is_active && (
          <MenuItem onClick={() => { onAction('suspend', row); setAnchor(null); }}>
            <PersonOffOutlined fontSize="small" sx={{ mr: 1 }} />
            Suspend
          </MenuItem>
        )}
        {!row.is_active && (
          <MenuItem onClick={() => { onAction('activate', row); setAnchor(null); }}>
            <CheckCircleOutlined fontSize="small" sx={{ mr: 1 }} />
            Activate
          </MenuItem>
        )}
        {canImpersonate && (
          <MenuItem
            onClick={() => { onAction('impersonate', row); setAnchor(null); }}
            sx={{ color: 'warning.main' }}
          >
            <SupervisorAccountOutlined fontSize="small" sx={{ mr: 1 }} />
            Impersonate
          </MenuItem>
        )}
        <MenuItem
          onClick={() => { onAction('delete', row); setAnchor(null); }}
          sx={{ color: 'error.main' }}
        >
          <DeleteOutlined fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </>
  );
}

// ── Create user dialog ────────────────────────────────────────────────────────

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function CreateUserDialog({ open, onClose, onCreated }: CreateUserDialogProps) {
  const toast = useUIStore((s) => s.toast);

  const { data: orgsData } = useQuery({
    queryKey: ['admin', 'orgs-picker'],
    queryFn: () => get<any>('/admin/organizations?page=1&page_size=100'),
    enabled: open,
  });
  const orgOptions: { id: string; name: string }[] = (orgsData as any)?.data ?? [];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      role: 'developer',
      organization: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateUserFormValues) => post('/admin/users', data),
    onSuccess: () => {
      toast.success('User created successfully');
      reset();
      onCreated();
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail;
      const status = err?.response?.status;
      if (status === 409) {
        toast.error('Email already registered — this address is in use by another account.');
      } else {
        toast.error(detail ?? 'Failed to create user');
      }
    },
  });

  function onSubmit(data: CreateUserFormValues) {
    createMutation.mutate(data);
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Stack direction="row" spacing={2}>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="First Name"
                    error={!!errors.firstName}
                    helperText={errors.firstName?.message}
                    fullWidth
                    size="small"
                  />
                )}
              />
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Last Name"
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                    fullWidth
                    size="small"
                  />
                )}
              />
            </Stack>

            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email Address"
                  type="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  fullWidth
                  size="small"
                />
              )}
            />

            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth size="small" error={!!errors.role}>
                  <InputLabel>Role</InputLabel>
                  <Select {...field} label="Role">
                    <MenuItem value="org_admin">Org Admin</MenuItem>
                    <MenuItem value="workspace_admin">Workspace Admin</MenuItem>
                    <MenuItem value="project_manager">Project Manager</MenuItem>
                    <MenuItem value="developer">Developer</MenuItem>
                    <MenuItem value="viewer">Viewer</MenuItem>
                  </Select>
                </FormControl>
              )}
            />

            <Controller
              name="organization"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth size="small" error={!!errors.organization}>
                  <InputLabel>Organization</InputLabel>
                  <Select {...field} label="Organization" displayEmpty>
                    {orgOptions.length === 0 && (
                      <MenuItem disabled value="">
                        <em>Loading organizations…</em>
                      </MenuItem>
                    )}
                    {orgOptions.map((org) => (
                      <MenuItem key={org.id} value={org.id}>
                        {org.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.organization && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                      {errors.organization.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isPending}
            startIcon={createMutation.isPending ? <CircularProgress size={14} /> : undefined}
          >
            Create User
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// ── Edit user dialog ──────────────────────────────────────────────────────────

const editUserSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  role: z.string().min(1, 'Select a role'),
  is_active: z.boolean(),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

interface EditUserDialogProps {
  user: UserRow | null;
  onClose: () => void;
  onSaved: () => void;
}

function EditUserDialog({ user, onClose, onSaved }: EditUserDialogProps) {
  const toast = useUIStore((s) => s.toast);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
  });

  React.useEffect(() => {
    if (user) {
      reset({
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
      });
    }
  }, [user, reset]);

  const editMutation = useMutation({
    mutationFn: (data: EditUserFormValues) =>
      patch(`/admin/users/${user!.id}`, data),
    onSuccess: () => {
      toast.success('User updated');
      onSaved();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? 'Failed to update user');
    },
  });

  return (
    <Dialog open={Boolean(user)} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit((data) => editMutation.mutate(data))}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Controller
              name="full_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Full Name"
                  error={!!errors.full_name}
                  helperText={errors.full_name?.message}
                  fullWidth
                  size="small"
                />
              )}
            />
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email Address"
                  type="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  fullWidth
                  size="small"
                />
              )}
            />
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth size="small" error={!!errors.role}>
                  <InputLabel>Role</InputLabel>
                  <Select {...field} label="Role">
                    <MenuItem value="super_admin">Super Admin</MenuItem>
                    <MenuItem value="org_admin">Org Admin</MenuItem>
                    <MenuItem value="project_manager">Project Manager</MenuItem>
                    <MenuItem value="tech_lead">Tech Lead</MenuItem>
                    <MenuItem value="developer">Developer</MenuItem>
                    <MenuItem value="qa_engineer">QA Engineer</MenuItem>
                    <MenuItem value="business_analyst">Business Analyst</MenuItem>
                    <MenuItem value="viewer">Viewer</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={field.value ? 'active' : 'inactive'}
                    onChange={(e) => field.onChange(e.target.value === 'active')}
                    label="Status"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={editMutation.isPending}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={editMutation.isPending}
            startIcon={editMutation.isPending ? <CircularProgress size={14} /> : undefined}
          >
            Save Changes
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// ── Impersonate confirmation ───────────────────────────────────────────────────

interface ImpersonateDialogProps {
  user: UserRow | null;
  onConfirm: () => void;
  onClose: () => void;
}

function ImpersonateDialog({ user, onConfirm, onClose }: ImpersonateDialogProps) {
  return (
    <Dialog open={Boolean(user)} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ color: 'warning.main' }}>Impersonate User</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          You are about to impersonate{' '}
          <strong>{user?.full_name}</strong> ({user?.email}). All actions
          performed while impersonating will be logged. This session will be
          recorded for audit purposes.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="warning" variant="contained" onClick={onConfirm}>
          Impersonate
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Delete confirmation ───────────────────────────────────────────────────────

interface DeleteUserDialogProps {
  user: UserRow | null;
  onConfirm: () => void;
  onClose: () => void;
  isPending: boolean;
}

function DeleteUserDialog({ user, onConfirm, onClose, isPending }: DeleteUserDialogProps) {
  return (
    <Dialog open={Boolean(user)} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ color: 'error.main' }}>Delete User</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          Permanently delete <strong>{user?.full_name}</strong> ({user?.email})?
          This cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>Cancel</Button>
        <Button color="error" variant="contained" onClick={onConfirm} disabled={isPending}>
          {isPending ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

interface UserManagementPageProps {
  embedded?: boolean;
}

export default function UserManagementPage({ embedded }: UserManagementPageProps = {}) {
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);
  const [impersonateTarget, setImpersonateTarget] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const queryClient = useQueryClient();
  const toast = useUIStore((s) => s.toast);
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin());

  const { data, isLoading } = useQuery<UsersResponse>({
    queryKey: ['admin', 'users', search],
    queryFn: () => get<UsersResponse>(`/admin/users?search=${encodeURIComponent(search)}&page_size=50`),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: UUID) => put(`/admin/users/${id}/suspend`, {}),
    onSuccess: () => {
      toast.success('User suspended');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Failed to suspend user'),
  });

  const activateMutation = useMutation({
    mutationFn: (id: UUID) => put(`/admin/users/${id}/activate`, {}),
    onSuccess: () => {
      toast.success('User activated');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Failed to activate user'),
  });

  const bulkSuspendMutation = useMutation({
    mutationFn: (ids: UUID[]) => post('/admin/users/bulk-suspend', { ids }),
    onSuccess: () => {
      toast.success(`${selectedRows.length} users suspended`);
      setSelectedRows([]);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Bulk suspend failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: UUID) => del(`/users/${id}`),
    onSuccess: () => {
      toast.success('User deleted');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail;
      toast.error(detail ?? 'Failed to delete user');
    },
  });

  const bulkActivateMutation = useMutation({
    mutationFn: (ids: UUID[]) => post('/admin/users/bulk-activate', { ids }),
    onSuccess: () => {
      toast.success(`${selectedRows.length} users activated`);
      setSelectedRows([]);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Bulk activate failed'),
  });

  function handleAction(action: 'edit' | 'suspend' | 'activate' | 'impersonate' | 'delete', row: UserRow) {
    switch (action) {
      case 'edit':
        setEditTarget(row);
        break;
      case 'suspend':
        suspendMutation.mutate(row.id);
        break;
      case 'activate':
        activateMutation.mutate(row.id);
        break;
      case 'impersonate':
        setImpersonateTarget(row);
        break;
      case 'delete':
        setDeleteTarget(row);
        break;
    }
  }

  function handleExportCSV() {
    const rows = data?.data ?? [];
    const csv = [
      ['Name', 'Email', 'Role', 'Status', 'Created'].join(','),
      ...rows.map((r) =>
        [
          r.full_name,
          r.email,
          r.role,
          r.is_active ? 'active' : 'inactive',
          r.created_at ? format(parseISO(r.created_at), 'yyyy-MM-dd') : '',
        ].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const cell = (children: React.ReactNode) => (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%' }}>
      {children}
    </Box>
  );

  const columns: GridColDef[] = [
    {
      field: 'full_name',
      headerName: 'Name',
      flex: 1.5,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams) => cell(
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar
            sx={{ width: 32, height: 32, fontSize: 13, flexShrink: 0 }}
            src={params.row.avatar_url ?? undefined}
          >
            {params.value?.[0]?.toUpperCase() ?? '?'}
          </Avatar>
          <Typography variant="body2" fontWeight={600} noWrap>
            {params.value || '—'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.5,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams) => cell(
        <Typography variant="body2" noWrap>{params.value || '—'}</Typography>
      ),
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 160,
      renderCell: (params: GridRenderCellParams) => cell(
        <Chip
          label={params.value?.replace(/_/g, ' ')}
          size="small"
          variant="outlined"
          sx={{ textTransform: 'capitalize' }}
        />
      ),
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 110,
      renderCell: (params: GridRenderCellParams) => cell(
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'created_at',
      headerName: 'Joined',
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        let label = '—';
        if (params.value) {
          try { label = format(parseISO(params.value), 'MMM d, yyyy'); } catch { label = params.value; }
        }
        return cell(<Typography variant="body2" color="text.secondary">{label}</Typography>);
      },
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<UserRow>) => cell(
        <UserRowActions
          row={params.row}
          canImpersonate={isSuperAdmin}
          onAction={handleAction}
        />
      ),
    },
  ];

  return (
    <Box sx={embedded ? {} : { maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>
      {/* Header */}
      <Box
        display="flex"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={2}
        mb={3}
      >
        <Typography variant="body2" color="text.secondary">
          {data?.meta?.total ?? 0} users
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={() => setCreateOpen(true)}
        >
          Create User
        </Button>
      </Box>

      {/* Toolbar */}
      <Box display="flex" alignItems="center" gap={2} mb={2} flexWrap="wrap">
        <TextField
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: 300 }}
          InputProps={{
            startAdornment: <SearchOutlined fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />

        {selectedRows.length > 0 && (
          <>
            <Tooltip title="Suspend selected">
              <Button
                size="small"
                color="warning"
                variant="outlined"
                startIcon={<PersonOffOutlined />}
                onClick={() =>
                  bulkSuspendMutation.mutate(selectedRows as UUID[])
                }
                disabled={bulkSuspendMutation.isPending}
              >
                Suspend ({selectedRows.length})
              </Button>
            </Tooltip>
            <Tooltip title="Activate selected">
              <Button
                size="small"
                color="success"
                variant="outlined"
                startIcon={<CheckCircleOutlined />}
                onClick={() =>
                  bulkActivateMutation.mutate(selectedRows as UUID[])
                }
                disabled={bulkActivateMutation.isPending}
              >
                Activate ({selectedRows.length})
              </Button>
            </Tooltip>
          </>
        )}

        <Box sx={{ ml: 'auto' }}>
          <Tooltip title="Export CSV">
            <Button
              size="small"
              variant="outlined"
              startIcon={<FileDownloadOutlined />}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* Data grid */}
      <DataGrid
        rows={data?.data ?? []}
        columns={columns}
        loading={isLoading}
        rowCount={data?.meta?.total ?? 0}
        checkboxSelection
        rowSelectionModel={selectedRows}
        onRowSelectionModelChange={(model) => setSelectedRows(model)}
        disableRowSelectionOnClick
        autoHeight
        pageSizeOptions={[10, 25, 50]}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
        }}
        rowHeight={56}
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          '& .MuiDataGrid-row': { cursor: 'default' },
          '& .MuiDataGrid-columnHeaders': { bgcolor: 'background.default' },
          '& .MuiDataGrid-cell': { py: 0 },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
          '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
        }}
      />

      {/* Dialogs */}
      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        }}
      />

      <EditUserDialog
        user={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={() => {
          setEditTarget(null);
          queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        }}
      />

      <ImpersonateDialog
        user={impersonateTarget}
        onClose={() => setImpersonateTarget(null)}
        onConfirm={() => {
          toast.warning(`Impersonating ${impersonateTarget?.full_name}...`);
          setImpersonateTarget(null);
          // In production: call POST /admin/users/:id/impersonate and redirect
        }}
      />

      <DeleteUserDialog
        user={deleteTarget}
        isPending={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </Box>
  );
}
