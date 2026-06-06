import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Tooltip,
  Menu,
  MenuItem,
  TextField,
  Button,
  Divider,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Edit,
  MoreVert,
  Delete,
  AutoAwesome,
  Save,
  Cancel,
  CheckCircle,
  HourglassEmpty,
  RateReview,
  Block,
  TaskAlt,
  RadioButtonUnchecked,
  CalendarToday,
  MergeType,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/* ─────────────────────────────── Types ─────────────────────────────── */

export type RequirementType     = 'functional' | 'non_functional' | 'constraint' | 'business';
export type RequirementPriority = 'critical' | 'high' | 'medium' | 'low';
export type RequirementStatus   = 'draft' | 'approved' | 'rejected' | 'in_progress';

export interface Requirement {
  id:                 string;
  reqId:              string;
  title:              string;
  description:        string;
  type:               RequirementType;
  priority:           RequirementPriority;
  status:             RequirementStatus;
  confidence:         number;
  acceptanceCriteria?: string;
  source?:            string;
  chunkId?:           string;
  epicIds?:           string[];
  storyIds?:          string[];
  tags?:              string[];
  createdAt:          string;
}

/* ─────────────────────────────── Config ────────────────────────────── */

const TYPE_CONFIG: Record<RequirementType, { color: string; label: string; hint: string }> = {
  functional:     { color: '#6366f1', label: 'Functional',     hint: 'Describes what the system must do' },
  non_functional: { color: '#f59e0b', label: 'Non-Functional', hint: 'Describes how the system performs' },
  constraint:     { color: '#ef4444', label: 'Constraint',     hint: 'Defines limitations and boundaries' },
  business:       { color: '#10b981', label: 'Business',       hint: 'Defines business goals and rules' },
};

const PRIORITY_CONFIG: Record<RequirementPriority, {
  muiColor: 'error' | 'warning' | 'primary' | 'default'; emoji: string; label: string;
}> = {
  critical: { muiColor: 'error',   emoji: '🔴', label: 'Critical' },
  high:     { muiColor: 'warning', emoji: '🟠', label: 'High'     },
  medium:   { muiColor: 'primary', emoji: '🔵', label: 'Medium'   },
  low:      { muiColor: 'default', emoji: '⚪', label: 'Low'      },
};

const STATUS_CONFIG: Record<RequirementStatus, {
  color: string; bg: string; border: string;
  icon: React.ReactNode; label: string; hint: string;
}> = {
  draft:       { color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1', icon: <HourglassEmpty sx={{ fontSize: 11 }} />, label: 'Draft',     hint: 'Not yet reviewed'      },
  in_progress: { color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd', icon: <RateReview    sx={{ fontSize: 11 }} />, label: 'In Review', hint: 'Awaiting acceptance'    },
  approved:    { color: '#10b981', bg: '#f0fdf4', border: '#6ee7b7', icon: <CheckCircle   sx={{ fontSize: 11 }} />, label: 'Accepted',  hint: 'Accepted and finalised' },
  rejected:    { color: '#ef4444', bg: '#fef2f2', border: '#fca5a5', icon: <Block         sx={{ fontSize: 11 }} />, label: 'Rejected',  hint: 'Rejected — needs rework' },
};

/* ─────────────────────────── Helper: parse AC ──────────────────────── */

/**
 * Splits acceptance criteria text into individual criterion lines.
 * Handles newlines, semicolons, and "Given/When/Then" blocks.
 */
function parseCriteria(text: string): string[] {
  return text
    .split(/\n|;\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Parses a user-story description into its three parts.
 * Handles: "As a [role], I want [action], so that [benefit]."
 */
function parseUserStory(desc: string): { role: string; want: string; benefit: string } | null {
  const trimmed = desc.trimStart();
  if (!/^as an?\s+/i.test(trimmed)) return null;

  const iWantIdx = trimmed.search(/,?\s+i want\s+/i);
  if (iWantIdx === -1) return null;

  const role = trimmed.slice(0, iWantIdx).replace(/^as an?\s+/i, '').trim();
  const afterIWant = trimmed.slice(iWantIdx).replace(/^,?\s+i want\s+/i, '');

  const soThatIdx = afterIWant.search(/,?\s+so that\s+/i);
  if (soThatIdx === -1) {
    return { role, want: afterIWant.replace(/\.\s*$/, '').trim(), benefit: '' };
  }

  const want    = afterIWant.slice(0, soThatIdx).trim();
  const benefit = afterIWant.slice(soThatIdx).replace(/^,?\s+so that\s+/i, '').replace(/\.\s*$/, '').trim();
  return { role, want, benefit };
}

/* ─────────────────────────── Sub-components ───────────────────────── */

/** A single acceptance criterion row */
const CriterionRow: React.FC<{ text: string; done?: boolean }> = ({ text, done = false }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.5 }}>
    {done
      ? <TaskAlt            sx={{ fontSize: 15, color: '#10b981', mt: '1px', flexShrink: 0 }} />
      : <RadioButtonUnchecked sx={{ fontSize: 15, color: '#94a3b8', mt: '1px', flexShrink: 0 }} />
    }
    <Typography variant="caption" sx={{ color: done ? '#374151' : '#64748b', lineHeight: 1.55 }}>
      {text}
    </Typography>
  </Box>
);

/** Labelled section inside expanded card */
const Section: React.FC<{ label: string; children: React.ReactNode; color?: string }> = ({
  label, children, color = '#64748b',
}) => (
  <Box sx={{ mb: 1.75 }}>
    <Typography
      variant="caption"
      sx={{
        display: 'block', mb: 0.75,
        fontWeight: 700, letterSpacing: 0.6, fontSize: '0.62rem',
        color, textTransform: 'uppercase',
      }}
    >
      {label}
    </Typography>
    {children}
  </Box>
);

/* ─────────────────────────── Main component ────────────────────────── */

interface RequirementCardProps {
  requirement: Requirement;
  onUpdate?: (id: string, updates: Partial<Requirement>) => void;
  onDelete?: (id: string) => void;
  selected?: boolean;
  onSelect?: () => void;
}

const RequirementCard: React.FC<RequirementCardProps> = ({
  requirement: req,
  onUpdate,
  onDelete,
  selected,
  onSelect,
}) => {
  const [expanded,   setExpanded]   = useState(false);
  const [editing,    setEditing]    = useState(false);
  const [editTitle,  setEditTitle]  = useState(req.title);
  const [editDesc,   setEditDesc]   = useState(req.description);
  const [editAC,     setEditAC]     = useState(req.acceptanceCriteria ?? '');
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const typeConf   = TYPE_CONFIG[req.type]     ?? TYPE_CONFIG.functional;
  const statusConf = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.draft;
  const priConf    = PRIORITY_CONFIG[req.priority] ?? PRIORITY_CONFIG.medium;

  const criteria       = req.acceptanceCriteria ? parseCriteria(req.acceptanceCriteria) : [];
  const isAI           = req.confidence > 0;
  const pct            = Math.round(req.confidence * 100);
  const isConsolidated = req.tags?.includes('consolidated') ?? false;
  const mergedTag      = req.tags?.find((t) => t.startsWith('merged:'));
  const mergedCount    = mergedTag ? parseInt(mergedTag.split(':')[1] ?? '0', 10) : null;
  const userStory      = isConsolidated ? parseUserStory(req.description) : null;

  const dateLabel  = req.createdAt
    ? new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  /* handlers */
  const handleSave = () => {
    onUpdate?.(req.id, { title: editTitle, description: editDesc, acceptanceCriteria: editAC });
    setEditing(false);
  };
  const handleCancel = () => {
    setEditTitle(req.title);
    setEditDesc(req.description);
    setEditAC(req.acceptanceCriteria ?? '');
    setEditing(false);
  };
  const handleStatus = (s: RequirementStatus) => { onUpdate?.(req.id, { status: s }); setMenuAnchor(null); };

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Card
        variant="outlined"
        sx={{
          borderRadius: 2,
          border: `1px solid`,
          borderColor: selected ? typeConf.color + '80' : 'divider',
          borderLeft: `4px solid ${typeConf.color}`,
          cursor: 'pointer',
          transition: 'box-shadow 0.15s, border-color 0.15s',
          '&:hover': { boxShadow: '0 3px 14px rgba(0,0,0,0.09)' },
          ...(selected && { bgcolor: typeConf.color + '05' }),
        }}
        onClick={onSelect}
      >
        <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>

          {/* ── TOP ROW: badges + controls ────────────────────────── */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1 }}>

            {/* Left: REQ-ID · Type · Priority */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: 'monospace', fontWeight: 800, letterSpacing: 0.4,
                  bgcolor: 'action.hover', px: 0.85, py: 0.3, borderRadius: 0.75,
                  color: 'text.secondary', whiteSpace: 'nowrap', fontSize: '0.72rem',
                }}
              >
                {req.reqId}
              </Typography>

              <Tooltip title={typeConf.hint} placement="top" arrow>
                <Chip
                  label={typeConf.label}
                  size="small"
                  sx={{
                    height: 22, fontSize: '0.65rem', fontWeight: 700,
                    bgcolor: typeConf.color + '18', color: typeConf.color,
                    border: `1px solid ${typeConf.color}40`,
                  }}
                />
              </Tooltip>

              <Chip
                label={`${priConf.emoji} ${priConf.label}`}
                size="small"
                color={priConf.muiColor}
                sx={{ height: 22, fontSize: '0.65rem', fontWeight: 600 }}
              />
            </Box>

            {/* Right: Status · Consolidated · AI · expand · menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
              <Tooltip title={statusConf.hint} placement="top" arrow>
                <Box
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 0.45,
                    px: 0.9, py: 0.3, borderRadius: 1,
                    bgcolor: statusConf.bg, color: statusConf.color,
                    border: `1px solid ${statusConf.border}`,
                    fontSize: '0.65rem', fontWeight: 700,
                  }}
                >
                  {statusConf.icon}
                  <span>{statusConf.label}</span>
                </Box>
              </Tooltip>

              {/* Consolidated badge — shown instead of AI badge for merged requirements */}
              {isConsolidated ? (
                <Tooltip
                  title={`AI-synthesized from ${mergedCount ?? '3–6'} related requirements — ready for user story generation`}
                  placement="top"
                  arrow
                >
                  <Box
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 0.25,
                      px: 0.75, py: 0.3, borderRadius: 1,
                      bgcolor: '#fff7ed', border: '1px solid #fed7aa',
                      color: '#c2410c', cursor: 'default',
                    }}
                  >
                    <MergeType sx={{ fontSize: 11 }} />
                    <Typography variant="caption" fontWeight={800} sx={{ fontSize: '0.62rem', lineHeight: 1 }}>
                      {mergedCount ? `×${mergedCount}` : 'Merged'}
                    </Typography>
                  </Box>
                </Tooltip>
              ) : isAI ? (
                <Tooltip title={`AI extracted — ${pct}% confidence`} placement="top" arrow>
                  <Box
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 0.25,
                      px: 0.75, py: 0.3, borderRadius: 1,
                      bgcolor: '#faf5ff', border: '1px solid #e9d5ff',
                      color: '#8b5cf6', cursor: 'default',
                    }}
                  >
                    <AutoAwesome sx={{ fontSize: 11 }} />
                    <Typography variant="caption" fontWeight={800} sx={{ fontSize: '0.62rem', lineHeight: 1 }}>
                      {pct}%
                    </Typography>
                  </Box>
                </Tooltip>
              ) : null}

              <IconButton size="small" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
                {expanded ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
              </IconButton>
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }}>
                <MoreVert sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Box>

          {/* ── TITLE ─────────────────────────────────────────────── */}
          {editing ? (
            <TextField
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              size="small" fullWidth autoFocus label="Title"
              onClick={(e) => e.stopPropagation()}
              sx={{ mb: 1 }}
            />
          ) : (
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{ mb: 0.75, lineHeight: 1.45, fontSize: '0.875rem' }}
            >
              {req.title}
            </Typography>
          )}

          {/* ── DESCRIPTION PREVIEW ─────────────────────────────────────── */}
          {!editing && req.description && (
            isConsolidated && userStory ? (
              /* Structured user-story layout for consolidated requirements */
              <Box
                sx={{
                  mt: 0.5,
                  borderRadius: 1.5,
                  border: '1px solid #fed7aa',
                  bgcolor: '#fffbf7',
                  px: 1.5,
                  py: 1,
                  overflow: 'hidden',
                  ...(expanded ? {} : { maxHeight: 72 }),
                }}
              >
                {[
                  { label: 'As a',    value: userStory.role    },
                  { label: 'I want',  value: userStory.want    },
                  ...(userStory.benefit ? [{ label: 'so that', value: userStory.benefit }] : []),
                ].map(({ label, value }) => (
                  <Box key={label} sx={{ display: 'flex', gap: 0.75, mb: 0.4, alignItems: 'flex-start' }}>
                    <Typography
                      variant="caption"
                      sx={{ color: '#c2410c', fontWeight: 800, minWidth: 52, fontSize: '0.65rem', pt: '1px', flexShrink: 0 }}
                    >
                      {label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#374151', lineHeight: 1.5, fontSize: '0.75rem' }}>
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              /* Normal description for non-consolidated requirements */
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: expanded ? 'unset' : 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.6,
                  fontSize: '0.8rem',
                }}
              >
                {req.description}
              </Typography>
            )
          )}

          {/* ── EXPANDED DETAILS ──────────────────────────────────── */}
          <Collapse in={expanded}>
            <Box sx={{ mt: 2 }}>

              {/* ── Edit fields ─────────────────────────────────── */}
              {editing ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 1.5 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <TextField
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    multiline rows={3} size="small" fullWidth
                    label="Description"
                    helperText="Full requirement statement — 'The system shall…'"
                  />
                  <TextField
                    value={editAC}
                    onChange={(e) => setEditAC(e.target.value)}
                    multiline rows={4} size="small" fullWidth
                    label="Acceptance Criteria"
                    placeholder={"Given a registered user\nWhen they request a reset\nThen an email is sent within 30 seconds\nAnd the link expires after 24 hours"}
                    helperText="Each criterion on its own line — Given / When / Then format"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': { borderColor: '#10b981' },
                      },
                      '& label.Mui-focused': { color: '#10b981' },
                    }}
                  />
                </Box>
              ) : (
                /* ── Read-only Acceptance Criteria ────────────── */
                criteria.length > 0 && (
                  <Section
                    label={isConsolidated ? 'Acceptance Criteria (AI-synthesized)' : 'Acceptance Criteria'}
                    color="#10b981"
                  >
                    <Box
                      sx={{
                        borderRadius: 1.5,
                        border: isConsolidated ? '1px solid #fed7aa' : '1px solid #d1fae5',
                        bgcolor: isConsolidated ? '#fffbf7' : '#f0fdf4',
                        px: 1.5,
                        py: 0.75,
                      }}
                    >
                      {criteria.map((c, i) => {
                        const lower   = c.toLowerCase();
                        const isGiven = lower.startsWith('given');
                        const isWhen  = lower.startsWith('when');
                        const isThen  = lower.startsWith('then');
                        const keyword = isGiven ? 'given' : isWhen ? 'when' : isThen ? 'then' : null;
                        const rest    = keyword ? c.slice(keyword.length).replace(/^[\s,]+/, '') : c;

                        return keyword ? (
                          /* Structured Given/When/Then row */
                          <Box key={i} sx={{ display: 'flex', gap: 0.75, py: 0.4, alignItems: 'flex-start' }}>
                            <Box
                              sx={{
                                minWidth: 42, textAlign: 'center', mt: '1px',
                                px: 0.6, py: 0.15, borderRadius: 0.75, flexShrink: 0,
                                bgcolor: isGiven ? '#eff6ff' : isWhen ? '#fef9c3' : '#f0fdf4',
                                color:   isGiven ? '#2563eb' : isWhen ? '#a16207' : '#16a34a',
                                fontSize: '0.58rem', fontWeight: 800, lineHeight: 1.4,
                                textTransform: 'uppercase', letterSpacing: 0.3,
                              }}
                            >
                              {keyword}
                            </Box>
                            <Typography variant="caption" sx={{ color: '#374151', lineHeight: 1.55 }}>
                              {rest}
                            </Typography>
                          </Box>
                        ) : (
                          /* Fallback: plain bullet row */
                          <CriterionRow
                            key={i}
                            text={c}
                            done={req.status === 'approved'}
                          />
                        );
                      })}
                    </Box>
                  </Section>
                )
              )}

              {/* ── Tags ─────────────────────────────────────────── */}
              {req.tags && req.tags.length > 0 && (
                <Section label="Tags">
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {req.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={`# ${tag}`}
                        size="small"
                        sx={{ height: 20, fontSize: '0.62rem', bgcolor: 'action.selected', color: 'text.secondary' }}
                      />
                    ))}
                  </Box>
                </Section>
              )}

              {/* ── Metadata row ─────────────────────────────────── */}
              {(isAI || dateLabel) && (
                <Box
                  sx={{
                    display: 'flex', gap: 2, flexWrap: 'wrap',
                    mb: 1.75, px: 1.25, py: 0.9,
                    bgcolor: 'action.hover', borderRadius: 1.5,
                  }}
                >
                  {dateLabel && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                      <CalendarToday sx={{ fontSize: 12 }} />
                      <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>Created {dateLabel}</Typography>
                    </Box>
                  )}
                  {isAI && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#8b5cf6' }}>
                      <AutoAwesome sx={{ fontSize: 12 }} />
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                        AI-extracted · {pct}% confidence
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* ── Edit save / cancel ───────────────────────────── */}
              {editing && (
                <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                  <Button size="small" variant="contained" startIcon={<Save fontSize="small" />}
                    onClick={(e) => { e.stopPropagation(); handleSave(); }}>
                    Save changes
                  </Button>
                  <Button size="small" variant="outlined" startIcon={<Cancel fontSize="small" />}
                    onClick={(e) => { e.stopPropagation(); handleCancel(); }}>
                    Cancel
                  </Button>
                </Box>
              )}

              {/* ── Workflow actions ─────────────────────────────── */}
              {!editing && (
                <>
                  <Divider sx={{ mb: 1.5 }} />
                  <Section
                    label={
                      req.status === 'approved' || req.status === 'rejected'
                        ? 'Status'
                        : 'Actions'
                    }
                  >
                    {req.status !== 'approved' && req.status !== 'rejected' ? (
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {req.status === 'draft' && (
                          <Button
                            size="small" variant="contained" color="primary"
                            startIcon={<RateReview sx={{ fontSize: 14 }} />}
                            onClick={(e) => { e.stopPropagation(); handleStatus('in_progress'); }}
                            sx={{ borderRadius: 2, fontSize: '0.72rem', textTransform: 'none' }}
                          >
                            Send for Review
                          </Button>
                        )}
                        <Button
                          size="small" variant="contained" color="success"
                          startIcon={<CheckCircle sx={{ fontSize: 14 }} />}
                          onClick={(e) => { e.stopPropagation(); handleStatus('approved'); }}
                          sx={{ borderRadius: 2, fontSize: '0.72rem', textTransform: 'none' }}
                        >
                          Accept
                        </Button>
                        <Button
                          size="small" variant="outlined" color="error"
                          startIcon={<Block sx={{ fontSize: 14 }} />}
                          onClick={(e) => { e.stopPropagation(); handleStatus('rejected'); }}
                          sx={{ borderRadius: 2, fontSize: '0.72rem', textTransform: 'none' }}
                        >
                          Reject
                        </Button>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Box
                          sx={{
                            flex: 1, px: 1.5, py: 0.75, borderRadius: 1.5,
                            bgcolor: statusConf.bg,
                            border: `1px solid ${statusConf.border}`,
                            display: 'flex', alignItems: 'center', gap: 0.75,
                          }}
                        >
                          <Box sx={{ color: statusConf.color, display: 'flex' }}>{statusConf.icon}</Box>
                          <Typography variant="caption" sx={{ color: statusConf.color, fontWeight: 600 }}>
                            This requirement has been <strong>{statusConf.label.toLowerCase()}</strong>. {statusConf.hint}.
                          </Typography>
                        </Box>
                        <Button
                          size="small" variant="text" color="inherit"
                          startIcon={<HourglassEmpty sx={{ fontSize: 13 }} />}
                          onClick={(e) => { e.stopPropagation(); handleStatus('draft'); }}
                          sx={{ borderRadius: 2, fontSize: '0.7rem', textTransform: 'none', color: 'text.secondary', whiteSpace: 'nowrap' }}
                        >
                          Reset to Draft
                        </Button>
                      </Box>
                    )}
                  </Section>
                </>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* ── Context menu ── */}
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => { setEditing(true); setExpanded(true); setMenuAnchor(null); }}>
          <Edit fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => handleStatus('approved')}>
          <CheckCircle fontSize="small" sx={{ mr: 1, color: 'success.main' }} /> Accept
        </MenuItem>
        <MenuItem onClick={() => handleStatus('in_progress')}>
          <RateReview fontSize="small" sx={{ mr: 1, color: 'primary.main' }} /> Send for Review
        </MenuItem>
        <MenuItem onClick={() => handleStatus('draft')}>
          <HourglassEmpty fontSize="small" sx={{ mr: 1 }} /> Reset to Draft
        </MenuItem>
        <Divider />
        <MenuItem sx={{ color: 'error.main' }} onClick={() => { onDelete?.(req.id); setMenuAnchor(null); }}>
          <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </motion.div>
  );
};

export default RequirementCard;
