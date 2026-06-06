import React from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  CheckCircleOutlined,
  ErrorOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { get } from '@api/client';

// ── Types ─────────────────────────────────────────────────────────────────────

type HealthStatus = 'ok' | 'warn' | 'error';

interface LatencyMetrics {
  p50: number;
  p95: number;
  p99: number;
  status: HealthStatus;
}

interface DatabaseMetrics {
  poolSize: number;
  activeConnections: number;
  idleConnections: number;
  status: HealthStatus;
}

interface RedisMetrics {
  memoryUsedMB: number;
  memoryTotalMB: number;
  hitRate: number;
  status: HealthStatus;
}

interface SystemHealthData {
  latency: LatencyMetrics;
  database: DatabaseMetrics;
  redis: RedisMetrics;
  responseTrend: { time: string; p50: number; p95: number }[];
}

// ── Status indicator ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: HealthStatus }) {
  const map = {
    ok: { icon: <CheckCircleOutlined fontSize="small" />, color: 'success' as const, label: 'Healthy' },
    warn: { icon: <WarningAmberOutlined fontSize="small" />, color: 'warning' as const, label: 'Degraded' },
    error: { icon: <ErrorOutlined fontSize="small" />, color: 'error' as const, label: 'Down' },
  };
  const cfg = map[status];
  return (
    <Chip
      icon={cfg.icon}
      label={cfg.label}
      color={cfg.color}
      size="small"
      variant="outlined"
    />
  );
}

// ── Metric row ────────────────────────────────────────────────────────────────

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <Box display="flex" justifyContent="space-between" py={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="caption" fontWeight={600}>
        {value}
      </Typography>
    </Box>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SystemHealth() {
  const { data: health, isLoading } = useQuery<SystemHealthData>({
    queryKey: ['admin', 'system-health'],
    queryFn: () => get<SystemHealthData>('/admin/system/health'),
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!health) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <Typography variant="body2" color="text.secondary">
          No health data available.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} mb={2}>
        System Health
      </Typography>

      <Stack spacing={2}>
        {/* API Latency */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="subtitle2" fontWeight={600}>
              API Latency
            </Typography>
            <StatusBadge status={health.latency.status} />
          </Box>
          <Divider sx={{ mb: 1 }} />
          <MetricRow label="p50 (median)" value={`${health.latency.p50} ms`} />
          <MetricRow label="p95" value={`${health.latency.p95} ms`} />
          <MetricRow label="p99" value={`${health.latency.p99} ms`} />
        </Paper>

        {/* Database */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="subtitle2" fontWeight={600}>
              Database (PostgreSQL)
            </Typography>
            <StatusBadge status={health.database.status} />
          </Box>
          <Divider sx={{ mb: 1 }} />
          <MetricRow label="Pool size" value={health.database.poolSize.toString()} />
          <MetricRow
            label="Active connections"
            value={`${health.database.activeConnections} / ${health.database.poolSize}`}
          />
          <MetricRow label="Idle connections" value={health.database.idleConnections.toString()} />
        </Paper>

        {/* Redis */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="subtitle2" fontWeight={600}>
              Redis Cache
            </Typography>
            <StatusBadge status={health.redis.status} />
          </Box>
          <Divider sx={{ mb: 1 }} />
          <MetricRow
            label="Memory used"
            value={`${health.redis.memoryUsedMB} MB / ${health.redis.memoryTotalMB} MB`}
          />
          <MetricRow label="Hit rate" value={`${health.redis.hitRate.toFixed(1)}%`} />
        </Paper>

        {/* Response time trend chart */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
            API Response Time — 24h Trend
          </Typography>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart
              data={health.responseTrend}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10 }}
                tickLine={false}
                interval={3}
              />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} unit="ms" />
              <RechartsTooltip
                contentStyle={{ fontSize: 12 }}
                formatter={(v: number) => [`${v} ms`]}
              />
              <Line
                type="monotone"
                dataKey="p50"
                stroke="#1976d2"
                strokeWidth={2}
                dot={false}
                name="p50"
              />
              <Line
                type="monotone"
                dataKey="p95"
                stroke="#ed6c02"
                strokeWidth={2}
                dot={false}
                strokeDasharray="4 4"
                name="p95"
              />
            </LineChart>
          </ResponsiveContainer>
          <Box display="flex" gap={3} mt={1} justifyContent="center">
            <Box display="flex" alignItems="center" gap={0.5}>
              <Box sx={{ width: 16, height: 2, bgcolor: '#1976d2', borderRadius: 1 }} />
              <Typography variant="caption">p50</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Box sx={{ width: 16, height: 2, bgcolor: '#ed6c02', borderRadius: 1, borderStyle: 'dashed' }} />
              <Typography variant="caption">p95</Typography>
            </Box>
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}

export default SystemHealth;
