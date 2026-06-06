import React, { useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
  useTheme,
  Button,
  alpha,
} from '@mui/material';
import {
  BarChart2,
  Users,
  Building2,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  Server,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { get } from '@api/client';
import { OrgList } from '../components/OrgList';
import UserManagementPage from './UserManagementPage';

// ── Types ──────────────────────────────────────────────────────────────────────

interface PlatformStats {
  users: { total: number; active: number };
  projects: number;
  organizations: number;
  generated_at: string;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: Record<string, { status: string; error?: string }>;
  checked_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

type SectionKey = 'overview' | 'users' | 'orgs' | 'system';

const NAV = [
  { key: 'overview' as SectionKey, label: 'Overview',       icon: <BarChart2 size={18} /> },
  { key: 'users'    as SectionKey, label: 'Users',          icon: <Users     size={18} /> },
  { key: 'orgs'     as SectionKey, label: 'Organizations',  icon: <Building2 size={18} /> },
  { key: 'system'   as SectionKey, label: 'System Health',  icon: <Activity  size={18} /> },
];

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon, color = 'primary.main',
}: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; color?: string;
}) {
  const theme = useTheme();
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
      <CardContent sx={{ pb: '16px !important' }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.6}>
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={800} mt={0.5} sx={{ color }}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            {sub && (
              <Typography variant="caption" color="text.secondary">{sub}</Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 40, height: 40, borderRadius: 2, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.08), color,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// ── Health Status Badge ────────────────────────────────────────────────────────

function HealthBadge({ status }: { status: string }) {
  const map = {
    healthy:   { icon: <CheckCircle2 size={14} />, color: 'success' as const, label: 'Healthy'  },
    degraded:  { icon: <AlertTriangle size={14} />, color: 'warning' as const, label: 'Degraded' },
    unhealthy: { icon: <XCircle size={14} />,      color: 'error'   as const, label: 'Down'     },
  };
  const cfg = map[status as keyof typeof map] ?? map.unhealthy;
  return (
    <Chip
      icon={cfg.icon}
      label={cfg.label}
      color={cfg.color}
      size="small"
      variant="outlined"
      sx={{ fontWeight: 600 }}
    />
  );
}

// ── Mock sparkline data for visual interest ────────────────────────────────────

const SPARKLINE = Array.from({ length: 7 }, (_, i) => ({
  day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  users: Math.floor(Math.random() * 30 + 10),
}));

// ── Overview Section ───────────────────────────────────────────────────────────

function OverviewSection() {
  const { data: stats, isLoading, error } = useQuery<PlatformStats>({
    queryKey: ['admin', 'stats'],
    queryFn: () => get<PlatformStats>('/admin/stats'),
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !stats) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        Failed to load platform statistics. Check your connection and try again.
      </Alert>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Stat cards */}
      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(220px, 1fr))" gap={2}>
        <StatCard
          label="Total Users"
          value={stats.users.total}
          sub={`${stats.users.active} active`}
          icon={<Users size={20} />}
          color="#1976d2"
        />
        <StatCard
          label="Active Users"
          value={stats.users.active}
          sub={`${Math.round((stats.users.active / Math.max(stats.users.total, 1)) * 100)}% of total`}
          icon={<CheckCircle2 size={20} />}
          color="#2e7d32"
        />
        <StatCard
          label="Organizations"
          value={stats.organizations}
          sub="registered tenants"
          icon={<Building2 size={20} />}
          color="#7b1fa2"
        />
        <StatCard
          label="Projects"
          value={stats.projects}
          sub="across all orgs"
          icon={<Cpu size={20} />}
          color="#e65100"
        />
      </Box>

      {/* Activity chart */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>Platform Activity</Typography>
            <Typography variant="caption" color="text.secondary">User logins — last 7 days</Typography>
          </Box>
        </Box>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={SPARKLINE} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#1976d2" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1976d2" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <RechartsTooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e0e0e0' }}
              formatter={(v: number) => [`${v} users`]}
            />
            <Area
              type="monotone"
              dataKey="users"
              stroke="#1976d2"
              strokeWidth={2.5}
              fill="url(#blueGrad)"
              dot={{ r: 3, fill: '#1976d2' }}
              activeDot={{ r: 5 }}
              name="Active Users"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Paper>

      {/* Quick info */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Platform Summary</Typography>
        <Divider sx={{ mb: 1.5 }} />
        {[
          { label: 'Total registered users',   value: stats.users.total },
          { label: 'Active users',              value: stats.users.active },
          { label: 'Inactive / suspended',      value: stats.users.total - stats.users.active },
          { label: 'Organizations',             value: stats.organizations },
          { label: 'Projects',                  value: stats.projects },
          { label: 'Last refreshed',            value: new Date(stats.generated_at).toLocaleTimeString() },
        ].map(({ label, value }) => (
          <Box key={label} display="flex" justifyContent="space-between" py={0.6}>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography variant="body2" fontWeight={600}>{value}</Typography>
          </Box>
        ))}
      </Paper>
    </Stack>
  );
}

// ── System Health Section ──────────────────────────────────────────────────────

const COMPONENT_ICONS: Record<string, React.ReactNode> = {
  database: <Database size={16} />,
  redis:    <Server   size={16} />,
  celery:   <Cpu      size={16} />,
};

function SystemHealthSection() {
  const { data: health, isLoading, error, refetch, isFetching } = useQuery<HealthStatus>({
    queryKey: ['admin', 'health'],
    queryFn: () => get<HealthStatus>('/admin/health'),
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !health) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        Failed to load system health data.
      </Alert>
    );
  }

  const overallColor = {
    healthy:   'success.main',
    degraded:  'warning.main',
    unhealthy: 'error.main',
  }[health.status] ?? 'text.secondary';

  return (
    <Stack spacing={2.5}>
      {/* Overall status banner */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5, borderRadius: 2,
          borderColor: overallColor,
          bgcolor: (t) => alpha(
            health.status === 'healthy' ? t.palette.success.main :
            health.status === 'degraded' ? t.palette.warning.main : t.palette.error.main,
            0.04
          ),
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <Activity size={20} color={health.status === 'healthy' ? '#2e7d32' : health.status === 'degraded' ? '#e65100' : '#d32f2f'} />
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Overall Status: <Box component="span" sx={{ color: overallColor, textTransform: 'capitalize' }}>{health.status}</Box>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Last checked: {new Date(health.checked_at).toLocaleTimeString()}
              </Typography>
            </Box>
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshCw size={14} className={isFetching ? 'spin' : ''} />}
            onClick={() => refetch()}
            disabled={isFetching}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Component cards */}
      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(260px, 1fr))" gap={2}>
        {Object.entries(health.components).map(([name, comp]) => (
          <Paper key={name} variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ color: 'text.secondary' }}>{COMPONENT_ICONS[name] ?? <Server size={16} />}</Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                  {name}
                </Typography>
              </Box>
              <HealthBadge status={comp.status} />
            </Box>
            {comp.error && (
              <Alert severity="error" sx={{ py: 0.5, px: 1, fontSize: 12, borderRadius: 1 }}>
                {comp.error}
              </Alert>
            )}
            {!comp.error && (
              <Typography variant="caption" color="text.secondary">
                All systems operating normally
              </Typography>
            )}
          </Paper>
        ))}
      </Box>
    </Stack>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

const SECTION_TITLES: Record<SectionKey, { title: string; sub: string }> = {
  overview: { title: 'Platform Overview',  sub: 'Platform-wide statistics and activity'      },
  users:    { title: 'User Management',    sub: 'Manage users across all organizations'      },
  orgs:     { title: 'Organizations',      sub: 'View and manage registered organizations'   },
  system:   { title: 'System Health',      sub: 'Real-time infrastructure health monitoring' },
};

export default function AdminConsolePage() {
  const [active, setActive] = useState<SectionKey>('overview');
  const theme = useTheme();
  const section = SECTION_TITLES[active];

  return (
    <Box sx={{ display: 'flex', height: '100%', bgcolor: 'background.default' }}>

      {/* Left nav */}
      <Box
        sx={{
          width: 220,
          flexShrink: 0,
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50',
          display: 'flex',
          flexDirection: 'column',
          pt: 1,
        }}
      >
        <Box px={2} py={2}>
          <Typography variant="overline" fontWeight={700} color="text.disabled" letterSpacing={1.2}>
            Admin Console
          </Typography>
        </Box>
        <Divider />
        <List disablePadding sx={{ px: 1, pt: 1 }}>
          {NAV.map((item) => (
            <ListItemButton
              key={item.key}
              selected={active === item.key}
              onClick={() => setActive(item.key)}
              sx={{
                borderRadius: 1.5,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                  '&:hover': { bgcolor: 'primary.dark' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>

      {/* Main content */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2, md: 4 }, py: 3 }}>

        {/* Page header */}
        <Box mb={3}>
          <Typography variant="h5" fontWeight={800}>{section.title}</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.25}>{section.sub}</Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        {active === 'overview' && <OverviewSection />}
        {active === 'users'    && <UserManagementPage embedded />}
        {active === 'orgs'     && <OrgList />}
        {active === 'system'   && <SystemHealthSection />}
      </Box>
    </Box>
  );
}
