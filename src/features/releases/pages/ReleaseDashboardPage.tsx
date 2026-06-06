import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Tabs,
  Tab,
  Divider,
  LinearProgress,
  Avatar,
  AvatarGroup,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Rocket,
  CheckCircle,
  Schedule,
  Warning,
  Add,
  Refresh,
  OpenInNew,
  BugReport,
  Star,
  Timeline,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import ChangelogViewer from '../components/ChangelogViewer';
import ReleaseNoteEditor from '../components/ReleaseNoteEditor';

interface Release {
  id: string;
  version: string;
  codename?: string;
  status: 'released' | 'in-progress' | 'planned' | 'hotfix';
  targetDate: string;
  releaseDate?: string;
  completionPct: number;
  totalStories: number;
  completedStories: number;
  openBugs: number;
  criticalBugs: number;
  features: number;
  team: string[];
  environment: 'production' | 'staging' | 'development';
}

const STATUS_CONFIG: Record<Release['status'], { label: string; color: string; icon: React.ReactNode }> = {
  released: { label: 'Released', color: '#10b981', icon: <CheckCircle fontSize="small" /> },
  'in-progress': { label: 'In Progress', color: '#6366f1', icon: <Schedule fontSize="small" /> },
  planned: { label: 'Planned', color: '#94a3b8', icon: <Timeline fontSize="small" /> },
  hotfix: { label: 'Hotfix', color: '#ef4444', icon: <Warning fontSize="small" /> },
};

const releases: Release[] = [];

const releaseVelocityData: { month: string; releases: number; features: number; bugs: number }[] = [];

const qualityData: { name: string; value: number; color: string }[] = [];

const ReleaseCard: React.FC<{ release: Release }> = ({ release }) => {
  const conf = STATUS_CONFIG[release.status];

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 2,
          borderLeft: `4px solid ${conf.color}`,
          cursor: 'pointer',
          transition: 'box-shadow 0.15s',
          '&:hover': { boxShadow: 4 },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>{release.version}</Typography>
              {release.codename && (
                <Chip label={release.codename} size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#ede9fe', color: '#6366f1' }} />
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              Target: {format(parseISO(release.targetDate), 'MMM d, yyyy')}
              {release.releaseDate && ` · Released ${format(parseISO(release.releaseDate), 'MMM d')}`}
            </Typography>
          </Box>
          <Chip
            label={conf.label}
            size="small"
            icon={conf.icon}
            sx={{ bgcolor: conf.color + '22', color: conf.color, fontWeight: 600 }}
          />
        </Box>

        <Box sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {release.completedStories} / {release.totalStories} stories
            </Typography>
            <Typography variant="caption" fontWeight={700} sx={{ color: conf.color }}>
              {release.completionPct}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={release.completionPct}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: conf.color + '22',
              '& .MuiLinearProgress-bar': { bgcolor: conf.color, borderRadius: 3 },
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={`${release.features} features`}
              size="small"
              icon={<Star sx={{ fontSize: 12, color: '#10b981 !important' }} />}
              sx={{ height: 20, fontSize: '0.65rem' }}
            />
            <Chip
              label={`${release.openBugs} bugs`}
              size="small"
              icon={<BugReport sx={{ fontSize: 12, color: release.openBugs > 0 ? '#ef4444 !important' : '#94a3b8 !important' }} />}
              sx={{ height: 20, fontSize: '0.65rem', bgcolor: release.criticalBugs > 0 ? '#fee2e2' : undefined }}
            />
          </Box>
          <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 22, height: 22, fontSize: '0.6rem' } }}>
            {release.team.map((initial) => (
              <Avatar key={initial} sx={{ bgcolor: '#6366f1', width: 22, height: 22 }}>{initial}</Avatar>
            ))}
          </AvatarGroup>
        </Box>
      </Paper>
    </motion.div>
  );
};

const ReleaseDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const currentRelease = releases.find((r) => r.status === 'in-progress');
  const releasedCount = releases.filter((r) => r.status === 'released').length;
  const totalBugs = releases.reduce((s, r) => s + r.openBugs, 0);

  const tabs = [
    { label: 'Overview' },
    { label: 'Changelog' },
    { label: 'Release Notes' },
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Rocket color="primary" />
              <Typography variant="h4" fontWeight={700}>Release Dashboard</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Track releases, manage changelogs, and monitor deployment health
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<Refresh />} size="small" sx={{ borderRadius: 2 }}>
              Sync
            </Button>
            <Button variant="contained" startIcon={<Add />} size="small" sx={{ borderRadius: 2 }}>
              New Release
            </Button>
          </Box>
        </Box>
      </motion.div>

      {/* Critical bug alert */}
      {currentRelease && currentRelease.criticalBugs > 0 && (
        <Alert severity="error" sx={{ mb: 2 }} icon={<BugReport />}>
          <strong>{currentRelease.criticalBugs} critical bug(s)</strong> blocking release {currentRelease.version}. Review required before deployment.
        </Alert>
      )}

      {/* Summary Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Active Release', value: currentRelease?.version ?? '—', sub: `${currentRelease?.completionPct ?? 0}% complete`, color: '#6366f1', icon: <Rocket /> },
          { label: 'Released (90 days)', value: String(releasedCount), sub: 'versions shipped', color: '#10b981', icon: <CheckCircle /> },
          { label: 'Open Bugs', value: String(totalBugs), sub: `${releases.reduce((s, r) => s + r.criticalBugs, 0)} critical`, color: totalBugs > 10 ? '#ef4444' : '#f59e0b', icon: <BugReport /> },
          { label: 'Planned Releases', value: String(releases.filter((r) => r.status === 'planned').length), sub: 'upcoming', color: '#94a3b8', icon: <Timeline /> },
        ].map((stat, idx) => (
          <Grid item xs={6} sm={3} key={stat.label}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              whileHover={{ y: -2 }}
            >
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderTop: `3px solid ${stat.color}` }}>
                <Box sx={{ color: stat.color, mb: 0.5 }}>{stat.icon}</Box>
                <Typography variant="h5" fontWeight={700}>{stat.value}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">{stat.label}</Typography>
                <Typography variant="caption" color="text.disabled">{stat.sub}</Typography>
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
          {tabs.map((t) => (
            <Tab key={t.label} label={t.label} sx={{ minHeight: 48 }} />
          ))}
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Releases Grid */}
              <Grid container spacing={2}>
                {releases.map((release) => (
                  <Grid item xs={12} sm={6} key={release.id}>
                    <ReleaseCard release={release} />
                  </Grid>
                ))}
              </Grid>

              <Divider />

              {/* Charts */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Release Velocity (6 months)
                    </Typography>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={releaseVelocityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <RechartTooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="features" name="Features" fill="#10b981" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="bugs" name="Bug Fixes" fill="#ef4444" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Test Quality Gate
                    </Typography>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={qualityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          dataKey="value"
                          label={({ name, value }) => `${value}%`}
                          labelLine={false}
                          fontSize={11}
                        >
                          {qualityData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartTooltip formatter={(v: number) => `${v}%`} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {activeTab === 1 && <ChangelogViewer />}

          {activeTab === 2 && <ReleaseNoteEditor version={currentRelease?.version ?? 'v2.5.0'} />}
        </Box>
      </Paper>
    </Box>
  );
};

export default ReleaseDashboardPage;
