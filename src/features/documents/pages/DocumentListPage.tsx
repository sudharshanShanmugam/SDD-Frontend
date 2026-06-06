import React, { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '@/api';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  Add,
  Search,
  MoreVert,
  Delete,
  Visibility,
  AutoAwesome,
  Download,
  Refresh,
  WarningAmber,
  FilterAltOff,
  PlayArrow,
  CheckCircle,
  Psychology,
} from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface DocumentRow {
  id: string;
  name: string;
  type: string;
  status: 'processing' | 'done' | 'error' | 'queued';
  uploadedBy: string;
  uploadedAt: string;
  pageCount?: number;
  chunkCount?: number;
  requirementCount?: number;
  sizeMB: number;
}


const StatusCell: React.FC<{ value: DocumentRow['status'] }> = ({ value }) => {
  const colorMap: Record<DocumentRow['status'], 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
    processing: 'primary',
    done: 'success',
    error: 'error',
    queued: 'warning',
  };
  return (
    <Chip
      label={value.charAt(0).toUpperCase() + value.slice(1)}
      size="small"
      color={colorMap[value]}
      sx={{ borderRadius: 1 }}
    />
  );
};

const DocumentListPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const gridRef = useRef<AgGridReact<DocumentRow>>(null);
  const [search, setSearch] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<{ pos: { top: number; left: number }; row: DocumentRow } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DocumentRow | null>(null);
  const queryClient = useQueryClient();

  const { data, refetch } = useQuery({
    queryKey: ['documents', projectId],
    queryFn: () => documentsApi.list(projectId),
    enabled: true,
    refetchOnWindowFocus: true,
  });

  // Map backend DocumentResponse fields → DocumentRow shape
  // Interceptor normalises {items:[]} → {data:[], meta:{}} so check data?.data first
  const rawItems: any[] = (data as any)?.data ?? (data as any)?.items ?? [];
  const docs: DocumentRow[] = rawItems.map((d: any) => ({
    id:               String(d.id),
    name:             d.original_filename ?? d.name ?? '—',
    type:             d.content_type?.split('/').pop()?.replace('vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx')
                        ?.replace('vnd.openxmlformats-officedocument.presentationml.presentation', 'pptx')
                        ?.replace('vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx')
                        ?? d.file_type ?? 'file',
    status:           (['processing', 'done', 'error', 'queued'].includes(d.status) ? d.status
                        : d.status === 'uploaded' ? 'queued'
                        : d.status === 'completed' ? 'done'
                        : d.status === 'processed' ? 'done'
                        : d.status === 'failed' ? 'error'
                        : 'queued') as DocumentRow['status'],
    uploadedBy:       d.uploaded_by ?? d.created_by ?? '—',
    uploadedAt:       d.created_at ?? new Date().toISOString(),
    pageCount:        d.page_count ?? undefined,
    chunkCount:       d.chunk_count ?? undefined,
    requirementCount: d.requirement_count ?? undefined,
    sizeMB:           d.file_size_bytes != null ? Math.round((d.file_size_bytes / (1024 * 1024)) * 100) / 100
                        : d.file_size != null ? Math.round((d.file_size / (1024 * 1024)) * 100) / 100
                        : 0,
  }));

  const { mutate: deleteDoc } = useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents', projectId] }),
  });

  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const { mutate: processDoc } = useMutation({
    mutationFn: (id: string) => {
      setProcessingIds((prev) => new Set(prev).add(id));
      return documentsApi.process(id);
    },
    onSuccess: (_data, id) => {
      setProcessingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (_err, id) => {
      setProcessingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    },
  });

  const unprocessedDocs = docs.filter((d) => d.status === 'queued');
  const processAll = () => unprocessedDocs.forEach((d) => processDoc(d.id));

  // ── Extract Requirements ──────────────────────────────────────────────────
  const [extractingIds, setExtractingIds] = useState<Set<string>>(new Set());
  const [extractResults, setExtractResults] = useState<Record<string, number>>({});

  const { mutate: extractDoc } = useMutation({
    mutationFn: (id: string) => {
      setExtractingIds((prev) => new Set(prev).add(id));
      return documentsApi.extractRequirements(id, projectId);
    },
    onSuccess: (data, id) => {
      setExtractingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
      setExtractResults((prev) => ({ ...prev, [id]: data.requirements_extracted }));
      queryClient.invalidateQueries({ queryKey: ['requirements', projectId] });
    },
    onError: (_err, id) => {
      setExtractingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    },
  });

  const processedDocs = docs.filter((d) => d.status === 'done' && !extractResults[d.id]);
  const extractAll = () => processedDocs.forEach((d) => extractDoc(d.id));
  const totalExtracted = Object.values(extractResults).reduce((a, b) => a + b, 0);

  const columnDefs: ColDef<DocumentRow>[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Document Name',
        flex: 2,
        minWidth: 220,
        cellRenderer: (p: { value: string; data: DocumentRow }) => (
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
            onClick={() => navigate(`/project/${projectId}/documents/${p.data.id}`)}
          >
            <Chip
              label={p.data.type.toUpperCase()}
              size="small"
              sx={{ height: 18, fontSize: '0.65rem', borderRadius: 1 }}
            />
            <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
              {p.value}
            </Typography>
          </Box>
        ),
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 130,
        cellRenderer: (p: { value: DocumentRow['status'] }) => <StatusCell value={p.value} />,
      },
      { field: 'pageCount', headerName: 'Pages', width: 90, type: 'numericColumn' },
      { field: 'chunkCount', headerName: 'Chunks', width: 100, type: 'numericColumn' },
      {
        field: 'requirementCount',
        headerName: 'Requirements',
        width: 130,
        type: 'numericColumn',
        cellRenderer: (p: { value?: number }) =>
          p.value != null ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AutoAwesome sx={{ fontSize: 14, color: 'secondary.main' }} />
              <Typography variant="body2">{p.value}</Typography>
            </Box>
          ) : (
            '—'
          ),
      },
      {
        field: 'sizeMB',
        headerName: 'Size',
        width: 100,
        valueFormatter: (p) => `${p.value} MB`,
      },
      { field: 'uploadedBy', headerName: 'Uploaded By', width: 150 },
      {
        field: 'uploadedAt',
        headerName: 'Uploaded',
        width: 150,
        valueFormatter: (p) => formatDistanceToNow(new Date(p.value), { addSuffix: true }),
      },
      {
        field: 'id',
        headerName: '',
        width: 60,
        pinned: 'right',
        sortable: false,
        cellRenderer: (p: { data: DocumentRow }) => (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setMenuAnchor({ pos: { top: e.clientY, left: e.clientX }, row: p.data });
            }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        ),
      },
    ],
    [navigate, projectId]
  );

  const isFiltered = search.trim().length > 0;

  const handleResetFilters = () => {
    setSearch('');
  };

  const quickFilterText = search;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h4" fontWeight={700}>
                Documents
              </Typography>
              {isFiltered && (
                <Chip
                  label="Filtered"
                  size="small"
                  color="warning"
                  onDelete={handleResetFilters}
                  sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {docs.length} documents • {docs.filter((d) => d.status === 'done').reduce((a, d) => a + (d.requirementCount || 0), 0)} requirements extracted
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              placeholder="Search..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: 220 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')} edge="end">
                      <FilterAltOff fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
            {isFiltered && (
              <Tooltip title="Reset all filters">
                <Button
                  variant="outlined"
                  color="warning"
                  size="small"
                  startIcon={<FilterAltOff fontSize="small" />}
                  onClick={handleResetFilters}
                  sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}
                >
                  Reset
                </Button>
              </Tooltip>
            )}
            <Tooltip title="Refresh">
              <IconButton sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }} onClick={() => void refetch()}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate(`/projects/${projectId}/documents/upload`)}
              sx={{ borderRadius: 2 }}
            >
              Upload
            </Button>
          </Box>
        </Box>
      </motion.div>

      {/* ── Process banner ── */}
      {unprocessedDocs.length > 0 && (
        <Box
          sx={{
            mb: 2, p: 1.5, borderRadius: 2,
            bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesome sx={{ color: 'primary.main', fontSize: 18 }} />
            <Typography variant="body2" fontWeight={600} color="primary.dark">
              {unprocessedDocs.length} document{unprocessedDocs.length > 1 ? 's' : ''} ready to process
            </Typography>
            <Typography variant="caption" color="text.secondary">
              — AI will parse text, chunk content and extract requirements
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            disableElevation
            startIcon={<PlayArrow fontSize="small" />}
            onClick={processAll}
            disabled={processingIds.size > 0}
            sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}
          >
            {processingIds.size > 0 ? 'Processing…' : `Process All`}
          </Button>
        </Box>
      )}

      {/* ── Extract Requirements banner ── */}
      {processedDocs.length > 0 && (
        <Box
          sx={{
            mb: 2, p: 1.5, borderRadius: 2,
            bgcolor: 'secondary.50', border: '1px solid', borderColor: 'secondary.200',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Psychology sx={{ color: 'secondary.main', fontSize: 18 }} />
            <Typography variant="body2" fontWeight={600} color="secondary.dark">
              {processedDocs.length} processed document{processedDocs.length > 1 ? 's' : ''} ready for AI extraction
            </Typography>
            <Typography variant="caption" color="text.secondary">
              — extract requirements, acceptance criteria and priorities
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="secondary"
            size="small"
            disableElevation
            startIcon={<AutoAwesome fontSize="small" />}
            onClick={extractAll}
            disabled={extractingIds.size > 0}
            sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}
          >
            {extractingIds.size > 0 ? 'Extracting…' : 'Extract Requirements'}
          </Button>
        </Box>
      )}

      {/* ── Extraction results badge ── */}
      {totalExtracted > 0 && (
        <Box
          sx={{
            mb: 2, p: 1.5, borderRadius: 2,
            bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle sx={{ color: 'success.main', fontSize: 18 }} />
            <Typography variant="body2" fontWeight={600} color="success.dark">
              {totalExtracted} requirements extracted!
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="success"
            size="small"
            sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}
            onClick={() => navigate(`/projects/${projectId}/requirements`)}
          >
            View Requirements →
          </Button>
        </Box>
      )}

      <Box
        className="ag-theme-material"
        sx={{ flex: 1, '& .ag-root-wrapper': { borderRadius: 2, border: '1px solid', borderColor: 'divider' } }}
      >
        <AgGridReact<DocumentRow>
          ref={gridRef}
          rowData={docs as DocumentRow[]}
          columnDefs={columnDefs}
          quickFilterText={quickFilterText}
          rowHeight={52}
          defaultColDef={{
            sortable: true,
            resizable: true,
            filter: false,
          }}
          pagination
          paginationPageSize={25}
          paginationPageSizeSelector={[10, 25, 50, 100]}
          suppressMovableColumns
          animateRows
        />
      </Box>

      {/* ── Row action menu ── */}
      <Menu
        open={!!menuAnchor}
        onClose={() => setMenuAnchor(null)}
        anchorReference="anchorPosition"
        {...(menuAnchor ? { anchorPosition: menuAnchor.pos } : {})}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      >
        <MenuItem
          onClick={() => {
            navigate(`/projects/${projectId}/documents/${menuAnchor?.row.id}`);
            setMenuAnchor(null);
          }}
        >
          <Visibility fontSize="small" sx={{ mr: 1 }} /> View
        </MenuItem>
        {menuAnchor?.row.status === 'queued' && (
          <MenuItem
            onClick={() => {
              if (menuAnchor) processDoc(menuAnchor.row.id);
              setMenuAnchor(null);
            }}
            sx={{ color: 'primary.main' }}
          >
            <PlayArrow fontSize="small" sx={{ mr: 1 }} /> Process
          </MenuItem>
        )}
        {menuAnchor?.row.status === 'done' && !extractResults[menuAnchor.row.id] && (
          <MenuItem
            onClick={() => {
              if (menuAnchor) extractDoc(menuAnchor.row.id);
              setMenuAnchor(null);
            }}
            sx={{ color: 'secondary.main' }}
          >
            <AutoAwesome fontSize="small" sx={{ mr: 1 }} />
            {extractingIds.has(menuAnchor?.row.id ?? '') ? 'Extracting…' : 'Extract Requirements'}
          </MenuItem>
        )}
        {menuAnchor?.row.id && extractResults[menuAnchor.row.id] != null && (
          <MenuItem disabled>
            <CheckCircle fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
            {extractResults[menuAnchor.row.id]} requirements extracted
          </MenuItem>
        )}
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <Download fontSize="small" sx={{ mr: 1 }} /> Download
        </MenuItem>

        {/* Divider pushes Delete away from safe actions */}
        <Divider sx={{ my: 0.5 }} />

        <MenuItem
          sx={{ color: 'error.main', mt: 0.5 }}
          onClick={() => {
            if (menuAnchor) setConfirmDelete(menuAnchor.row);
            setMenuAnchor(null);
          }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* ── Delete confirmation dialog ── */}
      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
          <WarningAmber color="error" />
          Delete Document
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{' '}
            <strong>{confirmDelete?.name}</strong>?
            <br />
            This will permanently remove the document and all extracted requirements.
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setConfirmDelete(null)}
            color="inherit"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            sx={{ borderRadius: 2 }}
            onClick={() => {
              if (confirmDelete) deleteDoc(confirmDelete.id);
              setConfirmDelete(null);
            }}
          >
            Delete permanently
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentListPage;
