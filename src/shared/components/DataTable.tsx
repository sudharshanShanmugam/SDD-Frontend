import React, { useCallback, useMemo, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import {
  type ColDef,
  type ColGroupDef,
  type GridReadyEvent,
  type GridApi,
  type RowSelectionOptions,
  type IDatasource,
  type IGetRowsParams,
  ModuleRegistry,
  AllCommunityModule,
} from 'ag-grid-community'
import {
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  Skeleton,
  Stack,
  type SxProps,
  type Theme,
} from '@mui/material'
import { Download, Filter, RefreshCw, Search, X } from 'lucide-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule])

// ============================================================
// Types
// ============================================================

export interface DataTableProps<TData = Record<string, unknown>> {
  /** Column definitions */
  columnDefs: Array<ColDef<TData> | ColGroupDef<TData>>
  /** Row data for client-side mode */
  rowData?: TData[]
  /** Server-side datasource for infinite scrolling */
  datasource?: IDatasource
  /** Total row count (for server-side) */
  totalRows?: number
  /** Row identifier field */
  rowId?: string
  /** Enable row selection */
  rowSelection?: boolean | RowSelectionOptions<TData>
  /** Callback when selection changes */
  onSelectionChanged?: (rows: TData[]) => void
  /** Page size for server-side pagination */
  pageSize?: number
  /** Show toolbar (search, filters, export) */
  showToolbar?: boolean
  /** Table title */
  title?: string
  /** Toolbar actions (custom buttons) */
  toolbarActions?: React.ReactNode
  /** Show export button */
  showExport?: boolean
  /** Show refresh button */
  showRefresh?: boolean
  /** Loading state */
  loading?: boolean
  /** Empty state message */
  emptyMessage?: string
  /** Grid height */
  height?: number | string
  /** Called when search changes */
  onSearch?: (query: string) => void
  /** Called when refresh clicked */
  onRefresh?: () => void
  /** Called when export clicked */
  onExport?: () => void
  /** Container sx */
  sx?: SxProps<Theme>
  /** Extra AG Grid props */
  gridProps?: Record<string, unknown>
}

// ============================================================
// Loading Skeleton
// ============================================================

function TableSkeleton({ rows = 8 }: { rows?: number }): React.JSX.Element {
  return (
    <Stack spacing={0.5} sx={{ px: 1, py: 0.5 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rectangular"
          height={48}
          sx={{ borderRadius: 1, opacity: 1 - i * 0.1 }}
        />
      ))}
    </Stack>
  )
}

// ============================================================
// Empty State
// ============================================================

function EmptyState({ message }: { message: string }): React.JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 240,
        gap: 1,
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          bgcolor: 'background.subtle',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.disabled',
        }}
      >
        <Filter size={22} />
      </Box>
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  )
}

// ============================================================
// Data Table Component
// ============================================================

export function DataTable<TData = Record<string, unknown>>({
  columnDefs,
  rowData,
  datasource,
  totalRows,
  rowId = 'id',
  rowSelection,
  onSelectionChanged,
  pageSize = 50,
  showToolbar = true,
  title,
  toolbarActions,
  showExport = true,
  showRefresh = false,
  loading = false,
  emptyMessage = 'No data to display',
  height = 520,
  onSearch,
  onRefresh,
  onExport,
  sx,
  gridProps = {},
}: DataTableProps<TData>): React.JSX.Element {
  const gridRef = useRef<AgGridReact<TData>>(null)
  const [gridApi, setGridApi] = useState<GridApi | null>(null)
  const [searchValue, setSearchValue] = useState('')

  // ── Default column def ─────────────────────────────────────

  const defaultColDef = useMemo<ColDef<TData>>(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      minWidth: 80,
      suppressMovable: false,
      flex: 1,
    }),
    [],
  )

  // ── Grid ready ────────────────────────────────────────────

  const onGridReady = useCallback(
    (params: GridReadyEvent<TData>): void => {
      setGridApi(params.api)
      if (datasource) {
        params.api.setGridOption('datasource', datasource)
      }
    },
    [datasource],
  )

  // ── Selection ─────────────────────────────────────────────

  const handleSelectionChanged = useCallback((): void => {
    if (!gridApi || !onSelectionChanged) return
    const selectedRows = gridApi.getSelectedRows()
    onSelectionChanged(selectedRows)
  }, [gridApi, onSelectionChanged])

  // ── Search ────────────────────────────────────────────────

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const value = e.target.value
      setSearchValue(value)

      if (onSearch) {
        onSearch(value)
      } else if (gridApi) {
        // Client-side quick filter
        gridApi.setGridOption('quickFilterText', value)
      }
    },
    [gridApi, onSearch],
  )

  const handleClearSearch = useCallback((): void => {
    setSearchValue('')
    if (onSearch) {
      onSearch('')
    } else if (gridApi) {
      gridApi.setGridOption('quickFilterText', '')
    }
  }, [gridApi, onSearch])

  // ── Export ────────────────────────────────────────────────

  const handleExport = useCallback((): void => {
    if (onExport) {
      onExport()
    } else if (gridApi) {
      gridApi.exportDataAsCsv({
        fileName: `export-${new Date().toISOString().slice(0, 10)}.csv`,
      })
    }
  }, [gridApi, onExport])

  // ── Refresh ───────────────────────────────────────────────

  const handleRefresh = useCallback((): void => {
    onRefresh?.()
    if (datasource && gridApi) {
      gridApi.setGridOption('datasource', datasource)
    }
  }, [gridApi, datasource, onRefresh])

  // ── Get row id ────────────────────────────────────────────

  const getRowId = useCallback(
    (params: { data: TData }) => {
      return String((params.data as Record<string, unknown>)[rowId] ?? Math.random())
    },
    [rowId],
  )

  const isEmpty = !loading && (rowData?.length === 0 || (totalRows !== undefined && totalRows === 0))

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        ...sx,
      }}
    >
      {/* Toolbar */}
      {showToolbar && (
        <Toolbar
          variant="dense"
          sx={{
            px: 2,
            gap: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
            minHeight: '48px !important',
          }}
        >
          {title && (
            <Typography variant="subtitle2" fontWeight={600} sx={{ mr: 1 }}>
              {title}
              {totalRows !== undefined && (
                <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                  ({totalRows.toLocaleString()})
                </Typography>
              )}
            </Typography>
          )}

          {/* Search */}
          <TextField
            size="small"
            placeholder="Search..."
            value={searchValue}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={14} />
                </InputAdornment>
              ),
              endAdornment: searchValue ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch} edge="end">
                    <X size={14} />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            }}
            sx={{ width: 220 }}
          />

          <Box sx={{ flex: 1 }} />

          {/* Custom toolbar actions */}
          {toolbarActions}

          {/* Refresh */}
          {showRefresh && (
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={handleRefresh}>
                <RefreshCw size={16} />
              </IconButton>
            </Tooltip>
          )}

          {/* Export */}
          {showExport && (
            <Tooltip title="Export CSV">
              <IconButton size="small" onClick={handleExport}>
                <Download size={16} />
              </IconButton>
            </Tooltip>
          )}
        </Toolbar>
      )}

      {/* Grid Area */}
      <Box sx={{ position: 'relative', flex: 1, height }}>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              bgcolor: 'background.paper',
            }}
          >
            <TableSkeleton />
          </Box>
        )}

        {isEmpty && !loading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <EmptyState message={emptyMessage} />
          </Box>
        )}

        <div
          className="ag-theme-alpine"
          style={{
            width: '100%',
            height: typeof height === 'number' ? height : '100%',
          }}
        >
          <AgGridReact<TData>
            ref={gridRef}
            columnDefs={columnDefs}
            rowData={rowData}
            defaultColDef={defaultColDef}
            rowSelection={rowSelection as RowSelectionOptions | 'single' | 'multiple' | undefined}
            onSelectionChanged={onSelectionChanged ? handleSelectionChanged : undefined}
            onGridReady={onGridReady}
            getRowId={getRowId}
            rowModelType={datasource ? 'infinite' : 'clientSide'}
            cacheBlockSize={pageSize}
            infiniteInitialRowCount={pageSize}
            animateRows
            suppressCellFocus
            suppressRowClickSelection={!!rowSelection}
            headerHeight={40}
            rowHeight={48}
            suppressLoadingOverlay
            suppressNoRowsOverlay
            {...gridProps}
          />
        </div>
      </Box>
    </Box>
  )
}

export default DataTable
