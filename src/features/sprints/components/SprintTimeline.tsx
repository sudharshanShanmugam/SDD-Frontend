import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
  ReferenceLine,
  LineChart,
  Line,
  Legend,
  ComposedChart,
  Area,
} from 'recharts';
import { motion } from 'framer-motion';
import { format, addDays, startOfWeek } from 'date-fns';

export interface SprintData {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  plannedPoints: number;
  completedPoints: number;
  addedPoints: number; // scope creep
  velocity: number;
  status: 'completed' | 'active' | 'planned';
}

// Burndown data point
interface BurndownPoint {
  day: string;
  ideal: number;
  actual: number | null;
  remaining?: number;
}

const generateBurndown = (totalPoints: number, sprintDays: number): BurndownPoint[] => {
  const points: BurndownPoint[] = [];
  const dailyIdeal = totalPoints / sprintDays;

  for (let i = 0; i <= sprintDays; i++) {
    const day = format(addDays(startOfWeek(new Date()), i), 'MMM d');
    const ideal = Math.max(0, totalPoints - dailyIdeal * i);
    // Simulate actual burndown with some variance
    let actual: number | null = null;
    if (i <= Math.floor(sprintDays * 0.7)) {
      const noise = (Math.random() - 0.4) * 6;
      actual = Math.max(0, ideal + noise + (i > 3 ? i * 0.8 : 0));
    }
    points.push({ day, ideal: parseFloat(ideal.toFixed(1)), actual: actual !== null ? parseFloat(actual.toFixed(1)) : null });
  }
  return points;
};

const STATUS_COLORS: Record<string, string> = {
  completed: '#10b981',
  active: '#6366f1',
  planned: '#94a3b8',
};

const CustomBar = (props: any) => {
  const { x, y, width, height, fill, status } = props;
  return (
    <motion.rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      rx={3}
      initial={{ scaleY: 0, originY: 1 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    />
  );
};

type ChartMode = 'velocity' | 'burndown' | 'comparison';

interface SprintTimelineProps {
  sprints?: SprintData[];
  currentSprintPoints?: number;
}

const SprintTimeline: React.FC<SprintTimelineProps> = ({
  sprints = [],
  currentSprintPoints = 0,
}) => {
  const [mode, setMode] = useState<ChartMode>('velocity');

  const avgVelocity = sprints
    .filter((s) => s.status === 'completed' && s.velocity > 0)
    .reduce((sum, s, _, arr) => sum + s.velocity / arr.length, 0);

  const burndownData = generateBurndown(currentSprintPoints, 10);

  const comparisonData = sprints.map((s) => ({
    name: s.name,
    planned: s.plannedPoints,
    completed: s.completedPoints,
    added: s.addedPoints,
    status: s.status,
  }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>Sprint Timeline</Typography>
          <Typography variant="caption" color="text.secondary">
            Avg velocity: <strong>{avgVelocity.toFixed(0)} pts/sprint</strong>
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, v) => v && setMode(v)}
          size="small"
        >
          <ToggleButton value="velocity" sx={{ px: 1.5, fontSize: '0.75rem' }}>Velocity</ToggleButton>
          <ToggleButton value="burndown" sx={{ px: 1.5, fontSize: '0.75rem' }}>Burndown</ToggleButton>
          <ToggleButton value="comparison" sx={{ px: 1.5, fontSize: '0.75rem' }}>Plan vs Done</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Chart */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        {mode === 'velocity' && (
          <>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Story points completed per sprint
            </Typography>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={sprints.map((s) => ({ name: s.name, velocity: s.velocity, planned: s.plannedPoints, status: s.status }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RechartTooltip
                  formatter={(value: number, name: string) => [`${value} pts`, name === 'velocity' ? 'Completed' : 'Planned']}
                />
                <ReferenceLine y={avgVelocity} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `Avg ${avgVelocity.toFixed(0)}`, position: 'right', fontSize: 11, fill: '#f59e0b' }} />
                <Bar dataKey="planned" fill="#e2e8f0" name="Planned" radius={[3, 3, 0, 0]} />
                <Bar dataKey="velocity" name="Completed" radius={[3, 3, 0, 0]}>
                  {sprints.map((s, i) => (
                    <rect key={i} fill={STATUS_COLORS[s.status]} />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="velocity" stroke="#6366f1" strokeWidth={2} dot={{ r: 4, fill: '#6366f1' }} name="Trend" />
              </ComposedChart>
            </ResponsiveContainer>
          </>
        )}

        {mode === 'burndown' && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">Active sprint burndown ({currentSprintPoints} points)</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label="Ideal" size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#e2e8f0', color: '#64748b' }} />
                <Chip label="Actual" size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#ede9fe', color: '#6366f1' }} />
              </Box>
            </Box>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, currentSprintPoints + 5]} />
                <RechartTooltip formatter={(v: number) => [`${v} pts`]} />
                <ReferenceLine y={0} stroke="#e2e8f0" />
                <Line
                  type="monotone"
                  dataKey="ideal"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  name="Ideal"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#6366f1' }}
                  connectNulls={false}
                  name="Actual"
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}

        {mode === 'comparison' && (
          <>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Planned vs completed points (scope creep shown)
            </Typography>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RechartTooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="planned" name="Planned" fill="#e2e8f0" radius={[3, 3, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#6366f1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="added" name="Scope Added" fill="#f59e0b" radius={[3, 3, 0, 0]} stackId="added" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </Paper>

      {/* Sprint List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {sprints.map((sprint, idx) => {
          const completionPct = sprint.plannedPoints > 0 ? (sprint.completedPoints / sprint.plannedPoints) * 100 : 0;
          return (
            <motion.div
              key={sprint.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Paper
                variant="outlined"
                sx={{
                  px: 2,
                  py: 1.25,
                  borderRadius: 1.5,
                  borderLeft: `3px solid ${STATUS_COLORS[sprint.status]}`,
                  display: 'grid',
                  gridTemplateColumns: '100px 1fr 120px 80px',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={600}>{sprint.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(sprint.startDate), 'MMM d')} – {format(new Date(sprint.endDate), 'MMM d')}
                  </Typography>
                </Box>

                <Tooltip title={`${sprint.completedPoints} / ${sprint.plannedPoints} points`}>
                  <Box>
                    <Box
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: STATUS_COLORS[sprint.status] + '22',
                        overflow: 'hidden',
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(completionPct, 100)}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.08 }}
                        style={{ height: '100%', background: STATUS_COLORS[sprint.status], borderRadius: 3 }}
                      />
                    </Box>
                  </Box>
                </Tooltip>

                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" fontWeight={600}>
                    {sprint.completedPoints} / {sprint.plannedPoints} pts
                  </Typography>
                  {sprint.addedPoints > 0 && (
                    <Typography variant="caption" color="warning.main" display="block" sx={{ fontSize: '0.6rem' }}>
                      +{sprint.addedPoints} added
                    </Typography>
                  )}
                </Box>

                <Chip
                  label={sprint.status}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.6rem',
                    textTransform: 'capitalize',
                    bgcolor: STATUS_COLORS[sprint.status] + '22',
                    color: STATUS_COLORS[sprint.status],
                    fontWeight: 600,
                  }}
                />
              </Paper>
            </motion.div>
          );
        })}
      </Box>
    </Box>
  );
};

export default SprintTimeline;
