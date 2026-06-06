import React, { useMemo, useRef, useState } from 'react';
import { Box, Typography, Chip, Button, IconButton, TextField, InputAdornment } from '@mui/material';
import { Add, Search, Edit, Delete, PlayArrow } from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';

export type TestType = 'unit' | 'integration' | 'e2e' | 'manual' | 'performance';
export type TestStatus = 'draft' | 'active' | 'passed' | 'failed' | 'skipped' | 'blocked';

export interface TestCase {
  id: string;
  testId: string;
  title: string;
  type: TestType;
  status: TestStatus;
  priority: 'critical' | 'high' | 'medium' | 'low';
  storyId?: string;
  automated: boolean;
  stepCount: number;
  lastRun?: string;
  duration?: number;
  assignee?: string;
  tags?: string[];
}

interface TestCaseTableProps {
  tests?: TestCase[];
  onEdit?: (test: TestCase) => void;
  onDelete?: (id: string) => void;
  onRun?: (test: TestCase) => void;
}

const statusColors: Record<TestStatus, 'default' | 'success' | 'error' | 'warning' | 'primary' | 'info'> = {
  draft: 'default',
  active: 'primary',
  passed: 'success',
  failed: 'error',
  skipped: 'warning',
  blocked: 'error',
};

const TestCaseTable: React.FC<TestCaseTableProps> = ({
  tests = [],
  onEdit,
  onDelete,
  onRun,
}) => {
  const gridRef = useRef<AgGridReact>(null);
  const [search, setSearch] = useState('');

  const columnDefs: ColDef<TestCase>[] = useMemo(() => [
    {
      field: 'testId',
      headerName: 'ID',
      width: 100,
      pinned: 'left',
      cellStyle: { fontFamily: 'monospace', fontWeight: 700 },
    },
    { field: 'title', headerName: 'Test Case', flex: 2, minWidth: 240 },
    {
      field: 'type',
      headerName: 'Type',
      width: 120,
      cellRenderer: (p: { value: TestType }) => (
        <Chip
          label={p.value}
          size="small"
          sx={{ height: 20, fontSize: '0.65rem', textTransform: 'capitalize' }}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      cellRenderer: (p: { value: TestStatus }) => (
        <Chip
          label={p.value}
          size="small"
          color={statusColors[p.value]}
          sx={{ height: 20, fontSize: '0.65rem' }}
        />
      ),
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 100,
      cellRenderer: (p: { value: string }) => (
        <Chip
          label={p.value}
          size="small"
          color={p.value === 'critical' ? 'error' : p.value === 'high' ? 'warning' : 'default'}
          sx={{ height: 20, fontSize: '0.65rem' }}
        />
      ),
    },
    {
      field: 'automated',
      headerName: 'Auto',
      width: 80,
      cellRenderer: (p: { value: boolean }) => (
        <Chip
          label={p.value ? 'Auto' : 'Manual'}
          size="small"
          color={p.value ? 'success' : 'default'}
          variant={p.value ? 'filled' : 'outlined'}
          sx={{ height: 20, fontSize: '0.65rem' }}
        />
      ),
    },
    { field: 'stepCount', headerName: 'Steps', width: 80, type: 'numericColumn' },
    { field: 'storyId', headerName: 'Story', width: 100 },
    {
      field: 'duration',
      headerName: 'Duration',
      width: 100,
      valueFormatter: (p) => p.value ? `${(p.value / 1000).toFixed(1)}s` : '—',
    },
    { field: 'assignee', headerName: 'Assignee', width: 120 },
    {
      field: 'id',
      headerName: 'Actions',
      width: 120,
      pinned: 'right',
      sortable: false,
      cellRenderer: (p: { data: TestCase }) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={() => onRun?.(p.data)} color="primary">
            <PlayArrow sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton size="small" onClick={() => onEdit?.(p.data)}>
            <Edit sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton size="small" onClick={() => onDelete?.(p.data.id)} color="error">
            <Delete sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      ),
    },
  ], [onEdit, onDelete, onRun]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2" fontWeight={600}>
          Test Cases ({tests.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            placeholder="Search..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 200 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            }}
          />
          <Button variant="contained" startIcon={<Add />} size="small" sx={{ borderRadius: 2 }}>
            Add Test
          </Button>
        </Box>
      </Box>

      <Box
        className="ag-theme-material"
        sx={{
          flex: 1,
          '& .ag-root-wrapper': { borderRadius: 2, border: '1px solid', borderColor: 'divider' },
        }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={tests}
          columnDefs={columnDefs}
          quickFilterText={search}
          rowHeight={48}
          defaultColDef={{ sortable: true, resizable: true, filter: true }}
          pagination
          paginationPageSize={20}
          animateRows
          rowSelection="multiple"
        />
      </Box>
    </Box>
  );
};

export default TestCaseTable;
