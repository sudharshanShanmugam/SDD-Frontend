import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { Add, Refresh } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import StatsGrid from '../components/StatsGrid';
import ActivityFeed, { type ActivityEvent } from '../components/ActivityFeed';
import WorkflowProgress from '../components/WorkflowProgress';
import CreateProjectDialog from '../components/CreateProjectDialog';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { get } from '@/api/client';
import { useWorkspaceStore } from '@store/workspaceStore';

// ─── helpers ─────────────────────────────────────────────────────────────────

function buildTrendData(total: number, days = 7) {
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const frac = (days - i) / days;
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.round(total * frac),
    });
  }
  return data;
}

// ─── component ───────────────────────────────────────────────────────────────

const OrgDashboardPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);

  const currentProject = useWorkspaceStore(s => s.currentProject);

  // 1. Dashboard analytics
  const { data: analytics, isLoading: loadingAnalytics, isError: errorAnalytics, refetch: refetchAll } = useQuery({
    queryKey: ['dashboard', 'analytics'],
    queryFn: () => get<{ total_projects: number; active_sprints: number }>('/analytics/dashboard'),
  });

  // 2. Project list (fallback if no currentProject in store)
  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ['dashboard', 'projects'],
    queryFn: () => get<any>('/projects'),
    enabled: !currentProject,
  });

  const projectId: string | null =
    currentProject?.id ?? projectsData?.data?.[0]?.id ?? projectsData?.[0]?.id ?? null;

  // 3. Requirements count
  const { data: reqData, isLoading: loadingReq } = useQuery({
    queryKey: ['dashboard', 'requirements', projectId],
    queryFn: () => get<any>(`/requirements?project_id=${projectId}&page_size=1`),
    enabled: !!projectId,
  });

  // 4. Stories count
  const { data: storiesData, isLoading: loadingStories } = useQuery({
    queryKey: ['dashboard', 'stories', projectId],
    queryFn: () => get<any>(`/stories?project_id=${projectId}&page_size=1`),
    enabled: !!projectId,
  });

  // 5. Tasks count
  const { data: tasksData, isLoading: loadingTasks } = useQuery({
    queryKey: ['dashboard', 'tasks', projectId],
    queryFn: () => get<any>(`/tasks?project_id=${projectId}&page_size=1`),
    enabled: !!projectId,
  });

  // 6. Recent documents for activity feed
  const { data: recentDocs } = useQuery({
    queryKey: ['dashboard', 'recent-docs', projectId],
    queryFn: () => get<any>(`/documents?project_id=${projectId}&page_size=5`),
    enabled: !!projectId,
  });

  // 7. Recent requirements for activity feed
  const { data: recentReqs } = useQuery({
    queryKey: ['dashboard', 'recent-reqs', projectId],
    queryFn: () => get<any>(`/requirements?project_id=${projectId}&page_size=5`),
    enabled: !!projectId,
  });

  // 8. Recent stories for activity feed
  const { data: recentStories } = useQuery({
    queryKey: ['dashboard', 'recent-stories', projectId],
    queryFn: () => get<any>(`/stories?project_id=${projectId}&page_size=5`),
    enabled: !!projectId,
  });

  const isLoading =
    loadingAnalytics ||
    loadingProjects ||
    (!!projectId && (loadingReq || loadingStories || loadingTasks));

  // Build activity feed from real data
  const activityEvents: ActivityEvent[] = [
    ...((recentDocs?.data ?? recentDocs?.items ?? []) as any[]).map((d: any) => ({
      id: `doc-${d.id}`,
      type: 'document_upload' as const,
      title: d.original_filename ?? d.name ?? 'Document uploaded',
      description: `${d.page_count ?? 1} page${d.page_count !== 1 ? 's' : ''} • ${((d.file_size_bytes ?? 0) / 1024).toFixed(0)} KB`,
      timestamp: d.created_at,
    })),
    ...((recentReqs?.data ?? recentReqs?.items ?? []) as any[]).map((r: any) => ({
      id: `req-${r.id}`,
      type: 'requirement_extracted' as const,
      title: r.title ?? 'Requirement extracted',
      description: r.description?.slice(0, 80) ?? undefined,
      timestamp: r.createdAt ?? r.created_at,
    })),
    ...((recentStories?.data ?? recentStories?.items ?? []) as any[]).map((s: any) => ({
      id: `story-${s.id}`,
      type: 'ai_generated' as const,
      title: s.title ?? 'Story generated',
      description: s.identifier ? `${s.identifier} • ${s.storyPoints ?? 0} pts` : undefined,
      timestamp: s.createdAt ?? s.created_at,
    })),
  ]
    .filter(e => e.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  const reqTotal: number = reqData?.meta?.total ?? 0;
  const storyTotal: number = storiesData?.meta?.total ?? 0;
  const taskTotal: number = tasksData?.meta?.total ?? 0;

  const trendDatasets = [
    buildTrendData(reqTotal),
    buildTrendData(storyTotal),
    buildTrendData(taskTotal),
  ];

  const chartData = trendDatasets[tabValue];

  const aiSummaryItems = [
    { label: 'Requirements extracted', value: reqTotal,   color: '#6366f1' },
    { label: 'Stories generated',      value: storyTotal, color: '#10b981' },
    { label: 'Test cases created',      value: 0,          color: '#f59e0b' },
    { label: 'Tasks decomposed',        value: taskTotal,  color: '#3b82f6' },
  ];

  const maxAI = Math.max(...aiSummaryItems.map(i => i.value), 1);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 4,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Organization Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              Overview of all workspaces, projects, and AI activity
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => refetchAll()}
              disabled={isLoading}
              sx={{ borderRadius: 2 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              sx={{ borderRadius: 2 }}
              onClick={() => setCreateOpen(true)}
            >
              New Project
            </Button>
          </Box>
        </Box>
      </motion.div>

      {errorAnalytics && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load dashboard data.
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <StatsGrid loading={isLoading} />
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Weekly Activity Trend
              </Typography>
              <Tabs
                value={tabValue}
                onChange={(_, v) => setTabValue(v)}
                textColor="primary"
                indicatorColor="primary"
                sx={{ '& .MuiTab-root': { minHeight: 36, py: 0, fontSize: '0.8rem' } }}
              >
                <Tab label="Requirements" />
                <Tab label="Stories" />
                <Tab label="Tasks" />
              </Tabs>
            </Box>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#6366f1"
                    fill="url(#colorReq)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
              Active Project Progress
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              SDLC workflow stages
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {!isLoading && (
              <WorkflowProgress
                currentStage="document_upload"
                completedStages={[]}
                stageCounts={{ requirements: reqTotal, stories: storyTotal }}
              />
            )}
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ActivityFeed loading={isLoading} events={activityEvents} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              AI Generation Summary
            </Typography>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {aiSummaryItems.map((item) => (
                  <Box key={item.label}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {item.label}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {item.value.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        height: 8,
                        borderRadius: 1,
                        bgcolor: 'action.hover',
                        overflow: 'hidden',
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (item.value / maxAI) * 100)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{ height: '100%', backgroundColor: item.color, borderRadius: 4 }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <CreateProjectDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </Box>
  );
};

export default OrgDashboardPage;
