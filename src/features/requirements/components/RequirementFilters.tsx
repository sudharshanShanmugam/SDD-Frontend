import React from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Typography,
  Divider,
  Tooltip,
} from '@mui/material';
import { Search, FilterListOff, TuneRounded } from '@mui/icons-material';
import type { RequirementType, RequirementPriority, RequirementStatus, Requirement } from './RequirementCard';

export interface RequirementFilterState {
  search: string;
  types: RequirementType[];
  priorities: RequirementPriority[];
  statuses: RequirementStatus[];
  minConfidence: number;
}

interface RequirementFiltersProps {
  filters: RequirementFilterState;
  onChange: (filters: RequirementFilterState) => void;
  totalCount: number;
  filteredCount: number;
  requirements?: Requirement[];   // optional — used for showing counts per bucket
}

/* ─── Static config ───────────────────────────────────────────────── */
const ALL_TYPES: { value: RequirementType; label: string; color: string }[] = [
  { value: 'functional',     label: 'Functional',     color: '#6366f1' },
  { value: 'non_functional', label: 'Non-Functional',  color: '#f59e0b' },
  { value: 'business',       label: 'Business',        color: '#10b981' },
  { value: 'constraint',     label: 'Constraint',      color: '#ef4444' },
];

const ALL_PRIORITIES: { value: RequirementPriority; label: string; muiColor: 'error' | 'warning' | 'primary' | 'default' }[] = [
  { value: 'critical', label: '🔴 Critical', muiColor: 'error'   },
  { value: 'high',     label: '🟠 High',     muiColor: 'warning' },
  { value: 'medium',   label: '🔵 Medium',   muiColor: 'primary' },
  { value: 'low',      label: '⚪ Low',      muiColor: 'default' },
];

const ALL_STATUSES: { value: RequirementStatus; label: string; color: string }[] = [
  { value: 'draft',       label: 'Draft',      color: '#64748b' },
  { value: 'in_progress', label: 'In Review',  color: '#3b82f6' },
  { value: 'approved',    label: 'Approved',   color: '#10b981' },
  { value: 'rejected',    label: 'Rejected',   color: '#ef4444' },
];

/* ─── Helper ─────────────────────────────────────────────────────── */
function countBy<T extends string>(items: Requirement[], key: keyof Requirement): Record<T, number> {
  return items.reduce((acc, r) => {
    const v = r[key] as unknown as T;
    acc[v] = (acc[v] ?? 0) + 1;
    return acc;
  }, {} as Record<T, number>);
}

/* ─── Component ──────────────────────────────────────────────────── */
const RequirementFilters: React.FC<RequirementFiltersProps> = ({
  filters,
  onChange,
  totalCount,
  filteredCount,
  requirements = [],
}) => {
  const hasActive =
    !!filters.search ||
    filters.types.length > 0 ||
    filters.priorities.length > 0 ||
    filters.statuses.length > 0;

  const activeCount =
    (filters.search ? 1 : 0) +
    filters.types.length +
    filters.priorities.length +
    filters.statuses.length;

  const clearAll = () => onChange({ search: '', types: [], priorities: [], statuses: [], minConfidence: 0 });

  const toggle = <T extends string>(key: 'types' | 'priorities' | 'statuses', val: T) => {
    const cur = filters[key] as T[];
    onChange({ ...filters, [key]: cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val] });
  };

  const typeCounts     = countBy<RequirementType>    (requirements, 'type');
  const priorityCounts = countBy<RequirementPriority>(requirements, 'priority');
  const statusCounts   = countBy<RequirementStatus>  (requirements, 'status');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <TuneRounded sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="subtitle2" fontWeight={700}>
            Filters
          </Typography>
          {hasActive && (
            <Box
              sx={{
                bgcolor: 'primary.main', color: 'white',
                borderRadius: '50%', width: 18, height: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', fontWeight: 700,
              }}
            >
              {activeCount}
            </Box>
          )}
        </Box>
        {hasActive && (
          <Button size="small" startIcon={<FilterListOff sx={{ fontSize: 14 }} />} onClick={clearAll} color="error" sx={{ fontSize: '0.7rem' }}>
            Clear all
          </Button>
        )}
      </Box>

      {/* ── Showing N of M ── */}
      <Box
        sx={{
          bgcolor: filteredCount < totalCount ? 'warning.main' + '14' : 'action.hover',
          borderRadius: 1.5, px: 1.25, py: 0.75,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">Showing</Typography>
        <Typography variant="caption" fontWeight={700} color={filteredCount < totalCount ? 'warning.dark' : 'text.primary'}>
          {filteredCount} / {totalCount}
        </Typography>
      </Box>

      {/* ── Search ── */}
      <TextField
        placeholder="Search title or description…"
        size="small"
        fullWidth
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ fontSize: 16, color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
      />

      <Divider />

      {/* ── Type ── */}
      <Box>
        <Typography variant="caption" color="text.disabled" sx={{ mb: 1, display: 'block', fontWeight: 700, letterSpacing: 0.5 }}>
          TYPE
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {ALL_TYPES.map(({ value, label, color }) => {
            const active  = filters.types.includes(value);
            const cnt     = typeCounts[value] ?? 0;
            return (
              <Box
                key={value}
                onClick={() => toggle('types', value)}
                sx={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  px: 1, py: 0.5, borderRadius: 1.5, cursor: 'pointer',
                  bgcolor: active ? color + '18' : 'transparent',
                  border: `1px solid ${active ? color + '60' : 'transparent'}`,
                  '&:hover': { bgcolor: color + '12' },
                  transition: 'all 0.12s',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: active ? color : color + '60' }} />
                  <Typography variant="caption" fontWeight={active ? 700 : 400} sx={{ color: active ? color : 'text.primary' }}>
                    {label}
                  </Typography>
                </Box>
                {cnt > 0 && (
                  <Typography variant="caption" sx={{ color: active ? color : 'text.disabled', fontWeight: 600 }}>
                    {cnt}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      <Divider />

      {/* ── Priority ── */}
      <Box>
        <Typography variant="caption" color="text.disabled" sx={{ mb: 1, display: 'block', fontWeight: 700, letterSpacing: 0.5 }}>
          PRIORITY
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {ALL_PRIORITIES.map(({ value, label, muiColor }) => {
            const active = filters.priorities.includes(value);
            const cnt    = priorityCounts[value] ?? 0;
            return (
              <Tooltip key={value} title={cnt > 0 ? `${cnt} requirement${cnt !== 1 ? 's' : ''}` : ''} placement="top" arrow>
                <Chip
                  label={cnt > 0 ? `${label} (${cnt})` : label}
                  size="small"
                  color={active ? muiColor : 'default'}
                  variant={active ? 'filled' : 'outlined'}
                  onClick={() => toggle('priorities', value)}
                  sx={{ fontSize: '0.65rem', cursor: 'pointer' }}
                />
              </Tooltip>
            );
          })}
        </Box>
      </Box>

      <Divider />

      {/* ── Status ── */}
      <Box>
        <Typography variant="caption" color="text.disabled" sx={{ mb: 1, display: 'block', fontWeight: 700, letterSpacing: 0.5 }}>
          STATUS
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {ALL_STATUSES.map(({ value, label, color }) => {
            const active = filters.statuses.includes(value);
            const cnt    = statusCounts[value] ?? 0;
            return (
              <Box
                key={value}
                onClick={() => toggle('statuses', value)}
                sx={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  px: 1, py: 0.5, borderRadius: 1.5, cursor: 'pointer',
                  bgcolor: active ? color + '18' : 'transparent',
                  border: `1px solid ${active ? color + '60' : 'transparent'}`,
                  '&:hover': { bgcolor: color + '10' },
                  transition: 'all 0.12s',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: 1, bgcolor: active ? color : color + '60' }} />
                  <Typography variant="caption" fontWeight={active ? 700 : 400} sx={{ color: active ? color : 'text.primary' }}>
                    {label}
                  </Typography>
                </Box>
                {cnt > 0 && (
                  <Typography variant="caption" sx={{ color: active ? color : 'text.disabled', fontWeight: 600 }}>
                    {cnt}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default RequirementFilters;
