import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { AutoAwesome, Storage, People, Speed } from '@mui/icons-material';


const UsageStats: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Summary Cards */}
      <Grid container spacing={2}>
        {[
          { label: 'Total Tokens (MTD)', value: '—', icon: <AutoAwesome />, color: '#8b5cf6', change: '' },
          { label: 'Storage Used', value: '—', icon: <Storage />, color: '#3b82f6', change: '' },
          { label: 'Active Users', value: '—', icon: <People />, color: '#10b981', change: '' },
          { label: 'Avg Response Time', value: '—', icon: <Speed />, color: '#f59e0b', change: '' },
        ].map((stat) => (
          <Grid item xs={6} sm={3} key={stat.label}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                <Chip label={stat.change} size="small" color="success" sx={{ height: 20, fontSize: '0.65rem' }} />
              </Box>
              <Typography variant="h5" fontWeight={700}>{stat.value}</Typography>
              <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Token Usage Chart */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Token Consumption (6 months)
        </Typography>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={[]}>
            <defs>
              <linearGradient id="inputGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="outputGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip formatter={(v: number) => `${(v / 1000).toFixed(0)}K tokens`} />
            <Area type="monotone" dataKey="input" stroke="#6366f1" fill="url(#inputGrad)" strokeWidth={2} name="Input" />
            <Area type="monotone" dataKey="output" stroke="#10b981" fill="url(#outputGrad)" strokeWidth={2} name="Output" />
          </AreaChart>
        </ResponsiveContainer>
      </Paper>

      {/* Model Usage Pie + Storage */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={5}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Model Usage Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={[]} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {[].map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={7}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Storage Breakdown
            </Typography>
            {[
              { label: 'Documents', used: 28.4, total: 100, color: '#6366f1' },
              { label: 'Embeddings', used: 12.1, total: 50, color: '#3b82f6' },
              { label: 'Artifacts', used: 6.7, total: 20, color: '#10b981' },
            ].map((item) => (
              <Box key={item.label} sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">{item.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{item.used} / {item.total} GB</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(item.used / item.total) * 100}
                  sx={{ height: 6, borderRadius: 1, '& .MuiLinearProgress-bar': { bgcolor: item.color } }}
                />
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UsageStats;
