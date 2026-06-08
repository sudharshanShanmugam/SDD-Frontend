import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Grid, Card, CardContent, Typography, Avatar, AvatarGroup,
  Chip, Stack, LinearProgress, Divider, Tooltip, CircularProgress,
} from '@mui/material'
import {
  CheckCircleOutline, RadioButtonUnchecked, PlayCircleOutline,
  PeopleAlt, Assignment, AutoStories, AccountTree, EmojiEvents,
} from '@mui/icons-material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTip, ResponsiveContainer, Cell } from 'recharts'
import { useWorkspaceStore } from '@store/workspaceStore'
import { projectsApi } from '@api/projects'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ bgcolor: color + '18', borderRadius: 2, p: 1.5, display: 'flex', color }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function ProjectOverviewPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const project = useWorkspaceStore(s => s.currentProject)

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['project-stats', projectId],
    queryFn: () => projectsApi.getStats(projectId!),
    enabled: !!projectId,
    staleTime: 30_000,
  })

  const { data: members = [] } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => projectsApi.listMembers(projectId!),
    enabled: !!projectId,
    staleTime: 60_000,
  })

  if (statsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    )
  }

  const totalTasks = stats?.task_count ?? 0
  const doneTasks = stats?.completed_tasks ?? 0
  const inProgressTasks = stats?.in_progress_tasks ?? 0
  const todoTasks = stats?.todo_tasks ?? 0
  const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const taskStatusData = [
    { name: 'To Do', value: todoTasks, color: '#94a3b8' },
    { name: 'In Progress', value: inProgressTasks, color: '#6366f1' },
    { name: 'Done', value: doneTasks, color: '#10b981' },
    { name: 'Blocked', value: (stats?.task_by_status as any)?.blocked ?? 0, color: '#ef4444' },
    { name: 'Review', value: (stats?.task_by_status as any)?.review ?? 0, color: '#f59e0b' },
  ].filter(d => d.value > 0)

  const workload: any[] = stats?.workload ?? []

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>

      {/* Project header */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h4" fontWeight={700}>{project?.name ?? 'Project Overview'}</Typography>
            {project?.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, maxWidth: 680 }}>
                {project.description}
              </Typography>
            )}
            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap">
              {(project as any)?.status && (
                <Chip label={(project as any).status} size="small" color="primary" variant="outlined" />
              )}
              {(project as any)?.key && (
                <Chip label={(project as any).key} size="small" variant="outlined" />
              )}
            </Stack>
          </Box>

          {/* Team avatars */}
          {members.length > 0 && (
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                Team ({members.length})
              </Typography>
              <AvatarGroup max={6} sx={{ justifyContent: 'flex-end' }}>
                {members.map((m: any) => (
                  <Tooltip key={m.userId ?? m.user?.id} title={m.user?.full_name ?? m.user?.email ?? ''}>
                    <Avatar
                      src={m.user?.avatar_url}
                      sx={{ width: 34, height: 34, fontSize: '0.75rem', bgcolor: 'primary.main' }}
                    >
                      {(m.user?.full_name ?? m.user?.email ?? '?')[0].toUpperCase()}
                    </Avatar>
                  </Tooltip>
                ))}
              </AvatarGroup>
            </Box>
          )}
        </Stack>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Stat cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard icon={<Assignment />} label="Total Tasks" value={totalTasks} color="#6366f1" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard icon={<CheckCircleOutline />} label="Completed" value={doneTasks} color="#10b981" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard icon={<AutoStories />} label="Stories" value={stats?.story_count ?? 0} color="#f59e0b" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard icon={<AccountTree />} label="Epics" value={stats?.epic_count ?? 0} color="#8b5cf6" />
        </Grid>
      </Grid>

      {/* Completion bar */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>Overall Progress</Typography>
            <Typography variant="subtitle2" fontWeight={700} color="primary">{completionPct}%</Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={completionPct}
            sx={{ height: 10, borderRadius: 5, bgcolor: 'grey.200', '& .MuiLinearProgress-bar': { borderRadius: 5 } }}
          />
          <Stack direction="row" spacing={3} sx={{ mt: 1.5 }}>
            {[
              { icon: <RadioButtonUnchecked sx={{ fontSize: 13 }} />, label: `${todoTasks} To Do`, color: 'text.secondary' },
              { icon: <PlayCircleOutline sx={{ fontSize: 13 }} />, label: `${inProgressTasks} In Progress`, color: 'primary.main' },
              { icon: <CheckCircleOutline sx={{ fontSize: 13 }} />, label: `${doneTasks} Done`, color: 'success.main' },
            ].map(s => (
              <Stack key={s.label} direction="row" alignItems="center" spacing={0.5}>
                <Box sx={{ color: s.color, display: 'flex' }}>{s.icon}</Box>
                <Typography variant="caption" color={s.color}>{s.label}</Typography>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Task status chart */}
        {taskStatusData.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Task Status Breakdown</Typography>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={taskStatusData} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <RechartsTip cursor={{ fill: '#f8f8f8' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {taskStatusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Workload leaderboard */}
        {workload.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <EmojiEvents sx={{ color: '#f59e0b' }} />
                  <Typography variant="subtitle1" fontWeight={700}>Top Contributors</Typography>
                </Stack>
                <Stack spacing={1.5}>
                  {workload.slice(0, 6).map((w: any, i: number) => {
                    const pct = w.taskCount > 0 ? Math.round((w.completedCount / w.taskCount) * 100) : 0
                    return (
                      <Box key={w.userId}>
                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
                          <Avatar sx={{ width: 30, height: 30, fontSize: '0.7rem', bgcolor: COLORS[i % COLORS.length] }}>
                            {w.name?.[0]?.toUpperCase()}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="body2" fontWeight={600} noWrap>{w.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {w.completedCount}/{w.taskCount} tasks
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={pct}
                              sx={{
                                height: 5, borderRadius: 3, mt: 0.5,
                                bgcolor: 'grey.100',
                                '& .MuiLinearProgress-bar': { bgcolor: COLORS[i % COLORS.length], borderRadius: 3 },
                              }}
                            />
                          </Box>
                        </Stack>
                      </Box>
                    )
                  })}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Team members */}
        {members.length > 0 && (
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <PeopleAlt sx={{ color: '#6366f1' }} />
                  <Typography variant="subtitle1" fontWeight={700}>Team Members</Typography>
                </Stack>
                <Grid container spacing={1.5}>
                  {members.map((m: any) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={m.userId ?? m.user?.id}>
                      <Stack direction="row" spacing={1.5} alignItems="center"
                        sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'grey.50' }}>
                        <Avatar src={m.user?.avatar_url} sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.8rem' }}>
                          {(m.user?.full_name ?? m.user?.email ?? '?')[0].toUpperCase()}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {m.user?.full_name ?? m.user?.email}
                          </Typography>
                          <Chip label={m.role} size="small"
                            sx={{ height: 18, fontSize: '0.6rem', mt: 0.25 }} />
                        </Box>
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}
