import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Skeleton,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AddCircleOutline,
  RemoveCircleOutline,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';
import type { BurndownPoint } from '@/types';

// ─── Stat tile ────────────────────────────────────────────────────────────

interface StatTileProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  color?: string;
  positive?: boolean | null;
}

const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  subValue,
  icon,
  color = '#6366f1',
  positive,
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 1.5,
    }}
  >
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: 2,
        bgcolor: color + '18',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
        {value}
        {positive !== null && positive !== undefined && (
          <Box
            component="span"
            sx={{
              ml: 0.5,
              fontSize: '0.75rem',
              color: positive ? 'success.main' : 'error.main',
            }}
          >
            {positive ? <TrendingUp sx={{ fontSize: 14, verticalAlign: 'middle' }} /> : <TrendingDown sx={{ fontSize: 14, verticalAlign: 'middle' }} />}
          </Box>
        )}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
        {label}
      </Typography>
      {subValue && (
        <Typography variant="caption" color="text.disabled" display="block">
          {subValue}
        </Typography>
      )}
    </Box>
  </Paper>
);

// ─── Custom tooltip ───────────────────────────────────────────────────────

interface BurndownTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

const BurndownTooltip: React.FC<BurndownTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Paper elevation={4} sx={{ p: 1.5, borderRadius: 2, minWidth: 140 }}>
      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
        Day {label}
      </Typography>
      {payload.map((p) => (
        <Box key={p.name} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="caption" sx={{ color: p.color, fontWeight: 600 }}>
            {p.name}
          </Typography>
          <Typography variant="caption" fontWeight={700}>
            {p.value} pts
          </Typography>
        </Box>
      ))}
    </Paper>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────

export interface SprintMetricsProps {
  burndownData: BurndownPoint[];
  velocityHistory?: Array<{ sprintName: string; velocity: number; planned: number }>;
  completedPoints: number;
  addedMidSprint: number;
  removedMidSprint: number;
  isLoading?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────

const SprintMetrics: React.FC<SprintMetricsProps> = ({
  burndownData: burndownDataProp,
  velocityHistory = [],
  completedPoints,
  addedMidSprint,
  removedMidSprint,
  isLoading = false,
}) => {
  // Guard against undefined arriving before data loads
  const burndownData: BurndownPoint[] = burndownDataProp ?? [];

  // Transform burndown data for recharts
  const chartData = burndownData.map((pt, i) => ({
    day: i + 1,
    Actual: pt.remaining,
    Ideal: pt.ideal,
  }));

  const totalOriginal = burndownData[0]?.ideal ?? 0;
  const scopeChangePct =
    totalOriginal > 0
      ? Math.round(((addedMidSprint + removedMidSprint) / totalOriginal) * 100)
      : 0;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2 }} />
        <Grid container spacing={1.5}>
          {[0, 1, 2, 3].map((i) => (
            <Grid key={i} size={{ xs: 6 }}>
              <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* ── Burndown Chart ── */}
      <Box>
        <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
          Burndown Chart
        </Typography>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Paper
            elevation={0}
            sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
          >
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  label={{ value: 'Day', position: 'insideBottomRight', offset: -4, fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip content={<BurndownTooltip />} />
                <Legend
                  iconType="plainline"
                  iconSize={16}
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="Ideal"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="Actual"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#f97316' }}
                  activeDot={{ r: 5 }}
                />
                <ReferenceLine y={0} stroke="#10b981" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </motion.div>
      </Box>

      {/* ── Velocity Trend ── */}
      {velocityHistory.length > 0 && (
        <Box>
          <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
            Velocity Trend (Last {velocityHistory.length} Sprints)
          </Typography>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Paper
              elevation={0}
              sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
            >
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={velocityHistory}
                  margin={{ top: 4, right: 8, left: -20, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="sprintName"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={36}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="planned" name="Planned" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="velocity" name="Actual" fill="#6366f1" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </motion.div>
        </Box>
      )}

      <Divider />

      {/* ── Stats ── */}
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 6 }}>
          <StatTile
            label="Completed Points"
            value={completedPoints}
            icon={<TrendingUp fontSize="small" />}
            color="#10b981"
            positive
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <StatTile
            label="Added Mid-Sprint"
            value={addedMidSprint}
            icon={<AddCircleOutline fontSize="small" />}
            color="#f59e0b"
            positive={addedMidSprint === 0}
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <StatTile
            label="Removed"
            value={removedMidSprint}
            icon={<RemoveCircleOutline fontSize="small" />}
            color="#6366f1"
            positive={null}
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <StatTile
            label="Scope Change"
            value={`${scopeChangePct}%`}
            subValue="of original"
            icon={<TrendingDown fontSize="small" />}
            color={scopeChangePct > 20 ? '#ef4444' : '#94a3b8'}
            positive={scopeChangePct <= 10}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default SprintMetrics;
