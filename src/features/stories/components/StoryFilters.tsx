import React from 'react';
import { Box, TextField, InputAdornment, Chip, Typography, Button } from '@mui/material';
import { Search, FilterListOff } from '@mui/icons-material';
import type { StoryStatus } from './StoryCard';

export interface StoryFilterState {
  search: string;
  statuses: StoryStatus[];
  priorities: string[];
  epicId?: string;
  sprintId?: string;
  hasPoints?: boolean;
}

interface StoryFiltersProps {
  filters: StoryFilterState;
  onChange: (f: StoryFilterState) => void;
  totalCount: number;
  filteredCount: number;
}

const ALL_STATUSES: StoryStatus[] = ['backlog', 'ready', 'in_progress', 'review', 'done'];
const ALL_PRIORITIES = ['critical', 'high', 'medium', 'low'];

const STATUS_COLORS: Record<StoryStatus, string> = { backlog: '#94a3b8', ready: '#6366f1', in_progress: '#3b82f6', review: '#f59e0b', done: '#10b981' };

const StoryFilters: React.FC<StoryFiltersProps> = ({ filters, onChange, totalCount, filteredCount }) => {
  const hasActive = filters.search || filters.statuses.length || filters.priorities.length;

  const toggle = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2" fontWeight={600}>Filters</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">{filteredCount}/{totalCount}</Typography>
          {hasActive && (
            <Button size="small" startIcon={<FilterListOff fontSize="small" />} color="error"
              onClick={() => onChange({ search: '', statuses: [], priorities: [] })}>
              Clear
            </Button>
          )}
        </Box>
      </Box>

      <TextField
        placeholder="Search stories..."
        size="small" fullWidth value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
      />

      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>STATUS</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {ALL_STATUSES.map((s) => (
            <Chip key={s} label={s.replace('_', ' ')} size="small"
              onClick={() => onChange({ ...filters, statuses: toggle(filters.statuses, s) })}
              variant={filters.statuses.includes(s) ? 'filled' : 'outlined'}
              sx={{ borderColor: STATUS_COLORS[s], color: filters.statuses.includes(s) ? 'white' : STATUS_COLORS[s], bgcolor: filters.statuses.includes(s) ? STATUS_COLORS[s] : undefined }}
            />
          ))}
        </Box>
      </Box>

      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>PRIORITY</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {ALL_PRIORITIES.map((p) => (
            <Chip key={p} label={p} size="small"
              onClick={() => onChange({ ...filters, priorities: toggle(filters.priorities, p) })}
              color={p === 'critical' ? 'error' : p === 'high' ? 'warning' : p === 'medium' ? 'primary' : 'default'}
              variant={filters.priorities.includes(p) ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default StoryFilters;
