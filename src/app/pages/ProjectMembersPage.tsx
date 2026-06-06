import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Typography, Button, Avatar, Chip, Stack, IconButton,
  Select, MenuItem, FormControl, Dialog, DialogTitle,
  DialogContent, DialogActions, Autocomplete, TextField,
  CircularProgress, Alert, Divider, Tooltip,
} from '@mui/material'
import { PersonAdd, Delete } from '@mui/icons-material'
import { projectsApi } from '@/api/projects'
import { organizationsApi } from '@/api/organizations'
import { useAuthStore } from '@store/authStore'
import type { ProjectMember } from '@/types/project.types'
import type { OrgMember } from '@/types'

type ProjectRole = 'owner' | 'manager' | 'developer' | 'viewer'

const ROLE_COLORS: Record<ProjectRole, string> = {
  owner:     '#6366f1',
  manager:   '#10b981',
  developer: '#f59e0b',
  viewer:    '#94a3b8',
}

const ROLE_LABELS: Record<ProjectRole, string> = {
  owner:     'Owner',
  manager:   'Manager',
  developer: 'Developer',
  viewer:    'Viewer',
}

export default function ProjectMembersPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const qc = useQueryClient()
  const currentUser  = useAuthStore(s => s.user)
  const organization = useAuthStore(s => s.organization)

  const [addOpen,  setAddOpen]  = useState(false)
  const [selected, setSelected] = useState<OrgMember | null>(null)
  const [newRole,  setNewRole]  = useState<ProjectRole>('developer')

  const { data: members = [], isLoading, error } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn:  () => projectsApi.listMembers(projectId!),
    enabled:  !!projectId,
  })

  const { data: orgMembersPage } = useQuery({
    queryKey: ['org-members', organization?.id],
    queryFn:  () => organizationsApi.listMembers(organization!.id),
    enabled:  !!organization?.id && addOpen,
  })

  const alreadyAdded = new Set((members as ProjectMember[]).map(m => m.userId))
  const orgMembersList: OrgMember[] = Array.isArray(orgMembersPage)
    ? orgMembersPage
    : (orgMembersPage as any)?.data ?? []
  const candidates = orgMembersList.filter(om => !alreadyAdded.has(om.userId))

  const addMember = useMutation({
    mutationFn: () => projectsApi.addMember(projectId!, selected!.userId, newRole),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-members', projectId] })
      setAddOpen(false)
      setSelected(null)
      setNewRole('contributor')
    },
  })

  const updateRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      projectsApi.updateMember(projectId!, userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project-members', projectId] }),
  })

  const removeMember = useMutation({
    mutationFn: (userId: string) => projectsApi.removeMember(projectId!, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project-members', projectId] }),
  })

  const currentMember = members.find((m: ProjectMember) => m.userId === currentUser?.id)
  const canManage = ['owner', 'manager'].includes(currentMember?.role ?? '') || currentUser?.roles?.includes('super_admin') || currentUser?.roles?.includes('org_admin')

  return (
    <Box sx={{ p: 3, maxWidth: 760 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Project Members</Typography>
          <Typography variant="body2" color="text.secondary">
            {members.length} member{members.length !== 1 ? 's' : ''} with access to this project
          </Typography>
        </Box>
        {canManage && (
          <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setAddOpen(true)}>
            Add Member
          </Button>
        )}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load members</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <Stack divider={<Divider />}>
          {members.map((member: ProjectMember) => {
            const isMe    = member.userId === currentUser?.id
            const isOwner = member.role === 'owner'

            return (
              <Stack key={member.id} direction="row" alignItems="center" spacing={2} sx={{ py: 1.5 }}>
                <Avatar
                  src={member.user.avatar ?? undefined}
                  alt={member.user.displayName}
                  sx={{ width: 36, height: 36, fontSize: '0.85rem' }}
                >
                  {member.user.displayName?.[0]?.toUpperCase()}
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {member.user.displayName}
                    </Typography>
                    {isMe && (
                      <Chip label="You" size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {member.user.email}
                  </Typography>
                </Box>

                {canManage && !isMe ? (
                  <FormControl size="small" sx={{ minWidth: 130 }}>
                    <Select
                      value={member.role}
                      onChange={e => updateRole.mutate({ userId: member.userId, role: e.target.value })}
                      sx={{ fontSize: '0.8125rem' }}
                    >
                      {(Object.keys(ROLE_LABELS) as ProjectRole[]).map(r => (
                        <MenuItem key={r} value={r} sx={{ fontSize: '0.8125rem' }}>
                          {ROLE_LABELS[r]}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <Chip
                    label={ROLE_LABELS[member.role as ProjectRole] ?? member.role}
                    size="small"
                    sx={{
                      bgcolor: (ROLE_COLORS[member.role as ProjectRole] ?? '#94a3b8') + '20',
                      color:    ROLE_COLORS[member.role as ProjectRole] ?? '#94a3b8',
                      fontWeight: 700, fontSize: '0.7rem',
                    }}
                  />
                )}

                {canManage && !isMe && !isOwner && (
                  <Tooltip title="Remove member">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeMember.mutate(member.userId)}
                      disabled={removeMember.isPending}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            )
          })}
        </Stack>
      )}

      {/* Add Member Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add Member</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Autocomplete
              options={candidates}
              getOptionLabel={(o: OrgMember) => `${o.user?.displayName ?? o.userId} (${o.user?.email ?? ''})`}
              value={selected}
              onChange={(_, v) => setSelected(v)}
              renderInput={params => <TextField {...params} label="Search member" size="small" />}
              noOptionsText={orgMembersPage ? 'All org members already added' : 'Loading…'}
            />
            <FormControl size="small" fullWidth>
              <Select
                value={newRole}
                onChange={e => setNewRole(e.target.value as ProjectRole)}
              >
                {(Object.keys(ROLE_LABELS) as ProjectRole[]).map(r => (
                  <MenuItem key={r} value={r}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ROLE_COLORS[r] }} />
                      <Box>
                        <Typography variant="body2">{ROLE_LABELS[r]}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {r === 'owner'     && 'Full control including deletion and ownership transfer'}
                          {r === 'manager'   && 'Can manage members, workflow, and settings'}
                          {r === 'developer' && 'Can create and edit sprints, tasks, and stories'}
                          {r === 'viewer'    && 'Read-only access to project content'}
                        </Typography>
                      </Box>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!selected || addMember.isPending}
            onClick={() => addMember.mutate()}
            startIcon={addMember.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
