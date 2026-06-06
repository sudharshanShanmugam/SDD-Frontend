import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  IconButton,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Link,
} from '@mui/material';
import {
  Search,
  ExpandMore,
  ContentCopy,
  OpenInNew,
  Star,
  NewReleases,
  BugReport,
  Build,
  Warning,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';

export type ChangeType = 'feature' | 'bugfix' | 'improvement' | 'breaking' | 'deprecation' | 'security';

export interface ChangelogEntry {
  id: string;
  type: ChangeType;
  title: string;
  description?: string;
  storyId?: string;
  prNumber?: string;
  author?: string;
  breaking?: boolean;
}

export interface ChangelogVersion {
  version: string;
  date: string;
  codename?: string;
  stable: boolean;
  highlights?: string[];
  entries: ChangelogEntry[];
}

const TYPE_CONFIG: Record<ChangeType, { label: string; color: string; icon: React.ReactNode }> = {
  feature: { label: 'Feature', color: '#10b981', icon: <Star sx={{ fontSize: 14 }} /> },
  bugfix: { label: 'Bug Fix', color: '#ef4444', icon: <BugReport sx={{ fontSize: 14 }} /> },
  improvement: { label: 'Improvement', color: '#6366f1', icon: <Build sx={{ fontSize: 14 }} /> },
  breaking: { label: 'Breaking', color: '#f59e0b', icon: <Warning sx={{ fontSize: 14 }} /> },
  deprecation: { label: 'Deprecated', color: '#94a3b8', icon: <Warning sx={{ fontSize: 14 }} /> },
  security: { label: 'Security', color: '#dc2626', icon: <NewReleases sx={{ fontSize: 14 }} /> },
};

interface ChangelogViewerProps {
  versions?: ChangelogVersion[];
}

const ChangelogViewer: React.FC<ChangelogViewerProps> = ({ versions = [] }) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ChangeType | 'all'>('all');
  const [view, setView] = useState<'grouped' | 'flat'>('grouped');
  const [expanded, setExpanded] = useState<string[]>([versions[0]?.version]);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const filteredVersions = useMemo(() => {
    return versions.map((v) => ({
      ...v,
      entries: v.entries.filter((e) => {
        const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.description?.toLowerCase().includes(search.toLowerCase()) || e.storyId?.toLowerCase().includes(search.toLowerCase());
        const matchType = typeFilter === 'all' || e.type === typeFilter;
        return matchSearch && matchType;
      }),
    })).filter((v) => v.entries.length > 0 || !search);
  }, [versions, search, typeFilter]);

  const allEntries = useMemo(() => {
    return filteredVersions.flatMap((v) =>
      v.entries.map((e) => ({ ...e, version: v.version, date: v.date }))
    );
  }, [filteredVersions]);

  const ChangeEntry: React.FC<{ entry: ChangelogEntry; showVersion?: boolean; version?: string }> = ({ entry, showVersion, version }) => {
    const conf = TYPE_CONFIG[entry.type];
    return (
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          py: 1.25,
          px: 1.5,
          borderRadius: 1,
          '&:hover': { bgcolor: 'action.hover', '& .copy-btn': { opacity: 1 } },
          '& .copy-btn': { opacity: 0, transition: 'opacity 0.15s' },
        }}
      >
        <Box sx={{ pt: 0.25, flexShrink: 0, color: conf.color }}>{conf.icon}</Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" fontWeight={500} sx={{ flex: 1 }}>
              {entry.title}
              {entry.breaking && (
                <Chip label="BREAKING" size="small" sx={{ ml: 1, height: 16, fontSize: '0.55rem', bgcolor: '#fef3c7', color: '#d97706', fontWeight: 700 }} />
              )}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
              {entry.storyId && (
                <Chip label={entry.storyId} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />
              )}
              {entry.prNumber && (
                <Chip
                  label={`#${entry.prNumber}`}
                  size="small"
                  sx={{ height: 18, fontSize: '0.6rem', bgcolor: 'action.hover', cursor: 'pointer' }}
                  icon={<OpenInNew sx={{ fontSize: 10 }} />}
                />
              )}
              {showVersion && version && (
                <Chip label={version} size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#ede9fe', color: '#7c3aed' }} />
              )}
            </Box>
          </Box>
          {entry.description && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
              {entry.description}
            </Typography>
          )}
        </Box>
        <Tooltip title={copied === entry.id ? 'Copied!' : 'Copy'}>
          <IconButton
            size="small"
            className="copy-btn"
            onClick={() => handleCopy(entry.title, entry.id)}
            sx={{ p: 0.5, flexShrink: 0 }}
          >
            <ContentCopy sx={{ fontSize: 14, color: copied === entry.id ? 'success.main' : 'text.disabled' }} />
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  return (
    <Box>
      {/* Search + Filters */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search changelog..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
          }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Change type</InputLabel>
          <Select value={typeFilter} label="Change type" onChange={(e) => setTypeFilter(e.target.value as ChangeType | 'all')}>
            <MenuItem value="all">All types</MenuItem>
            {(Object.entries(TYPE_CONFIG) as [ChangeType, typeof TYPE_CONFIG[ChangeType]][]).map(([k, c]) => (
              <MenuItem key={k} value={k}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ color: c.color }}>{c.icon}</Box>
                  {c.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)} size="small">
          <ToggleButton value="grouped" sx={{ px: 1.5, fontSize: '0.75rem' }}>By Version</ToggleButton>
          <ToggleButton value="flat" sx={{ px: 1.5, fontSize: '0.75rem' }}>Flat List</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Type legend */}
      <Box sx={{ display: 'flex', gap: 0.75, mb: 2, flexWrap: 'wrap' }}>
        {(Object.entries(TYPE_CONFIG) as [ChangeType, typeof TYPE_CONFIG[ChangeType]][]).map(([k, c]) => (
          <Chip
            key={k}
            label={c.label}
            size="small"
            icon={<Box sx={{ color: c.color, display: 'flex' }}>{c.icon}</Box>}
            sx={{ height: 22, fontSize: '0.7rem', cursor: 'pointer', bgcolor: typeFilter === k ? c.color + '22' : undefined, color: typeFilter === k ? c.color : undefined }}
            onClick={() => setTypeFilter(typeFilter === k ? 'all' : k)}
          />
        ))}
      </Box>

      {view === 'grouped' ? (
        <AnimatePresence>
          {filteredVersions.map((version, idx) => (
            <motion.div
              key={version.version}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
            >
              <Accordion
                expanded={expanded.includes(version.version)}
                onChange={() => setExpanded((prev) => prev.includes(version.version) ? prev.filter((v) => v !== version.version) : [...prev, version.version])}
                variant="outlined"
                sx={{ borderRadius: '8px !important', mb: 1.5, '&:before': { display: 'none' }, overflow: 'hidden' }}
              >
                <AccordionSummary expandIcon={<ExpandMore />} sx={{ '&.Mui-expanded': { minHeight: 48 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700}>{version.version}</Typography>
                    {version.codename && (
                      <Chip label={version.codename} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#ede9fe', color: '#6366f1' }} />
                    )}
                    {version.stable && (
                      <Chip label="Stable" size="small" color="success" sx={{ height: 20, fontSize: '0.65rem' }} />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {format(parseISO(version.date), 'MMM d, yyyy')}
                    </Typography>
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5, mr: 1 }}>
                      {(Object.keys(TYPE_CONFIG) as ChangeType[]).map((t) => {
                        const count = version.entries.filter((e) => e.type === t).length;
                        if (!count) return null;
                        return (
                          <Chip
                            key={t}
                            label={count}
                            size="small"
                            sx={{ height: 18, fontSize: '0.6rem', minWidth: 28, bgcolor: TYPE_CONFIG[t].color + '22', color: TYPE_CONFIG[t].color }}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  {version.highlights && version.highlights.length > 0 && (
                    <Box sx={{ px: 2, py: 1.5, bgcolor: '#f8faff', borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" gutterBottom>
                        HIGHLIGHTS
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {version.highlights.map((h) => (
                          <Chip key={h} label={h} size="small" icon={<Star sx={{ fontSize: 12, color: '#f59e0b !important' }} />} sx={{ height: 22, fontSize: '0.7rem' }} />
                        ))}
                      </Box>
                    </Box>
                  )}
                  {version.entries.map((entry, i) => (
                    <React.Fragment key={entry.id}>
                      <ChangeEntry entry={entry} />
                      {i < version.entries.length - 1 && <Divider sx={{ mx: 2 }} />}
                    </React.Fragment>
                  ))}
                </AccordionDetails>
              </Accordion>
            </motion.div>
          ))}
        </AnimatePresence>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {allEntries.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="body2" color="text.secondary">No entries match your search</Typography>
            </Box>
          ) : (
            allEntries.map((entry, i) => (
              <React.Fragment key={entry.id}>
                <ChangeEntry entry={entry} showVersion version={(entry as any).version} />
                {i < allEntries.length - 1 && <Divider sx={{ mx: 2 }} />}
              </React.Fragment>
            ))
          )}
        </Paper>
      )}
    </Box>
  );
};

export default ChangelogViewer;
