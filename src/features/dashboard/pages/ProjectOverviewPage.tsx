import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Grid, Card, CardContent, Typography, Avatar, AvatarGroup,
  Chip, Stack, LinearProgress, Divider, Tooltip, CircularProgress, Button,
} from '@mui/material'
import {
  CheckCircleOutline, RadioButtonUnchecked, PlayCircleOutline,
  Assignment, AutoStories, EmojiEvents, GroupAdd, PeopleAlt,
} from '@mui/icons-material'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTip, ResponsiveContainer, Cell,
} from 'recharts'
import { useWorkspaceStore } from '@store/workspaceStore'
import { projectsApi } from '@api/projects'
import ManageMembersDialog from '../components/ManageMembersDialog'

const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

function StatCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode; label: string; value: number | string; color: string
}) {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%', borderRadius: 3 }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ bgcolor: color + '15', borderRadius: 2, p: 1.25, display: 'flex', color }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} lineHeight={1}>{value}</Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>{label}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default function ProjectOverviewPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const project = useWorkspaceStore(s => s.currentProject)
  const [manageOpen, setManageOpen] = useState(false)

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

  const totalTasks      = stats?.task_count ?? 0
  const doneTasks       = stats?.completed_tasks ?? 0
  const inProgressTasks = stats?.in_progress_tasks ?? 0
  const todoTasks       = stats?.todo_tasks ?? 0
  const completionPct   = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const taskStatusData = [
    { name: 'To Do',       value: todoTasks,                                         color: '#94a3b8' },
    { name: 'In Progress', value: inProgressTasks,                                   color: '#6366f1' },
    { name: 'Done',        value: doneTasks,                                         color: '#10b981' },
    { name: 'Blocked',     value: (stats?.task_by_status as any)?.blocked ?? 0,     color: '#ef4444' },
    { name: 'Review',      value: (stats?.task_by_status as any)?.review  ?? 0,     color: '#f59e0b' },
  ].filter(d => d.value > 0)

  const workload: any[] = stats?.workload ?? []

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        gap={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={800} gutterBottom={false}>
            {project?.name ?? 'Project Overview'}
          </Typography>
          {(project as any)?.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 580 }}>
              {(project as any).description}
            </Typography>
          )}
          <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
            {(project as any)?.status && (
              <Chip label={(project as any).status} size="small" color="primary" />
            )}
            {(project as any)?.key && (
              <Chip label={(project as any).key} size="small" variant="outlined" />
            )}
          </Stack>
        </Box>

        <Stack direction="row" alignItems="center" spacing={1.5} flexShrink={0}>
          {(members as any[]).length > 0 && (
            <AvatarGroup max={5} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: '0.72rem' } }}>
              {(members as any[]).map((m: any) => (
                <Tooltip key={m.userId ?? m.user?.id} title={m.user?.full_name ?? m.user?.email ?? ''}>
                  <Avatar src={m.user?.avatar_url} sx={{ bgcolor: 'primary.main' }}>
                    {(m.user?.full_name ?? m.user?.email ?? '?')[0].toUpperCase()}
                  </Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
          )}
          <Button
            variant="contained" size="small" startIcon={<GroupAdd />}
            onClick={() => setManageOpen(true)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Manage Team
          </Button>
        </Stack>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* ── Stat cards ─────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <StatCard icon={<Assignment />}          label="Total Tasks" value={totalTasks}              color="#6366f1" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={<CheckCircleOutline />}  label="Completed"   value={doneTasks}               color="#10b981" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={<AutoStories />}         label="Stories"     value={stats?.story_count ?? 0} color="#f59e0b" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={<PeopleAlt />}           label="Members"     value={(members as any[]).length} color="#8b5cf6" />
        </Grid>
      </Grid>

      {/* ── Progress bar ────────────────────────────────────────── */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={700}>Overall Progress</Typography>
            <Chip
              label={`${completionPct}% complete`}
              size="small"
              color={completionPct === 100 ? 'success' : 'primary'}
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          </Stack>
          <LinearProgress
            variant="determinate"
            value={completionPct}
            sx={{
              height: 12, borderRadius: 6, bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': { borderRadius: 6 },
            }}
          />
          <Stack direction="row" spacing={3} sx={{ mt: 1.5 }} flexWrap="wrap">
            {[
              { icon: <RadioButtonUnchecked sx={{ fontSize: 14 }} />, label: `${todoTasks} To Do`,           color: 'text.secondary' },
              { icon: <PlayCircleOutline    sx={{ fontSize: 14 }} />, label: `${inProgressTasks} In Progress`, color: 'primary.main'   },
              { icon: <CheckCircleOutline   sx={{ fontSize: 14 }} />, label: `${doneTasks} Done`,             color: 'success.main'   },
            ].map(s => (
              <Stack key={s.label} direction="row" alignItems="center" spacing={0.5}>
                <Box sx={{ color: s.color, display: 'flex' }}>{s.icon}</Box>
                <Typography variant="caption" color={s.color} fontWeight={500}>{s.label}</Typography>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3}>

        {/* ── Task status chart ───────────────────────────────── */}
        {taskStatusData.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Task Status Breakdown</Typography>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={taskStatusData} barSize={40} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <RechartsTip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {taskStatusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* ── Top contributors ────────────────────────────────── */}
        {workload.length > 0 && (
          <Grid item xs={12} md={taskStatusData.length > 0 ? 6 : 12}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <EmojiEvents sx={{ color: '#f59e0b', fontSize: 20 }} />
                  <Typography variant="subtitle1" fontWeight={700}>Top Contributors</Typography>
                </Stack>
                <Stack spacing={2}>
                  {workload.slice(0, 5).map((w: any, i: number) => {
                    const pct = w.taskCount > 0 ? Math.round((w.completedCount / w.taskCount) * 100) : 0
                    return (
                      <Box key={w.userId}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: PALETTE[i % PALETTE.length], flexShrink: 0 }}>
                            {w.name?.[0]?.toUpperCase() ?? '?'}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" fontWeight={600} noWrap>{w.name}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 1, flexShrink: 0 }}>
                                {w.completedCount}/{w.taskCount}
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={pct}
                              sx={{
                                height: 6, borderRadius: 3, mt: 0.5, bgcolor: 'grey.100',
                                '& .MuiLinearProgress-bar': { bgcolor: PALETTE[i % PALETTE.length], borderRadius: 3 },
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

        {/* ── Team members grid ───────────────────────────────── */}
        {(members as any[]).length > 0 && (
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PeopleAlt sx={{ color: '#6366f1', fontSize: 20 }} />
                    <Typography variant="subtitle1" fontWeight={700}>
                      Team Members ({(members as any[]).length})
                    </Typography>
                  </Stack>
                  <Button
                    size="small" variant="outlined" startIcon={<GroupAdd />}
                    onClick={() => setManageOpen(true)}
                    sx={{ borderRadius: 2, textTransform: 'none' }}
                  >
                    Edit Team
                  </Button>
                </Stack>
                <Grid container spacing={1.5}>
                  {(members as any[]).map((m: any) => {
                    const name  = m.user?.full_name ?? m.user?.displayName ?? m.user?.email ?? '—'
                    const email = m.user?.email ?? ''
                    const uid   = m.userId ?? m.user?.id
                    return (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={uid}>
                        <Stack
                          direction="row" spacing={1.5} alignItems="center"
                          sx={{
                            p: 1.5, border: '1px solid', borderColor: 'divider',
                            borderRadius: 2, bgcolor: 'grey.50', height: '100%',
                          }}
                        >
                          <Avatar src={m.user?.avatar_url} sx={{ width: 38, height: 38, bgcolor: 'primary.main', fontSize: '0.85rem', flexShrink: 0 }}>
                            {name[0].toUpperCase()}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} noWrap>{name}</Typography>
                            <Typography variant="caption" color="text.secondary" noWrap display="block">{email}</Typography>
                            <Chip
                              label={m.role}
                              size="small"
                              sx={{ height: 18, fontSize: '0.6rem', mt: 0.5, textTransform: 'capitalize' }}
                            />
                          </Box>
                        </Stack>
                      </Grid>
                    )
                  })}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

      </Grid>

      {/* ── Manage members dialog ───────────────────────────────── */}
      {projectId && (
        <ManageMembersDialog
          open={manageOpen}
          onClose={() => setManageOpen(false)}
          projectId={projectId}
        />
      )}
    </Box>
  )
}
