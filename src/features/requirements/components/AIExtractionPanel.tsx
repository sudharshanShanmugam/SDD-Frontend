import React from 'react';
import {
  Box,
  Typography,
  Divider,
  Chip,
  LinearProgress,
  Button,
  Tooltip,
} from '@mui/material';
import {
  AutoAwesome,
  BarChart,
  CheckCircle,
  HourglassEmpty,
  RateReview,
  Block,
  OpenInNew,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import type { Requirement } from './RequirementCard';

/* ─── Props ──────────────────────────────────────────────────────── */
interface AIExtractionPanelProps {
  requirements?: Requirement[];
}

/* ─── Config ─────────────────────────────────────────────────────── */
const TYPE_INFO: { value: string; label: string; color: string }[] = [
  { value: 'functional',     label: 'Functional',     color: '#6366f1' },
  { value: 'non_functional', label: 'Non-Functional',  color: '#f59e0b' },
  { value: 'business',       label: 'Business',        color: '#10b981' },
  { value: 'constraint',     label: 'Constraint',      color: '#ef4444' },
];

const PRIORITY_INFO = [
  { value: 'critical', label: '🔴 Critical', muiColor: 'error'   as const },
  { value: 'high',     label: '🟠 High',     muiColor: 'warning' as const },
  { value: 'medium',   label: '🔵 Medium',   muiColor: 'primary' as const },
  { value: 'low',      label: '⚪ Low',      muiColor: 'default' as const },
];

const STATUS_INFO = [
  { value: 'approved',    label: 'Approved',  icon: <CheckCircle   sx={{ fontSize: 13 }} />, color: '#10b981' },
  { value: 'in_progress', label: 'In Review', icon: <RateReview    sx={{ fontSize: 13 }} />, color: '#3b82f6' },
  { value: 'draft',       label: 'Draft',     icon: <HourglassEmpty sx={{ fontSize: 13 }} />, color: '#64748b' },
  { value: 'rejected',    label: 'Rejected',  icon: <Block         sx={{ fontSize: 13 }} />, color: '#ef4444' },
];

/* ─── Small stat row ─────────────────────────────────────────────── */
const StatRow: React.FC<{ label: string; count: number; total: number; color: string; icon?: React.ReactNode }> = ({
  label, count, total, color, icon,
}) => (
  <Box sx={{ mb: 1.25 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {icon && <Box sx={{ color, display: 'flex' }}>{icon}</Box>}
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      </Box>
      <Typography variant="caption" fontWeight={700} sx={{ color }}>
        {count}
        {total > 0 && <Typography component="span" variant="caption" color="text.disabled"> / {total}</Typography>}
      </Typography>
    </Box>
    <LinearProgress
      variant="determinate"
      value={total > 0 ? (count / total) * 100 : 0}
      sx={{
        height: 5, borderRadius: 1,
        bgcolor: 'action.hover',
        '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 1 },
      }}
    />
  </Box>
);

/* ─── Main component ─────────────────────────────────────────────── */
const AIExtractionPanel: React.FC<AIExtractionPanelProps> = ({ requirements = [] }) => {
  const navigate  = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const total = requirements.length;

  /* counts */
  const byType     = requirements.reduce((a, r) => { a[r.type]     = (a[r.type]     ?? 0) + 1; return a; }, {} as Record<string, number>);
  const byPriority = requirements.reduce((a, r) => { a[r.priority] = (a[r.priority] ?? 0) + 1; return a; }, {} as Record<string, number>);
  const byStatus   = requirements.reduce((a, r) => { a[r.status]   = (a[r.status]   ?? 0) + 1; return a; }, {} as Record<string, number>);

  /* AI-generated count + avg confidence */
  const aiReqs       = requirements.filter((r) => r.confidence > 0);
  const avgConf      = aiReqs.length > 0 ? aiReqs.reduce((s, r) => s + r.confidence, 0) / aiReqs.length : 0;
  const approvedPct  = total > 0 ? Math.round(((byStatus['approved'] ?? 0) / total) * 100) : 0;

  if (total === 0) {
    return (
      <Box>
        {/* Panel header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <BarChart color="primary" />
          <Typography variant="h6" fontWeight={700}>Overview</Typography>
        </Box>

        {/* Empty state */}
        <Box
          sx={{
            textAlign: 'center', py: 5, px: 2,
            bgcolor: 'action.hover', borderRadius: 2,
            border: '2px dashed', borderColor: 'divider',
          }}
        >
          <AutoAwesome sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="body2" fontWeight={600} gutterBottom>
            No requirements yet
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Upload and process a document, then click <strong>Extract Requirements</strong> to automatically identify requirements using AI.
          </Typography>
          <Button
            variant="outlined"
            size="small"
            endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
            onClick={() => navigate(`/projects/${projectId}/documents`)}
            sx={{ borderRadius: 2 }}
          >
            Go to Documents
          </Button>
        </Box>

        {/* How it works */}
        <Box sx={{ mt: 2.5 }}>
          <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ display: 'block', mb: 1.5, letterSpacing: 0.5 }}>
            HOW IT WORKS
          </Typography>
          {[
            { step: '1', text: 'Upload a document (PDF, Word, or plain text)' },
            { step: '2', text: 'Process the document to extract its text content' },
            { step: '3', text: 'Click "Extract Requirements" — AI reads the document and identifies all requirements' },
            { step: '4', text: 'Review, edit, approve or reject each requirement here' },
          ].map(({ step, text }) => (
            <Box key={step} sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Box
                sx={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  bgcolor: 'primary.main', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 700,
                }}
              >
                {step}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>{text}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Panel header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <BarChart color="primary" />
        <Typography variant="h6" fontWeight={700}>Overview</Typography>
      </Box>

      {/* ── Top KPI pills ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
        {[
          { label: 'Total',    value: total,                  color: 'text.primary',  bg: 'action.hover' },
          { label: 'Approved', value: byStatus['approved'] ?? 0, color: '#10b981',    bg: '#f0fdf4' },
          { label: 'AI Confidence', value: `${Math.round(avgConf * 100)}%`, color: '#8b5cf6', bg: '#f5f3ff' },
          { label: 'Approved %', value: `${approvedPct}%`,   color: '#3b82f6',       bg: '#eff6ff' },
        ].map(({ label, value, color, bg }) => (
          <Box key={label} sx={{ bgcolor: bg, borderRadius: 1.5, p: 1.25, textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={800} sx={{ color, lineHeight: 1.2 }}>{value}</Typography>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
          </Box>
        ))}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* ── By Type ── */}
      <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ display: 'block', mb: 1.25, letterSpacing: 0.5 }}>
        BY TYPE
      </Typography>
      {TYPE_INFO.map(({ value, label, color }) => (
        <StatRow key={value} label={label} count={byType[value] ?? 0} total={total} color={color} />
      ))}

      <Divider sx={{ my: 2 }} />

      {/* ── By Priority ── */}
      <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ display: 'block', mb: 1.25, letterSpacing: 0.5 }}>
        BY PRIORITY
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
        {PRIORITY_INFO.map(({ value, label, muiColor }) => {
          const cnt = byPriority[value] ?? 0;
          if (cnt === 0) return null;
          return (
            <Tooltip key={value} title={`${cnt} requirement${cnt !== 1 ? 's' : ''}`} placement="top" arrow>
              <Chip
                label={`${label}  ${cnt}`}
                size="small"
                color={muiColor}
                sx={{ fontSize: '0.65rem', fontWeight: 600 }}
              />
            </Tooltip>
          );
        })}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* ── By Status ── */}
      <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ display: 'block', mb: 1.25, letterSpacing: 0.5 }}>
        BY STATUS
      </Typography>
      {STATUS_INFO.map(({ value, label, icon, color }) => (
        <StatRow key={value} label={label} count={byStatus[value] ?? 0} total={total} color={color} icon={icon} />
      ))}

      <Divider sx={{ my: 2 }} />

      {/* ── AI section ── */}
      <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ display: 'block', mb: 1, letterSpacing: 0.5 }}>
        AI EXTRACTION
      </Typography>
      <Box sx={{ bgcolor: '#faf5ff', borderRadius: 1.5, p: 1.25, mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
          <AutoAwesome sx={{ fontSize: 14, color: '#8b5cf6' }} />
          <Typography variant="caption" fontWeight={700} sx={{ color: '#8b5cf6' }}>
            {aiReqs.length} AI-extracted  ·  avg {Math.round(avgConf * 100)}% confidence
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Requirements extracted from documents using AI are marked with the ✦ icon. Review them carefully before approving.
        </Typography>
      </Box>

      <Button
        variant="outlined"
        size="small"
        fullWidth
        endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
        onClick={() => navigate(`/projects/${projectId}/documents`)}
        sx={{ borderRadius: 2, fontSize: '0.75rem' }}
      >
        Extract more from Documents
      </Button>
    </Box>
  );
};

export default AIExtractionPanel;
