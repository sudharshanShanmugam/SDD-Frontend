import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Fab,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Alert,
  Card,
  IconButton,
  Divider,
  Drawer,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requirementsApi } from '@/api';
import { documentsApi } from '@/api/documents';
import { useUIStore } from '@store/uiStore';
import type { GroupTopicsResult } from '@/api/requirements';
import {
  Add, ViewList, TableChart, DoneAll, AutoAwesome, AccountTree, Refresh, DeleteSweep,
  Edit, Delete, Save, Cancel as CancelIcon, Close,
  CheckCircle, Block, RateReview, HourglassEmpty, MergeType, ChevronRight,
} from '@mui/icons-material';
import { ButtonGroup } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import RequirementCard, { Requirement } from '../components/RequirementCard';
import RequirementFilters, { RequirementFilterState } from '../components/RequirementFilters';
import RequirementMatrix from '../components/RequirementMatrix';
import AIExtractionPanel from '../components/AIExtractionPanel';

/* ─── Defaults ───────────────────────────────────────────────────── */
const initialFilters: RequirementFilterState = {
  search: '',
  types: [],
  priorities: [],
  statuses: [],
  minConfidence: 0,
};

const emptyForm = {
  title: '',
  description: '',
  type: 'functional' as Requirement['type'],
  priority: 'medium' as Requirement['priority'],
  acceptance_criteria: '',
};

/* ─── Stat pill component ────────────────────────────────────────── */
const StatPill: React.FC<{ label: string; count: number; color: string; bg: string; onClick?: () => void }> = ({
  label, count, color, bg, onClick,
}) => (
  <Box
    onClick={onClick}
    sx={{
      px: 2, py: 1, borderRadius: 2, bgcolor: bg, cursor: onClick ? 'pointer' : 'default',
      display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 72,
      transition: 'opacity 0.15s',
      '&:hover': onClick ? { opacity: 0.8 } : {},
    }}
  >
    <Typography variant="h6" fontWeight={800} sx={{ color, lineHeight: 1.2 }}>{count}</Typography>
    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{label}</Typography>
  </Box>
);

/* ─── Inline requirement row (used inside GroupCard) ───────────── */

const TYPE_COLORS: Record<string, string> = {
  functional: '#6366f1', non_functional: '#f59e0b', constraint: '#ef4444', business: '#10b981',
};
const PRI_COLORS: Record<string, string> = {
  critical: '#ef4444', high: '#f97316', medium: '#6366f1', low: '#94a3b8',
};
const PRI_EMOJI: Record<string, string> = {
  critical: '🔴', high: '🟠', medium: '🔵', low: '⚪',
};
const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  draft:       { color: '#64748b', bg: '#f1f5f9', label: 'Draft' },
  in_progress: { color: '#3b82f6', bg: '#eff6ff', label: 'In Review' },
  approved:    { color: '#10b981', bg: '#f0fdf4', label: 'Accepted' },
  rejected:    { color: '#ef4444', bg: '#fef2f2', label: 'Rejected' },
};

/* ─── Compact row inside GroupCard ─────────────────────────────── */

const RequirementRow: React.FC<{
  req: Requirement;
  index: number;
  onOpen: (req: Requirement) => void;
}> = ({ req, index, onOpen }) => {
  const typeColor = TYPE_COLORS[req.type] ?? '#6366f1';
  const _defSt    = { color: '#64748b', bg: '#f1f5f9', label: 'Draft' };
  const statusSt  = STATUS_STYLE[req.status] ?? _defSt;

  return (
    <Box
      onClick={() => onOpen(req)}
      sx={{
        display: 'flex', alignItems: 'center', gap: 1, px: 1.75, py: 1.1,
        cursor: 'pointer', transition: 'background-color 0.12s',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      {/* Number */}
      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem', minWidth: 18, flexShrink: 0, fontWeight: 600 }}>
        {index + 1}.
      </Typography>

      {/* Type chip */}
      <Box sx={{ px: 0.65, py: 0.1, borderRadius: 0.75, flexShrink: 0, bgcolor: typeColor + '18', color: typeColor, fontSize: '0.58rem', fontWeight: 700, border: `1px solid ${typeColor}30` }}>
        {req.type.replace('_', ' ')}
      </Box>

      {/* Priority emoji */}
      <Typography variant="caption" sx={{ flexShrink: 0, fontSize: '0.68rem' }}>
        {PRI_EMOJI[req.priority]}
      </Typography>

      {/* Title */}
      <Typography variant="body2" sx={{ flex: 1, minWidth: 0, fontWeight: 500, fontSize: '0.84rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {req.title}
      </Typography>

      {/* Status */}
      <Box sx={{ px: 0.8, py: 0.2, borderRadius: 0.75, flexShrink: 0, bgcolor: statusSt.bg, color: statusSt.color, fontSize: '0.6rem', fontWeight: 700 }}>
        {statusSt.label}
      </Box>

      {/* Chevron */}
      <ChevronRight sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />
    </Box>
  );
};

/* ─── Requirement detail drawer ─────────────────────────────────── */

const RequirementDetailDrawer: React.FC<{
  req: Requirement | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Requirement>) => void;
  onDelete: (id: string) => void;
}> = ({ req, onClose, onUpdate, onDelete }) => {
  const [editing,   setEditing]   = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc,  setEditDesc]  = useState('');
  const [editAC,    setEditAC]    = useState('');

  // Sync edit state when req changes
  React.useEffect(() => {
    if (req) {
      setEditTitle(req.title);
      setEditDesc(req.description);
      setEditAC(req.acceptanceCriteria ?? '');
      setEditing(false);
    }
  }, [req?.id]);

  if (!req) return null;

  const typeColor     = TYPE_COLORS[req.type]     ?? '#6366f1';
  const priColor      = PRI_COLORS[req.priority]  ?? '#6366f1';
  const _defSt        = { color: '#64748b', bg: '#f1f5f9', label: 'Draft' };
  const statusSt      = STATUS_STYLE[req.status]  ?? _defSt;
  const isConsolidated = req.tags?.includes('consolidated') ?? false;
  const mergedTag     = req.tags?.find((t) => t.startsWith('merged:'));
  const mergedCnt     = mergedTag ? parseInt(mergedTag.split(':')[1] ?? '0', 10) : null;

  const criteria = (req.acceptanceCriteria ?? '').split(/\n|;\s*/).map((s) => s.trim()).filter(Boolean);

  const handleSave = () => {
    onUpdate(req.id, { title: editTitle, description: editDesc, acceptanceCriteria: editAC });
    setEditing(false);
  };
  const handleStatus = (s: Requirement['status']) => onUpdate(req.id, { status: s });

  return (
    <Drawer
      anchor="right"
      open={!!req}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100vw', sm: 520 }, display: 'flex', flexDirection: 'column' } }}
    >
      {/* Header */}
      <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Badges row */}
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.7rem', bgcolor: 'action.hover', px: 0.85, py: 0.25, borderRadius: 0.75, color: 'text.secondary' }}>
              {req.reqId}
            </Typography>
            <Box sx={{ px: 0.75, py: 0.2, borderRadius: 0.75, bgcolor: typeColor + '18', color: typeColor, fontSize: '0.62rem', fontWeight: 700, border: `1px solid ${typeColor}30` }}>
              {req.type.replace('_', ' ')}
            </Box>
            <Box sx={{ px: 0.75, py: 0.2, borderRadius: 0.75, bgcolor: priColor + '18', color: priColor, fontSize: '0.62rem', fontWeight: 700 }}>
              {PRI_EMOJI[req.priority]} {req.priority}
            </Box>
            <Box sx={{ px: 0.75, py: 0.2, borderRadius: 0.75, bgcolor: statusSt.bg, color: statusSt.color, fontSize: '0.62rem', fontWeight: 700 }}>
              {statusSt.label}
            </Box>
            {isConsolidated && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, px: 0.65, py: 0.2, borderRadius: 0.75, bgcolor: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }}>
                <MergeType sx={{ fontSize: 11 }} />
                <Typography variant="caption" fontWeight={800} sx={{ fontSize: '0.6rem', lineHeight: 1 }}>×{mergedCnt ?? '?'}</Typography>
              </Box>
            )}
          </Box>
          {/* Title */}
          <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.3, fontSize: '1.05rem' }}>
            {req.title}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ flexShrink: 0, mt: 0.25 }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>

      {/* Body — scrollable */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5 }}>
        {editing ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField value={editTitle} onChange={(e) => setEditTitle(e.target.value)} fullWidth label="Title" size="small" autoFocus />
            <TextField value={editDesc}  onChange={(e) => setEditDesc(e.target.value)}  fullWidth label="Requirement" size="small" multiline rows={4} />
            <TextField
              value={editAC} onChange={(e) => setEditAC(e.target.value)}
              fullWidth label="Acceptance Criteria" size="small" multiline rows={6}
              placeholder={"New slots shall inherit the latest configured slot limit.\nExisting slots shall retain their current slot limits.\nChanges shall take effect immediately for newly created slots."}
              helperText="One criterion per line"
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" startIcon={<Save fontSize="small" />} onClick={handleSave} sx={{ borderRadius: 2 }}>Save</Button>
              <Button variant="outlined" startIcon={<CancelIcon fontSize="small" />} onClick={() => { setEditing(false); setEditTitle(req.title); setEditDesc(req.description); setEditAC(req.acceptanceCriteria ?? ''); }} sx={{ borderRadius: 2 }}>Cancel</Button>
            </Box>
          </Box>
        ) : (
          <>
            {/* Requirement section */}
            {req.description && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 0.8, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', mb: 0.75 }}>
                  Requirement
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.75, color: 'text.primary', fontSize: '0.9rem' }}>
                  {req.description}
                </Typography>
              </Box>
            )}

            {/* Acceptance Criteria section */}
            {criteria.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 0.8, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', mb: 1 }}>
                  Acceptance Criteria
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {criteria.map((c, i) => {
                    const lc   = c.toLowerCase();
                    const kw   = lc.startsWith('given') ? 'given' : lc.startsWith('when') ? 'when' : lc.startsWith('then') ? 'then' : null;
                    const rest = kw ? c.slice(kw.length).replace(/^[\s,]+/, '') : c;

                    return kw ? (
                      <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <Box sx={{ minWidth: 46, textAlign: 'center', px: 0.6, py: 0.25, borderRadius: 0.75, flexShrink: 0, mt: '1px', bgcolor: kw === 'given' ? '#eff6ff' : kw === 'when' ? '#fef9c3' : '#f0fdf4', color: kw === 'given' ? '#2563eb' : kw === 'when' ? '#a16207' : '#16a34a', fontSize: '0.6rem', fontWeight: 800, lineHeight: 1.5, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                          {kw}
                        </Box>
                        <Typography variant="body2" sx={{ lineHeight: 1.65, color: '#374151', fontSize: '0.875rem' }}>{rest}</Typography>
                      </Box>
                    ) : (
                      <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <Typography sx={{ color: '#6366f1', fontSize: '1rem', lineHeight: 1.4, flexShrink: 0, mt: '-1px' }}>•</Typography>
                        <Typography variant="body2" sx={{ lineHeight: 1.65, color: '#374151', fontSize: '0.875rem' }}>{c}</Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Footer actions */}
      {!editing && (
        <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          {req.status !== 'approved' && req.status !== 'rejected' && (
            <>
              {req.status === 'draft' && (
                <Button size="small" variant="outlined" startIcon={<RateReview sx={{ fontSize: 14 }} />} onClick={() => handleStatus('in_progress')} sx={{ borderRadius: 2, textTransform: 'none' }}>
                  Send for Review
                </Button>
              )}
              <Button size="small" variant="contained" color="success" startIcon={<CheckCircle sx={{ fontSize: 14 }} />} onClick={() => handleStatus('approved')} sx={{ borderRadius: 2, textTransform: 'none' }}>
                Accept
              </Button>
              <Button size="small" variant="outlined" color="error" startIcon={<Block sx={{ fontSize: 14 }} />} onClick={() => handleStatus('rejected')} sx={{ borderRadius: 2, textTransform: 'none' }}>
                Reject
              </Button>
            </>
          )}
          {(req.status === 'approved' || req.status === 'rejected') && (
            <Button size="small" variant="outlined" startIcon={<HourglassEmpty sx={{ fontSize: 14 }} />} onClick={() => handleStatus('draft')} sx={{ borderRadius: 2, textTransform: 'none', color: 'text.secondary' }}>
              Reset to Draft
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => setEditing(true)} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
              <Edit sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => { onDelete(req.id); onClose(); }} sx={{ border: '1px solid', borderColor: 'error.light', borderRadius: 1.5 }}>
              <Delete sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Drawer>
  );
};

/* ─── Single group card (contains N requirement rows) ───────────── */

const GroupCard: React.FC<{
  epicId: string;
  topic: string;
  reqs: Requirement[];
  onOpen: (req: Requirement) => void;
}> = ({ epicId, topic, reqs, onOpen }) => {
  const approved     = reqs.filter((r) => r.status === 'approved').length;
  const highestPri   = reqs.some((r) => r.priority === 'critical') ? 'critical'
    : reqs.some((r) => r.priority === 'high') ? 'high'
    : reqs.some((r) => r.priority === 'medium') ? 'medium' : 'low';
  const leftColor    = PRI_COLORS[highestPri] ?? '#6366f1';
  const pct          = reqs.length > 0 ? Math.round((approved / reqs.length) * 100) : 0;

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2, borderLeft: `4px solid ${leftColor}`,
        overflow: 'hidden',
        '&:hover': { boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
        transition: 'box-shadow 0.15s',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1.75, py: 1.25, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#6366f1' + '08' }}>
        <Box sx={{ px: 0.9, py: 0.25, borderRadius: 0.75, bgcolor: '#6366f1', color: 'white', fontSize: '0.65rem', fontWeight: 800, fontFamily: 'monospace', flexShrink: 0 }}>
          {epicId}
        </Box>
        <Typography variant="body2" fontWeight={800} sx={{ flex: 1, fontSize: '0.875rem' }}>{topic}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{approved}/{reqs.length} accepted</Typography>
        {/* Mini progress bar */}
        <Box sx={{ width: 48, height: 4, borderRadius: 2, bgcolor: 'action.selected', overflow: 'hidden', flexShrink: 0 }}>
          <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: '#10b981', borderRadius: 2 }} />
        </Box>
      </Box>

      {/* Requirement rows */}
      {reqs.map((req, idx) => (
        <Box key={req.id}>
          <RequirementRow req={req} index={idx} onOpen={onOpen} />
          {idx < reqs.length - 1 && <Divider sx={{ mx: 1.75 }} />}
        </Box>
      ))}
    </Card>
  );
};

/* ─── Grouped requirement cards ─────────────────────────────────── */

interface GroupedCardsProps {
  filtered: Requirement[];
  requirements: Requirement[];
  onUpdate: (id: string, updates: Partial<Requirement>) => void;
  onDelete: (id: string) => void;
  onOpenAdd: () => void;
  projectId: string | undefined;
}

const GroupedRequirementCards: React.FC<GroupedCardsProps> = ({
  filtered, requirements, onUpdate, onDelete, onOpenAdd, projectId,
}) => {
  const navigate = useNavigate();
  const [openReq, setOpenReq] = useState<Requirement | null>(null);

  const { groupMap, ungrouped } = useMemo(() => {
    const map = new Map<string, { topic: string; reqs: Requirement[] }>();
    const plain: Requirement[] = [];
    for (const req of filtered) {
      const groupTag = req.tags?.find((t) => t.startsWith('group:'));
      if (groupTag) {
        const topic = groupTag.slice(6);
        if (!map.has(topic)) map.set(topic, { topic, reqs: [] });
        map.get(topic)!.reqs.push(req);
      } else {
        plain.push(req);
      }
    }
    return { groupMap: map, ungrouped: plain };
  }, [filtered]);

  const hasGroups = groupMap.size > 0;

  if (filtered.length === 0 && requirements.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>No requirements yet</Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
          Add requirements manually or extract them automatically from a document using AI.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="contained" startIcon={<Add />} onClick={onOpenAdd} sx={{ borderRadius: 2 }}>Add manually</Button>
          <Button variant="outlined" onClick={() => navigate(`/projects/${projectId}/documents`)} sx={{ borderRadius: 2 }}>Go to Documents →</Button>
        </Box>
      </Box>
    );
  }

  if (filtered.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="body1" color="text.secondary">No requirements match your current filters.</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {hasGroups ? (
          <>
            {[...groupMap.entries()].map(([topic, { reqs }], idx) => (
              <GroupCard
                key={topic}
                epicId={`E${idx + 1}`}
                topic={topic}
                reqs={reqs}
                onOpen={(req) => setOpenReq(req)}
              />
            ))}
            {ungrouped.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700, letterSpacing: 0.6, display: 'block', mb: 1, pl: 0.25 }}>
                  UNGROUPED
                </Typography>
                {ungrouped.map((req) => (
                  <RequirementCard
                    key={req.id}
                    requirement={req}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    selected={false}
                    onSelect={() => setOpenReq(req)}
                  />
                ))}
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {filtered.map((req) => (
              <RequirementCard
                key={req.id}
                requirement={req}
                onUpdate={onUpdate}
                onDelete={onDelete}
                selected={false}
                onSelect={() => setOpenReq(req)}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Detail drawer — slides in from the right when a requirement row is clicked */}
      <RequirementDetailDrawer
        req={openReq}
        onClose={() => setOpenReq(null)}
        onUpdate={(id, updates) => {
          onUpdate(id, updates);
          // Keep the drawer open but reflect latest data via query invalidation
        }}
        onDelete={(id) => {
          onDelete(id);
          setOpenReq(null);
        }}
      />
    </>
  );
};

/* ─── Page ───────────────────────────────────────────────────────── */
const RequirementsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast }     = useUIStore();
  const [view,    setView]    = useState<'cards' | 'matrix'>('cards');
  const [filters, setFilters] = useState<RequirementFilterState>(initialFilters);
  const [dialogOpen,         setDialogOpen]         = useState(false);
  const [confirmApprove,     setConfirmApprove]     = useState(false);
  const [groupOpen,          setGroupOpen]          = useState(false);
  const [groupResult,        setGroupResult]        = useState<GroupTopicsResult | null>(null);
  const [clearDialogOpen,    setClearDialogOpen]    = useState(false);
  const [regenDialogOpen,    setRegenDialogOpen]    = useState(false);
  const [regenProgress,      setRegenProgress]      = useState<string>('');
  const [form,            setForm]            = useState(emptyForm);
  const [formError,       setFormError]       = useState('');
  const queryClient = useQueryClient();

  /* ── Data ── */
  const { data, isLoading } = useQuery({
    queryKey: ['requirements', projectId],
    queryFn:  () => requirementsApi.list(projectId!),
    enabled:  !!projectId,
    refetchOnWindowFocus: true,
  });

  // Interceptor converts {items:[]} → {data:[], meta:{}}
  const rawItems: any[] = (data as any)?.data ?? (data as any)?.items ?? [];
  const requirements: Requirement[] = rawItems.map((r: any) => ({
    id:                  String(r.id),
    reqId:               r.reqId ?? r.req_number ?? r.id,
    title:               r.title ?? '',
    description:         r.description ?? '',
    type:                (['functional','non_functional','constraint','business'].includes(r.type) ? r.type : 'functional') as Requirement['type'],
    priority:            (['critical','high','medium','low'].includes(r.priority) ? r.priority : 'medium') as Requirement['priority'],
    status:              (['draft','approved','rejected','in_progress'].includes(r.status) ? r.status : 'draft') as Requirement['status'],
    confidence:          typeof r.confidence === 'number' ? r.confidence : 0,
    acceptanceCriteria:  r.acceptanceCriteria ?? r.acceptance_criteria ?? '',
    source:              r.source ?? undefined,
    tags:                Array.isArray(r.tags) ? r.tags : [],
    createdAt:           r.createdAt ?? r.created_at ?? '',
  }));

  /* ── Mutations ── */
  const { mutate: updateReq } = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Requirement> }) =>
      requirementsApi.patch(id, updates as any),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['requirements', projectId] }),
  });

  const { mutate: deleteReq } = useMutation({
    mutationFn: (id: string) => requirementsApi.delete(id),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['requirements', projectId] }),
  });

  const { mutate: approveAll, isPending: approvingAll } = useMutation({
    mutationFn: (ids: string[]) => requirementsApi.bulkApprove(ids),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['requirements', projectId] });
      setConfirmApprove(false);
    },
  });

  const { mutate: groupTopics, isPending: grouping } = useMutation({
    mutationFn: () => requirementsApi.groupTopics(projectId!),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['requirements', projectId] });
      setGroupResult(result);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? 'Grouping failed');
    },
  });

  const { mutate: clearAll, isPending: clearing } = useMutation({
    mutationFn: () => requirementsApi.clear(projectId!),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['requirements', projectId] });
      setClearDialogOpen(false);
      toast.success(`Cleared ${result.deleted} requirement${result.deleted !== 1 ? 's' : ''}`);
    },
    onError: () => toast.error('Failed to clear requirements'),
  });

  const { mutate: regenerate, isPending: regenerating } = useMutation({
    mutationFn: async () => {
      // 1. Fetch all project documents
      const docsResp = await documentsApi.list(projectId!);
      const docs: any[] = (docsResp as any)?.data ?? (docsResp as any)?.items ?? [];
      if (docs.length === 0) throw new Error('No documents found — upload a document first to extract requirements.');

      // 2. Clear existing requirements
      setRegenProgress('Clearing existing requirements…');
      await requirementsApi.clear(projectId!);

      // 3. Re-extract from each document
      let total = 0;
      for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        setRegenProgress(`Extracting from "${doc.name ?? doc.filename ?? `Document ${i + 1}`}" (${i + 1}/${docs.length})…`);
        const result: any = await documentsApi.extractRequirements(doc.id, projectId!);
        total += result?.requirements_extracted ?? result?.requirements?.length ?? 0;
      }
      return { total, docCount: docs.length };
    },
    onSuccess: ({ total, docCount }) => {
      queryClient.invalidateQueries({ queryKey: ['requirements', projectId] });
      setRegenDialogOpen(false);
      setRegenProgress('');
      toast.success(`Regenerated ${total} requirements from ${docCount} document${docCount !== 1 ? 's' : ''}`);
    },
    onError: (err: unknown) => {
      setRegenDialogOpen(false);
      setRegenProgress('');
      const msg = (err as Error)?.message ?? 'Regeneration failed';
      toast.error(msg);
    },
  });

  const { mutate: createReq, isPending: creating } = useMutation({
    mutationFn: (payload: typeof emptyForm) =>
      requirementsApi.create(projectId!, {
        title:              payload.title,
        description:        payload.description,
        type:               payload.type as any,
        priority:           payload.priority as any,
        acceptanceCriteria: payload.acceptance_criteria ? [payload.acceptance_criteria] : [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements', projectId] });
      setDialogOpen(false);
      setForm(emptyForm);
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err?.message ?? 'Failed to create requirement');
    },
  });

  /* ── Filtering ── */
  const filtered = useMemo(() => {
    return requirements.filter((r) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!r.title.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false;
      }
      if (filters.types.length      > 0 && !filters.types.includes(r.type))         return false;
      if (filters.priorities.length > 0 && !filters.priorities.includes(r.priority)) return false;
      if (filters.statuses.length   > 0 && !filters.statuses.includes(r.status))     return false;
      if (r.confidence < filters.minConfidence) return false;
      return true;
    });
  }, [requirements, filters]);

  /* ── Stats helpers ── */
  const stats = useMemo(() => ({
    total:       requirements.length,
    draft:       requirements.filter((r) => r.status === 'draft').length,
    inProgress:  requirements.filter((r) => r.status === 'in_progress').length,
    approved:    requirements.filter((r) => r.status === 'approved').length,
    rejected:    requirements.filter((r) => r.status === 'rejected').length,
  }), [requirements]);

  /* ── Submit ── */
  const handleSubmit = () => {
    if (!form.title.trim())       { setFormError('Title is required');       return; }
    if (!form.description.trim()) { setFormError('Description is required'); return; }
    setFormError('');
    createReq(form);
  };

  const openAdd = () => { setForm(emptyForm); setFormError(''); setDialogOpen(true); };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

      {/* ────────── Left: Filters ────────── */}
      <Box sx={{ width: 250, flexShrink: 0, borderRight: '1px solid', borderColor: 'divider', p: 2, overflowY: 'auto' }}>
        <RequirementFilters
          filters={filters}
          onChange={setFilters}
          totalCount={requirements.length}
          filteredCount={filtered.length}
          requirements={requirements}
        />
      </Box>

      {/* ────────── Center: Main content ────────── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
            <Box>
              <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }}>Requirements</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {filtered.length !== requirements.length
                  ? `Showing ${filtered.length} of ${requirements.length} requirements`
                  : `${requirements.length} requirement${requirements.length !== 1 ? 's' : ''} total`}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>

              {/* View toggle — icon-only */}
              <ButtonGroup size="small" variant="outlined" sx={{ '& .MuiButton-root': { px: 1.25 } }}>
                <Tooltip title="Card view">
                  <Button
                    variant={view === 'cards' ? 'contained' : 'outlined'}
                    onClick={() => setView('cards')}
                  >
                    <ViewList fontSize="small" />
                  </Button>
                </Tooltip>
                <Tooltip title="Matrix view">
                  <Button
                    variant={view === 'matrix' ? 'contained' : 'outlined'}
                    onClick={() => setView('matrix')}
                  >
                    <TableChart fontSize="small" />
                  </Button>
                </Tooltip>
              </ButtonGroup>

              {/* Secondary icon-only actions */}
              <Tooltip title="Clear all requirements" placement="bottom" arrow>
                <span>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={() => setClearDialogOpen(true)}
                    disabled={clearing || regenerating || stats.total === 0}
                    sx={{ minWidth: 0, px: 1.25, borderRadius: 2 }}
                  >
                    {clearing
                      ? <CircularProgress size={14} color="inherit" />
                      : <DeleteSweep fontSize="small" />}
                  </Button>
                </span>
              </Tooltip>

              <Tooltip title="Re-extract from all project documents" placement="bottom" arrow>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setRegenDialogOpen(true)}
                  disabled={regenerating || clearing}
                  sx={{ minWidth: 0, px: 1.25, borderRadius: 2 }}
                >
                  {regenerating
                    ? <CircularProgress size={14} color="inherit" />
                    : <Refresh fontSize="small" />}
                </Button>
              </Tooltip>

              {/* Group Topics — tags requirements by feature area, enables E#-US# story numbering */}
              {stats.total >= 2 && (
                <Tooltip
                  title="AI groups requirements by feature area — keeps them individual, enables E1-US1 story numbering"
                  placement="bottom"
                  arrow
                >
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={grouping ? <CircularProgress size={14} color="inherit" /> : <AccountTree />}
                    onClick={() => setGroupOpen(true)}
                    disabled={grouping}
                    sx={{ borderRadius: 2, fontSize: '0.75rem', px: 1.5 }}
                  >
                    {grouping ? 'Grouping…' : 'Group Topics'}
                  </Button>
                </Tooltip>
              )}

              {/* Accept All — primary action */}
              {stats.total > 0 && stats.approved < stats.total && (
                <Button
                  variant="contained"
                  size="small"
                  color="success"
                  startIcon={approvingAll ? <CircularProgress size={14} color="inherit" /> : <DoneAll />}
                  onClick={() => setConfirmApprove(true)}
                  disabled={approvingAll}
                  sx={{ borderRadius: 2, fontSize: '0.75rem', px: 1.5 }}
                >
                  {approvingAll ? 'Accepting…' : 'Accept All'}
                </Button>
              )}

              <Button
                variant="contained"
                size="small"
                startIcon={<Add />}
                onClick={openAdd}
                sx={{ borderRadius: 2, fontSize: '0.75rem', px: 1.5 }}
              >
                Add
              </Button>
            </Box>
          </Box>

          {/* Status stats row */}
          {requirements.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <StatPill label="Total"     count={stats.total}      color="#1e293b" bg="#f1f5f9" />
              <StatPill label="Draft"     count={stats.draft}      color="#64748b" bg="#f8fafc"
                onClick={() => setFilters((f) => ({ ...f, statuses: ['draft'] }))} />
              <StatPill label="In Review" count={stats.inProgress} color="#3b82f6" bg="#eff6ff"
                onClick={() => setFilters((f) => ({ ...f, statuses: ['in_progress'] }))} />
              <StatPill label="Approved"  count={stats.approved}   color="#10b981" bg="#f0fdf4"
                onClick={() => setFilters((f) => ({ ...f, statuses: ['approved'] }))} />
              <StatPill label="Rejected"  count={stats.rejected}   color="#ef4444" bg="#fef2f2"
                onClick={() => setFilters((f) => ({ ...f, statuses: ['rejected'] }))} />
            </Box>
          )}
        </Box>

        {/* Content area */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          {view === 'cards' ? (
            <GroupedRequirementCards
              filtered={filtered}
              requirements={requirements}
              onUpdate={(id, updates) => updateReq({ id, updates })}
              onDelete={deleteReq}
              onOpenAdd={openAdd}
              projectId={projectId}
            />
          ) : (
            <Box sx={{ height: '100%' }}>
              <RequirementMatrix requirements={filtered} onRowClick={(_r) => {}} />
            </Box>
          )}
        </Box>
      </Box>

      {/* ────────── Right: Overview panel ────────── */}
      <Box sx={{ width: 300, flexShrink: 0, borderLeft: '1px solid', borderColor: 'divider', p: 2, overflowY: 'auto' }}>
        <AIExtractionPanel requirements={requirements} />
      </Box>

      {/* FAB */}
      <Tooltip title="Add Requirement" placement="left">
        <Fab
          color="primary"
          size="medium"
          sx={{ position: 'fixed', bottom: 32, right: 328 }}
          onClick={openAdd}
        >
          <Add />
        </Fab>
      </Tooltip>

      {/* ── Accept All Confirmation Dialog ── */}
      <Dialog
        open={confirmApprove}
        onClose={() => !approvingAll && setConfirmApprove(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 0.5 }}>
          Accept all requirements?
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 1.5, borderRadius: 2 }}>
            This will mark <strong>{stats.total - stats.approved}</strong> requirement{stats.total - stats.approved !== 1 ? 's' : ''} as <strong>Accepted</strong> in one go.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Breakdown being accepted:
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {stats.draft > 0 && (
              <Box sx={{ px: 1, py: 0.4, borderRadius: 1, bgcolor: '#f1f5f9', fontSize: '0.78rem', fontWeight: 600 }}>
                {stats.draft} Draft
              </Box>
            )}
            {stats.inProgress > 0 && (
              <Box sx={{ px: 1, py: 0.4, borderRadius: 1, bgcolor: '#eff6ff', color: '#3b82f6', fontSize: '0.78rem', fontWeight: 600 }}>
                {stats.inProgress} In Review
              </Box>
            )}
            {stats.rejected > 0 && (
              <Box sx={{ px: 1, py: 0.4, borderRadius: 1, bgcolor: '#fef2f2', color: '#ef4444', fontSize: '0.78rem', fontWeight: 600 }}>
                {stats.rejected} Rejected
              </Box>
            )}
          </Box>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1.5 }}>
            You can always revert individual requirements back to Draft afterwards.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setConfirmApprove(false)}
            color="inherit"
            disabled={approvingAll}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={approvingAll ? <CircularProgress size={14} color="inherit" /> : <DoneAll />}
            disabled={approvingAll}
            onClick={() => approveAll(requirements.filter(r => r.status !== 'approved').map(r => r.id))}
            sx={{ borderRadius: 2 }}
          >
            {approvingAll ? 'Accepting…' : `Accept ${stats.total - stats.approved}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Add Requirement Dialog ── */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 0.5 }}>
          Add Requirement
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400, mt: 0.25 }}>
            Describe what the system must do, how it must perform, or a business rule.
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1.5 }}>
            <TextField
              label="Title"
              required
              fullWidth
              size="small"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. User must be able to log in with email and password"
              error={!!formError && !form.title.trim()}
              helperText="A short, clear statement of the requirement"
            />

            <TextField
              label="Description"
              required
              fullWidth
              multiline
              rows={3}
              size="small"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="The system shall allow users to authenticate using…"
              error={!!formError && !form.description.trim()}
              helperText="Provide enough detail for a developer to implement this"
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  label="Type"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as Requirement['type'] }))}
                >
                  <MenuItem value="functional">Functional — what the system does</MenuItem>
                  <MenuItem value="non_functional">Non-Functional — how it performs</MenuItem>
                  <MenuItem value="business">Business — goals and rules</MenuItem>
                  <MenuItem value="constraint">Constraint — limitations</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  label="Priority"
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Requirement['priority'] }))}
                >
                  <MenuItem value="critical">🔴 Critical — must have</MenuItem>
                  <MenuItem value="high">🟠 High — important</MenuItem>
                  <MenuItem value="medium">🔵 Medium — should have</MenuItem>
                  <MenuItem value="low">⚪ Low — nice to have</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TextField
              label="Acceptance Criteria (optional)"
              fullWidth
              multiline
              rows={3}
              size="small"
              value={form.acceptance_criteria}
              onChange={(e) => setForm((f) => ({ ...f, acceptance_criteria: e.target.value }))}
              placeholder={"Given a registered user\nWhen they enter valid credentials\nThen they are redirected to the dashboard"}
              helperText="Define when this requirement is considered complete (Given / When / Then format)"
            />

            {formError && (
              <Typography variant="caption" color="error">{formError}</Typography>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={creating}
            sx={{ borderRadius: 2 }}
          >
            {creating ? 'Saving…' : 'Add Requirement'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Clear Confirmation Dialog ── */}
      <Dialog
        open={clearDialogOpen}
        onClose={() => !clearing && setClearDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteSweep color="error" />
          Clear all requirements?
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 2 }}>
            This will permanently delete all <strong>{stats.total}</strong> requirement{stats.total !== 1 ? 's' : ''}, including approved ones.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            This cannot be undone. Use <strong>Regenerate</strong> instead if you want to re-extract from your documents.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setClearDialogOpen(false)} color="inherit" sx={{ borderRadius: 2 }} disabled={clearing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={clearing ? <CircularProgress size={14} color="inherit" /> : <DeleteSweep />}
            disabled={clearing}
            onClick={() => clearAll()}
            sx={{ borderRadius: 2 }}
          >
            {clearing ? 'Clearing…' : `Clear ${stats.total}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Regenerate Confirmation Dialog ── */}
      <Dialog
        open={regenDialogOpen}
        onClose={() => !regenerating && setRegenDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Refresh color="primary" />
          Regenerate Requirements?
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 1.5, borderRadius: 2 }}>
            This will <strong>clear all {stats.total} existing requirement{stats.total !== 1 ? 's' : ''}</strong> and
            re-extract fresh ones from your project documents.
          </Alert>
          {regenerating && regenProgress ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">{regenProgress}</Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              The AI will re-read all uploaded documents and extract requirements from scratch.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setRegenDialogOpen(false)} color="inherit" sx={{ borderRadius: 2 }} disabled={regenerating}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={regenerating ? <CircularProgress size={14} color="inherit" /> : <Refresh />}
            disabled={regenerating}
            onClick={() => regenerate()}
            sx={{ borderRadius: 2 }}
          >
            {regenerating ? 'Regenerating…' : 'Regenerate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Group Topics Confirmation Dialog ── */}
      <Dialog
        open={groupOpen && !groupResult}
        onClose={() => !grouping && setGroupOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountTree color="primary" />
          Group Requirements by Topic?
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 1.5, borderRadius: 2 }}>
            AI will analyse <strong>all {stats.total}</strong> requirements and tag them by feature area.
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            What happens:
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5, color: 'text.secondary' }}>
            <Typography component="li" variant="body2" sx={{ mb: 0.4 }}>
              Requirements are <strong>kept individual</strong> — nothing is merged or deleted
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.4 }}>
              Each requirement is tagged with its <strong>feature group</strong> (e.g. "Login", "Booking")
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.4 }}>
              The requirements view shows them in <strong>collapsible topic sections</strong>
            </Typography>
            <Typography component="li" variant="body2">
              "Generate Stories" will produce <strong>E1-US1, E1-US2…</strong> per epic group
            </Typography>
          </Box>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1.5 }}>
            Takes 15–40 seconds. Can be re-run anytime to re-group.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setGroupOpen(false)} color="inherit" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={grouping ? <CircularProgress size={14} color="inherit" /> : <AutoAwesome />}
            disabled={grouping}
            onClick={() => groupTopics()}
            sx={{ borderRadius: 2 }}
          >
            {grouping ? 'Grouping…' : 'Group Topics'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Group Topics Result Dialog ── */}
      <Dialog
        open={!!groupResult}
        onClose={() => { setGroupResult(null); setGroupOpen(false); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome color="success" />
          Requirements Grouped!
        </DialogTitle>
        <DialogContent>
          {groupResult?.message && !groupResult.groups_created ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>{groupResult.message}</Alert>
          ) : (
            <>
              <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                <strong>{groupResult?.tagged}</strong> requirement{groupResult?.tagged !== 1 ? 's' : ''} tagged
                across <strong>{groupResult?.groups_created}</strong> topic group{groupResult?.groups_created !== 1 ? 's' : ''}.
                {' '}Generate stories to get <strong>E1-US1, E1-US2…</strong> numbering.
              </Alert>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {(groupResult?.groups ?? []).map((g, i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1.5, py: 0.75, borderRadius: 1, bgcolor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ px: 0.75, py: 0.15, borderRadius: 0.75, bgcolor: '#6366f1', color: 'white', fontSize: '0.62rem', fontWeight: 800, fontFamily: 'monospace' }}>
                        {g.epic_id}
                      </Box>
                      <Typography variant="body2" fontWeight={600} color="#1e40af">{g.topic}</Typography>
                    </Box>
                    <Typography variant="caption" color="#1e40af" fontWeight={700}>{g.count} requirement{g.count !== 1 ? 's' : ''}</Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            variant="contained"
            onClick={() => { setGroupResult(null); setGroupOpen(false); }}
            sx={{ borderRadius: 2 }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RequirementsPage;
