import React, { useMemo, useRef } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import type { Requirement } from './RequirementCard';

/* ─── Cell renderers ─────────────────────────────────────────────── */

const TypeCell: React.FC<{ value: string }> = ({ value }) => {
  const colors: Record<string, string> = {
    functional:     '#6366f1',
    non_functional: '#f59e0b',
    business:       '#10b981',
    constraint:     '#ef4444',
  };
  const color = colors[value] ?? '#64748b';
  return (
    <Chip
      label={value.replace('_', '-')}
      size="small"
      sx={{
        height: 20, fontSize: '0.62rem', fontWeight: 600,
        bgcolor: color + '18', color,
        border: `1px solid ${color}40`,
        textTransform: 'capitalize',
      }}
    />
  );
};

const PriorityCell: React.FC<{ value: string }> = ({ value }) => {
  const map: Record<string, 'error' | 'warning' | 'primary' | 'default'> = {
    critical: 'error', high: 'warning', medium: 'primary', low: 'default',
  };
  const emoji: Record<string, string> = { critical: '🔴', high: '🟠', medium: '🔵', low: '⚪' };
  return (
    <Chip
      label={`${emoji[value] ?? ''} ${value.charAt(0).toUpperCase() + value.slice(1)}`}
      size="small"
      color={map[value] ?? 'default'}
      sx={{ height: 20, fontSize: '0.62rem' }}
    />
  );
};

const StatusCell: React.FC<{ value: string }> = ({ value }) => {
  const colors: Record<string, string> = {
    approved:    '#10b981',
    in_progress: '#3b82f6',
    draft:       '#64748b',
    rejected:    '#ef4444',
  };
  const labels: Record<string, string> = {
    approved: 'Approved', in_progress: 'In Review', draft: 'Draft', rejected: 'Rejected',
  };
  const color = colors[value] ?? '#64748b';
  return (
    <Box
      sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.5,
        px: 0.75, py: 0.2, borderRadius: 1,
        bgcolor: color + '18', color,
        fontSize: '0.62rem', fontWeight: 600,
      }}
    >
      {labels[value] ?? value}
    </Box>
  );
};

const ConfidenceCell: React.FC<{ value: number }> = ({ value }) => {
  const pct   = Math.round(value * 100);
  const color = pct >= 90 ? '#10b981' : pct >= 70 ? '#f59e0b' : pct === 0 ? '#94a3b8' : '#ef4444';
  if (pct === 0) return <Typography variant="caption" color="text.disabled">—</Typography>;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <Box sx={{ flex: 1, height: 5, borderRadius: 1, bgcolor: 'action.hover', overflow: 'hidden' }}>
        <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: color, borderRadius: 1 }} />
      </Box>
      <Typography variant="caption" sx={{ minWidth: 30, color, fontWeight: 600 }}>{pct}%</Typography>
    </Box>
  );
};

/* ─── Props & row type ───────────────────────────────────────────── */

interface MatrixRow {
  reqId:       string;
  title:       string;
  description: string;
  type:        string;
  priority:    string;
  status:      string;
  confidence:  number;
  tags:        string;
}

interface RequirementMatrixProps {
  requirements: Requirement[];
  onRowClick?: (req: Requirement) => void;
}

/* ─── Component ──────────────────────────────────────────────────── */

const RequirementMatrix: React.FC<RequirementMatrixProps> = ({
  requirements = [],
  onRowClick,
}) => {
  const gridRef = useRef<AgGridReact>(null);

  const rowData: MatrixRow[] = useMemo(
    () => requirements.map((r) => ({
      reqId:       r.reqId,
      title:       r.title,
      description: r.description,
      type:        r.type,
      priority:    r.priority,
      status:      r.status,
      confidence:  r.confidence,
      tags:        (r.tags ?? []).join(', ') || '',
    })),
    [requirements],
  );

  const columnDefs: ColDef[] = useMemo(() => [
    {
      field: 'reqId',
      headerName: 'ID',
      width: 110,
      pinned: 'left',
      cellStyle: { fontFamily: 'monospace', fontWeight: 700, fontSize: '0.75rem' },
      filter: false,
    },
    {
      field: 'title',
      headerName: 'Requirement',
      flex: 2,
      minWidth: 220,
      tooltipField: 'title',
      cellStyle: { fontWeight: 600, fontSize: '0.8rem' },
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 3,
      minWidth: 260,
      tooltipField: 'description',
      cellStyle: { color: '#64748b', fontSize: '0.75rem' },
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 150,
      cellRenderer: (p: { value: string }) => <TypeCell value={p.value} />,
      filter: false,
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 120,
      cellRenderer: (p: { value: string }) => <PriorityCell value={p.value} />,
      filter: false,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      cellRenderer: (p: { value: string }) => <StatusCell value={p.value} />,
      filter: false,
    },
    {
      field: 'confidence',
      headerName: 'AI Confidence',
      width: 150,
      cellRenderer: (p: { value: number }) => <ConfidenceCell value={p.value} />,
      filter: false,
    },
    {
      field: 'tags',
      headerName: 'Tags',
      width: 150,
      cellStyle: { color: '#64748b', fontSize: '0.73rem' },
    },
  ], []);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2" fontWeight={700}>
          Requirements Matrix
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {requirements.length} requirement{requirements.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      <Box
        className="ag-theme-material"
        sx={{
          flex: 1,
          '& .ag-root-wrapper': { borderRadius: 2, border: '1px solid', borderColor: 'divider' },
          '& .ag-header': { bgcolor: 'action.hover' },
          '& .ag-row:hover': { bgcolor: 'primary.main' + '08 !important' },
          '& .ag-cell': { display: 'flex', alignItems: 'center' },
        }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          rowHeight={46}
          headerHeight={42}
          defaultColDef={{ sortable: true, resizable: true, filter: true }}
          onRowClicked={(e) => {
            const orig = requirements.find((r) => r.reqId === e.data?.reqId);
            if (orig) onRowClick?.(orig);
          }}
          rowSelection="single"
          animateRows
          pagination
          paginationPageSize={25}
          suppressCellFocus
          tooltipShowDelay={300}
        />
      </Box>
    </Box>
  );
};

export default RequirementMatrix;
