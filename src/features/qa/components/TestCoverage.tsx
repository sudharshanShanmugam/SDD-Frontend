import React from 'react';
import { Box, Typography, Paper, Grid, Chip } from '@mui/material';
import {
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CoverageData {
  total: number;
  covered: number;
  passed: number;
  failed: number;
  skipped: number;
  byType: { name: string; value: number; color: string }[];
  byModule: { module: string; coverage: number; total: number }[];
}

interface TestCoverageProps {
  data?: CoverageData;
}

const CoverageGauge: React.FC<{ value: number; label: string }> = ({ value, label }) => {
  const color = value >= 90 ? '#10b981' : value >= 70 ? '#f59e0b' : '#ef4444';
  const data = [{ value, fill: color }];

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        <ResponsiveContainer width={140} height={140}>
          <RadialBarChart
            innerRadius="60%"
            outerRadius="80%"
            data={data}
            startAngle={180}
            endAngle={-180}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={6}
              background={{ fill: '#f1f5f9' }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h5" fontWeight={700} sx={{ color }}>
            {value}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const TestCoverage: React.FC<TestCoverageProps> = ({ data }) => {
  if (!data) return null;

  const coveragePct = data.total > 0 ? Math.round((data.covered / data.total) * 100) : 0;
  const passRate = data.covered > 0 ? Math.round((data.passed / data.covered) * 100) : 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Key Metrics */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Paper
            variant="outlined"
            sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}
          >
            <Typography variant="h3" fontWeight={700} color="primary.main">
              {coveragePct}%
            </Typography>
            <Typography variant="body2" color="text.secondary">Test Coverage</Typography>
            <Typography variant="caption" color="text.disabled">
              {data.covered} / {data.total} stories
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h3" fontWeight={700} color="success.main">{passRate}%</Typography>
            <Typography variant="body2" color="text.secondary">Pass Rate</Typography>
            <Typography variant="caption" color="text.disabled">
              {data.passed} passed
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h3" fontWeight={700} color="error.main">{data.failed}</Typography>
            <Typography variant="body2" color="text.secondary">Failing Tests</Typography>
            <Typography variant="caption" color="text.disabled">
              {data.skipped} skipped
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={5}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>By Test Type</Typography>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.byType}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={11}
                >
                  {data.byType.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={7}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Coverage by Module</Typography>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.byModule} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="module" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey="coverage" name="Coverage" radius={[4, 4, 0, 0]}>
                  {data.byModule.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.coverage >= 90 ? '#10b981' : entry.coverage >= 70 ? '#f59e0b' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TestCoverage;
