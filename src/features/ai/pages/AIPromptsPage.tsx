import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Paper,
  TextField,
  InputAdornment,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  ContentCopy,
  PlayArrow,
  Close,
  AutoAwesome,
  Science,
  Save,
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@store/uiStore';
import { apiClient } from '@/api/client';

// ─── Types ────────────────────────────────────────────────────────────────

type PromptType =
  | 'EXTRACTION'
  | 'EPIC'
  | 'STORY'
  | 'SPRINT'
  | 'QA'
  | 'SPEC';

type AIModelId =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'claude-3-5-sonnet'
  | 'claude-3-haiku'
  | 'gemini-1.5-pro';

interface PromptTemplate {
  id: string;
  name: string;
  type: PromptType;
  model: AIModelId;
  temperature: number;
  maxTokens: number;
  content: string;
  systemContext: string;
  variables: string[];
  version: number;
  isActive: boolean;
  lastModified: string;
  lastModifiedBy: string;
}

type SortField = 'name' | 'type' | 'model' | 'lastModified';
type SortOrder = 'asc' | 'desc';

// ─── Config maps ─────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  PromptType,
  { label: string; color: string }
> = {
  EXTRACTION: { label: 'Extraction',  color: '#6366f1' },
  EPIC:       { label: 'Epic',        color: '#3b82f6' },
  STORY:      { label: 'Story',       color: '#10b981' },
  SPRINT:     { label: 'Sprint',      color: '#f59e0b' },
  QA:         { label: 'QA',          color: '#ef4444' },
  SPEC:       { label: 'Spec',        color: '#8b5cf6' },
};

// ─── API ──────────────────────────────────────────────────────────────────

// Maps a backend row → frontend PromptTemplate
function rowToTemplate(row: Record<string, unknown>): PromptTemplate {
  let meta: Record<string, unknown> = {}
  try { meta = JSON.parse(String(row['description'] ?? '{}')) } catch { /* ignore */ }
  return {
    id:               String(row['id'] ?? ''),
    name:             String(row['name'] ?? ''),
    type:             (String(row['workflow_type'] ?? 'STORY').toUpperCase()) as PromptType,
    model:            String(meta['model'] ?? 'gpt-4o') as AIModelId,
    temperature:      Number(meta['temperature'] ?? 0.2),
    maxTokens:        Number(meta['maxTokens'] ?? 4096),
    content:          String(row['prompt_text'] ?? ''),
    systemContext:    String(meta['systemContext'] ?? ''),
    variables:        Array.isArray(row['variables']) ? (row['variables'] as string[]) : [],
    version:          Number(meta['version'] ?? 1),
    isActive:         Boolean(row['is_active'] ?? true),
    lastModified:     String(row['created_at'] ?? new Date().toISOString()),
    lastModifiedBy:   String(row['created_by'] ?? '—'),
  }
}

async function fetchTemplates(projectId?: string): Promise<PromptTemplate[]> {
  const res = await apiClient.get('/ai/prompts', { params: projectId ? { project_id: projectId } : {} })
  const rows: Record<string, unknown>[] = Array.isArray(res.data) ? res.data : (res.data as any)?.items ?? []
  return rows.map(rowToTemplate)
}

async function saveTemplate(template: PromptTemplate): Promise<PromptTemplate> {
  const meta = JSON.stringify({
    model: template.model,
    temperature: template.temperature,
    maxTokens: template.maxTokens,
    systemContext: template.systemContext,
    version: template.version + 1,
  })
  const payload = {
    name:          template.name,
    workflow_type: template.type.toLowerCase(),
    prompt_text:   template.content,
    variables:     template.variables,
    is_active:     template.isActive,
    description:   meta,
  }
  const res = await apiClient.post('/ai/prompts', payload)
  return rowToTemplate({ ...(res.data as Record<string, unknown>), prompt_text: template.content, variables: template.variables })
}

async function deleteTemplate(id: string): Promise<void> {
  await apiClient.delete(`/ai/prompts/${id}`)
}

// ─── Test output panel ────────────────────────────────────────────────────

interface TestModalProps {
  open: boolean;
  template: PromptTemplate;
  onClose: () => void;
}

const TestModal: React.FC<TestModalProps> = ({ open, template, onClose }) => {
  const [testInput, setTestInput] = useState('');
  const [output, setOutput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [tab, setTab] = useState(0);

  const runTest = async () => {
    if (!testInput.trim()) return;
    setStreaming(true);
    setOutput('');
    setTab(1);
    setStreaming(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Science color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Test Prompt: {template.name}
          </Typography>
          <Chip label={`v${template.version}`} size="small" color="primary" />
        </Box>
        <IconButton size="small" onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', height: 520 }}>
          {/* Input panel */}
          <Box
            sx={{
              width: '45%',
              borderRight: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={700}>
                Sample Input
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Provide values for template variables
              </Typography>
            </Box>

            <Box sx={{ p: 2, flex: 1 }}>
              {template.variables.map((v) => (
                <TextField
                  key={v}
                  label={v.replace(/_/g, ' ')}
                  multiline
                  minRows={2}
                  maxRows={5}
                  fullWidth
                  size="small"
                  sx={{ mb: 1.5 }}
                  placeholder={`Enter ${v}...`}
                  onChange={(e) => setTestInput(e.target.value)}
                />
              ))}
              {template.variables.length === 0 && (
                <TextField
                  label="Input text"
                  multiline
                  minRows={6}
                  fullWidth
                  size="small"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Enter test input..."
                />
              )}
            </Box>
          </Box>

          {/* Output panel */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box
              sx={{
                px: 2,
                py: 0.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Tabs
                value={tab}
                onChange={(_, v: number) => setTab(v)}
                sx={{ '& .MuiTab-root': { minHeight: 40, py: 0 } }}
              >
                <Tab label="Output" />
                <Tab label="Rendered Prompt" />
              </Tabs>
              {streaming && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
                  <CircularProgress size={12} />
                  <Typography variant="caption" color="text.secondary">
                    Streaming…
                  </Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              {tab === 0 ? (
                <Editor
                  value={output || '// Output will appear here after running test'}
                  language="json"
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 12,
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    lineNumbers: 'off',
                  }}
                  height="100%"
                />
              ) : (
                <Editor
                  value={template.content}
                  language="markdown"
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 12,
                    wordWrap: 'on',
                    lineNumbers: 'off',
                  }}
                  height="100%"
                />
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={
            streaming ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <PlayArrow />
            )
          }
          onClick={runTest}
          disabled={streaming}
        >
          Run Test
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Edit dialog ──────────────────────────────────────────────────────────

interface EditDialogProps {
  open: boolean;
  template: PromptTemplate | null;
  onClose: () => void;
  onSave: (t: PromptTemplate) => void;
  saving: boolean;
}

const EditDialog: React.FC<EditDialogProps> = ({
  open,
  template,
  onClose,
  onSave,
  saving,
}) => {
  const [local, setLocal] = useState<PromptTemplate | null>(template);

  React.useEffect(() => {
    setLocal(template);
  }, [template]);

  if (!local) return null;

  const updateField = <K extends keyof PromptTemplate>(
    key: K,
    value: PromptTemplate[K],
  ) => setLocal((prev) => (prev ? { ...prev, [key]: value } : prev));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Edit color="primary" />
          <Typography variant="h6" fontWeight={700}>
            {local.id.startsWith('new-') ? 'Create Prompt Template' : `Edit: ${local.name}`}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      <Divider />

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Metadata row */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 2,
            }}
          >
            <TextField
              label="Name"
              value={local.name}
              onChange={(e) => updateField('name', e.target.value)}
              size="small"
              fullWidth
            />

            <FormControl size="small" fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={local.type}
                label="Type"
                onChange={(e) => updateField('type', e.target.value as PromptType)}
              >
                {(Object.keys(TYPE_CONFIG) as PromptType[]).map((t) => (
                  <MenuItem key={t} value={t}>
                    {TYPE_CONFIG[t].label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>Model</InputLabel>
              <Select
                value={local.model}
                label="Model"
                onChange={(e) => updateField('model', e.target.value as AIModelId)}
              >
                {(
                  [
                    'gpt-4o',
                    'gpt-4o-mini',
                    'gpt-4-turbo',
                    'claude-3-5-sonnet',
                    'claude-3-haiku',
                    'gemini-1.5-pro',
                  ] as AIModelId[]
                ).map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                Temperature: {local.temperature}
              </Typography>
              <Slider
                value={local.temperature}
                onChange={(_, v) => updateField('temperature', v as number)}
                min={0}
                max={2}
                step={0.05}
                size="small"
                marks={[
                  { value: 0, label: '0' },
                  { value: 1, label: '1' },
                  { value: 2, label: '2' },
                ]}
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>

          {/* System context */}
          <TextField
            label="System Context"
            value={local.systemContext}
            onChange={(e) => updateField('systemContext', e.target.value)}
            size="small"
            fullWidth
            multiline
            minRows={2}
          />

          {/* Prompt content editor */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>
              Prompt Content
            </Typography>
            <Paper
              variant="outlined"
              sx={{ borderRadius: 1, overflow: 'hidden', height: 360 }}
            >
              <Editor
                value={local.content}
                language="markdown"
                theme="vs-dark"
                onChange={(val) => updateField('content', val ?? '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  folding: true,
                  formatOnPaste: true,
                }}
                height="100%"
              />
            </Paper>
            <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
              Use {'{{variable_name}}'} for template variables
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={
            saving ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Save />
            )
          }
          onClick={() => onSave(local)}
          disabled={saving || !local.name.trim()}
        >
          Save Template
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────

const AIPromptsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const { toast } = useUIStore();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<PromptType | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<SortField>('lastModified');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [editTarget, setEditTarget] = useState<PromptTemplate | null>(null);
  const [testTarget, setTestTarget] = useState<PromptTemplate | null>(null);

  // ── Fetch templates ──
  const {
    data: templates = [],
    isLoading,
    isError,
  } = useQuery<PromptTemplate[]>({
    queryKey: ['prompt-templates', projectId],
    queryFn: () => fetchTemplates(projectId),
  });

  // ── Save mutation ──
  const saveMutation = useMutation({
    mutationFn: saveTemplate,
    onSuccess: (saved) => {
      queryClient.setQueryData<PromptTemplate[]>(
        ['prompt-templates', projectId],
        (prev = []) =>
          prev.some((t) => t.id === saved.id)
            ? prev.map((t) => (t.id === saved.id ? saved : t))
            : [...prev, saved],
      );
      setEditTarget(null);
      toast.success('Prompt template saved!');
    },
    onError: () => toast.error('Failed to save template'),
  });

  // ── Delete ──
  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: (_, id) => {
      queryClient.setQueryData<PromptTemplate[]>(
        ['prompt-templates', projectId],
        (prev = []) => prev.filter((t) => t.id !== id),
      );
      toast.success('Template deleted');
    },
    onError: () => toast.error('Failed to delete template'),
  });

  const handleDelete = (id: string) => deleteMutation.mutate(id);

  // ── Duplicate ──
  const handleDuplicate = (t: PromptTemplate) => {
    const copy: PromptTemplate = {
      ...t,
      id: `new-${Date.now()}`,
      name: `${t.name} (Copy)`,
      version: 1,
      lastModified: new Date().toISOString(),
    };
    setEditTarget(copy);
  };

  // ── Sorting ──
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // ── Filter & sort ──
  const displayed = templates
    .filter((t) => {
      const matchSearch =
        !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.type.toLowerCase().includes(search.toLowerCase()) ||
        t.model.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'ALL' || t.type === typeFilter;
      return matchSearch && matchType;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'type') cmp = a.type.localeCompare(b.type);
      else if (sortField === 'model') cmp = a.model.localeCompare(b.model);
      else cmp = a.lastModified.localeCompare(b.lastModified);
      return sortOrder === 'asc' ? cmp : -cmp;
    });

  // ─── Loading skeleton ───────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 2 }} />
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rectangular" height={52} sx={{ mb: 1, borderRadius: 1 }} />
        ))}
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load prompt templates.</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* ── Header + toolbar ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesome color="primary" />
            <Box>
              <Typography variant="h6" fontWeight={800}>
                AI Prompt Templates
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Manage prompts used across the SDLC pipeline
              </Typography>
            </Box>
          </Box>

          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            {/* Search */}
            <TextField
              placeholder="Search templates…"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: 220 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: 18, color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            {/* Type filter */}
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as PromptType | 'ALL')}
                displayEmpty
              >
                <MenuItem value="ALL">All types</MenuItem>
                {(Object.keys(TYPE_CONFIG) as PromptType[]).map((t) => (
                  <MenuItem key={t} value={t}>
                    {TYPE_CONFIG[t].label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Create button */}
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() =>
                setEditTarget({
                  id: `new-${Date.now()}`,
                  name: '',
                  type: 'STORY',
                  model: 'gpt-4o',
                  temperature: 0.2,
                  maxTokens: 4096,
                  content: '',
                  systemContext: '',
                  variables: [],
                  version: 1,
                  isActive: true,
                  lastModified: new Date().toISOString(),
                  lastModifiedBy: 'Me',
                })
              }
              sx={{ fontWeight: 700 }}
            >
              New Template
            </Button>
          </Box>
        </Box>
      </motion.div>

      {/* ── Table ── */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <TableContainer>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: 260 }}>
                  <TableSortLabel
                    active={sortField === 'name'}
                    direction={sortField === 'name' ? sortOrder : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, width: 120 }}>
                  <TableSortLabel
                    active={sortField === 'type'}
                    direction={sortField === 'type' ? sortOrder : 'asc'}
                    onClick={() => handleSort('type')}
                  >
                    Type
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, width: 160 }}>
                  <TableSortLabel
                    active={sortField === 'model'}
                    direction={sortField === 'model' ? sortOrder : 'asc'}
                    onClick={() => handleSort('model')}
                  >
                    Model
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, width: 90 }}>Temp.</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 90 }}>Version</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  <TableSortLabel
                    active={sortField === 'lastModified'}
                    direction={sortField === 'lastModified' ? sortOrder : 'asc'}
                    onClick={() => handleSort('lastModified')}
                  >
                    Last Modified
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, width: 80 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, width: 120 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              <AnimatePresence>
                {displayed.map((template, idx) => {
                  const typeCfg = TYPE_CONFIG[template.type];
                  return (
                    <motion.tr
                      key={template.id}
                      component="tr"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, delay: idx * 0.03 }}
                      style={{ display: 'table-row' }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {template.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={typeCfg.label}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            bgcolor: typeCfg.color + '18',
                            color: typeCfg.color,
                            border: `1px solid ${typeCfg.color}40`,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {template.model}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" fontWeight={600}>
                          {template.temperature}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`v${template.version}`}
                          size="small"
                          color="primary"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(template.lastModified).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={template.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={template.isActive ? 'success' : 'default'}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <Tooltip title="Test prompt">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => setTestTarget(template)}
                            >
                              <Science fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => setEditTarget(template)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Duplicate">
                            <IconButton
                              size="small"
                              onClick={() => handleDuplicate(template)}
                            >
                              <ContentCopy fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(template.id)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>

              {displayed.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No templates match your filter</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* ── Edit Dialog ── */}
      <EditDialog
        open={!!editTarget}
        template={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={(t) => saveMutation.mutate(t)}
        saving={saveMutation.isPending}
      />

      {/* ── Test Dialog ── */}
      {testTarget && (
        <TestModal
          open={!!testTarget}
          template={testTarget}
          onClose={() => setTestTarget(null)}
        />
      )}
    </Box>
  );
};

export default AIPromptsPage;
