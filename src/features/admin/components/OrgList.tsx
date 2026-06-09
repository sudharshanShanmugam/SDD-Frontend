import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridRenderCellParams,
} from '@mui/x-data-grid';
import {
  MoreVertOutlined,
  VisibilityOutlined,
  PauseCircleOutlined,
  UpgradeOutlined,
  DeleteOutlined,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { get, put, del } from '@api/client';
import { useUIStore } from '@store/uiStore';
import type { UUID } from '@/types';
import type { OrgPlan, OrgStatus } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrgRow {
  id: UUID;
  name: string;
  plan: OrgPlan;
  status: OrgStatus;
  userCount: number;
  projectCount: number;
  storageGB: number;
  createdAt: string;
}

interface OrgListResponse {
  data: OrgRow[];
  total: number;
}

// ── Plan chip ─────────────────────────────────────────────────────────────────

const PLAN_CHIP_COLOR: Record<OrgPlan, 'default' | 'primary' | 'secondary' | 'success'> = {
  free: 'default',
  starter: 'primary',
  professional: 'secondary',
  enterprise: 'success',
};

function PlanChip({ plan }: { plan: OrgPlan }) {
  return (
    <Chip
      label={plan.toUpperCase()}
      color={PLAN_CHIP_COLOR[plan]}
      size="small"
      sx={{ fontWeight: 700, fontSize: 10 }}
    />
  );
}

function StatusChip({ status }: { status: OrgStatus }) {
  const map: Record<OrgStatus, 'success' | 'warning' | 'error' | 'default'> = {
    active: 'success',
    trial: 'warning',
    suspended: 'error',
    cancelled: 'default',
  };
  return (
    <Chip label={status} color={map[status]} size="small" variant="outlined" />
  );
}

// ── Row action menu ───────────────────────────────────────────────────────────

interface RowActionsProps {
  row: OrgRow;
  onAction: (action: 'view' | 'suspend' | 'plan' | 'delete', row: OrgRow) => void;
}

function RowActions({ row, onAction }: RowActionsProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)}>
        <MoreVertOutlined fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { minWidth: 160 } } }}
      >
        <MenuItem
          onClick={() => { onAction('view', row); setAnchor(null); }}
        >
          <VisibilityOutlined fontSize="small" sx={{ mr: 1 }} />
          View
        </MenuItem>
        <MenuItem
          onClick={() => { onAction('suspend', row); setAnchor(null); }}
          disabled={row.status === 'suspended'}
        >
          <PauseCircleOutlined fontSize="small" sx={{ mr: 1 }} />
          Suspend
        </MenuItem>
        <MenuItem
          onClick={() => { onAction('plan', row); setAnchor(null); }}
        >
          <UpgradeOutlined fontSize="small" sx={{ mr: 1 }} />
          Change Plan
        </MenuItem>
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

// ── Main component ────────────────────────────────────────────────────────────

interface OrgListProps {
  search?: string;
  planFilter?: OrgPlan | 'all';
  statusFilter?: OrgStatus | 'all';
}

export function OrgList({ search = '', planFilter = 'all', statusFilter = 'all' }: OrgListProps) {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [deleteTarget, setDeleteTarget] = useState<OrgRow | null>(null);
  const queryClient = useQueryClient();
  const toast = useUIStore((s) => s.toast);

  const planParam   = planFilter   !== 'all' ? `&plan=${planFilter}`     : '';
  const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '';

  const { data, isLoading } = useQuery<OrgListResponse>({
    queryKey: ['admin', 'orgs', paginationModel.page, paginationModel.pageSize, planFilter, statusFilter],
    queryFn: async () => {
      try {
        return await get<OrgListResponse>(
          `/admin/organizations?page=${paginationModel.page + 1}&page_size=${paginationModel.pageSize}${planParam}${statusParam}`
        );
      } catch {
        return { data: [], total: 0 };
      }
    },
  });

  const filteredRows = (data?.data ?? []).filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase())
  );

  const suspendMutation = useMutation({
    mutationFn: (id: UUID) => put(`/admin/organizations/${id}/suspend`, {}),
    onSuccess: () => {
      toast.success('Organization suspended');
      queryClient.invalidateQueries({ queryKey: ['admin', 'orgs'] });
    },
    onError: () => toast.error('Failed to suspend organization'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: UUID) => del(`/admin/organizations/${id}`),
    onSuccess: () => {
      toast.success('Organization deleted');
      queryClient.invalidateQueries({ queryKey: ['admin', 'orgs'] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete organization'),
  });

  function handleAction(action: 'view' | 'suspend' | 'plan' | 'delete', row: OrgRow) {
    switch (action) {
      case 'view':
        window.location.href = `/admin/organizations/${row.id}`;
        break;
      case 'suspend':
        suspendMutation.mutate(row.id);
        break;
      case 'plan':
        toast.info(`Plan change dialog for ${row.name} coming soon`);
        break;
      case 'delete':
        setDeleteTarget(row);
        break;
    }
  }

  const columns: GridColDef<OrgRow>[] = [
    {
      field: 'name',
      headerName: 'Organization',
      flex: 1.5,
      minWidth: 160,
      renderCell: (params: GridRenderCellParams<OrgRow, string>) => (
        <Typography variant="body2" fontWeight={600}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'plan',
      headerName: 'Plan',
      width: 130,
      renderCell: (params: GridRenderCellParams<OrgRow, OrgPlan>) => (
        <PlanChip plan={params.value!} />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams<OrgRow, OrgStatus>) => (
        <StatusChip status={params.value!} />
      ),
    },
    {
      field: 'userCount',
      headerName: 'Users',
      width: 90,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
    },
    {
      field: 'projectCount',
      headerName: 'Projects',
      width: 100,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
    },
    {
      field: 'storageGB',
      headerName: 'Storage',
      width: 110,
      renderCell: (params: GridRenderCellParams<OrgRow, number>) => (
        <Typography variant="body2">{params.value?.toFixed(1)} GB</Typography>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 130,
      renderCell: (params: GridRenderCellParams<OrgRow, string>) => {
        try {
          return (
            <Typography variant="body2" color="text.secondary">
              {format(parseISO(params.value!), 'MMM d, yyyy')}
            </Typography>
          );
        } catch {
          return <Typography variant="body2" color="text.secondary">{params.value}</Typography>;
        }
      },
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<OrgRow>) => (
        <RowActions row={params.row} onAction={handleAction} />
      ),
    },
  ];

  return (
    <Box>
      <DataGrid
        rows={filteredRows}
        columns={columns}
        loading={isLoading}
        rowCount={filteredRows.length}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        autoHeight
        sx={{
          '& .MuiDataGrid-cell': { py: 1 },
          '& .MuiDataGrid-columnHeaders': { bgcolor: 'background.default' },
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
        }}
      />

      {/* Delete confirmation dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Organization</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete{' '}
            <strong>{deleteTarget?.name}</strong>? This action cannot be undone
            and will remove all projects, documents, and data.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default OrgList;
