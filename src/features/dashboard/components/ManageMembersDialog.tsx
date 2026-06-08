import { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Avatar, Stack, Typography, IconButton, Select,
  MenuItem, FormControl, InputLabel, Divider, Box, Chip,
  CircularProgress, Tooltip, Alert,
} from '@mui/material'
import { PersonAdd, Delete, Edit, Check, Close } from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '@api/projects'

const ROLES = ['owner', 'manager', 'developer', 'viewer']

interface Props {
  open: boolean
  onClose: () => void
  projectId: string
}

export default function ManageMembersDialog({ open, onClose, projectId }: Props) {
  const qc = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState('')
  const [addUserId, setAddUserId] = useState('')
  const [addRole, setAddRole] = useState('developer')
  const [error, setError] = useState('')

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => projectsApi.listMembers(projectId),
    enabled: open && !!projectId,
  })

  const { data: wsMembers = [] } = useQuery({
    queryKey: ['workspace-members-for-project', projectId],
    queryFn: () => projectsApi.listWorkspaceMembers(projectId),
    enabled: open && !!projectId,
  })

  const memberIds = new Set((members as any[]).map((m: any) => m.userId ?? m.user?.id))
  const addableUsers = (wsMembers as any[]).filter((m: any) => !memberIds.has(m.userId))

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['project-members', projectId] })
    qc.invalidateQueries({ queryKey: ['project-stats', projectId] })
  }

  const addMutation = useMutation({
    mutationFn: () => projectsApi.addMember(projectId, addUserId, addRole),
    onSuccess: () => { invalidate(); setAddUserId(''); setError('') },
    onError: (e: any) => setError(e?.response?.data?.detail ?? 'Failed to add member'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      projectsApi.updateMember(projectId, userId, role),
    onSuccess: () => { invalidate(); setEditingId(null); setError('') },
    onError: (e: any) => setError(e?.response?.data?.detail ?? 'Failed to update role'),
  })

  const removeMutation = useMutation({
    mutationFn: (userId: string) => projectsApi.removeMember(projectId, userId),
    onSuccess: () => { invalidate(); setError('') },
    onError: (e: any) => setError(e?.response?.data?.detail ?? 'Failed to remove member'),
  })

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={700}>Manage Team Members</Typography>
          <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* Add member row */}
        {addableUsers.length > 0 && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
              <PersonAdd sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              Add Member
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Select person</InputLabel>
                <Select value={addUserId} label="Select person" onChange={e => setAddUserId(e.target.value)}>
                  {addableUsers.map((m: any) => (
                    <MenuItem key={m.userId} value={m.userId}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem', bgcolor: 'primary.main' }}>
                          {(m.user?.displayName ?? m.user?.email ?? '?')[0].toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{m.user?.displayName}</Typography>
                          <Typography variant="caption" color="text.secondary">{m.user?.email}</Typography>
                        </Box>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ width: 130 }}>
                <InputLabel>Role</InputLabel>
                <Select value={addRole} label="Role" onChange={e => setAddRole(e.target.value)}>
                  {ROLES.map(r => <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>{r}</MenuItem>)}
                </Select>
              </FormControl>
              <Button
                variant="contained" size="small" disabled={!addUserId || addMutation.isPending}
                onClick={() => addMutation.mutate()}
                sx={{ whiteSpace: 'nowrap', minWidth: 80 }}
              >
                {addMutation.isPending ? <CircularProgress size={16} /> : 'Add'}
              </Button>
            </Stack>
          </Box>
        )}

        <Divider sx={{ mb: 1 }} />

        {/* Existing members */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (members as any[]).length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No members yet.
          </Typography>
        ) : (
          <Stack spacing={1} sx={{ mt: 1 }}>
            {(members as any[]).map((m: any) => {
              const uid = m.userId ?? m.user?.id
              const name = m.user?.full_name ?? m.user?.displayName ?? m.user?.email ?? uid
              const isEditing = editingId === uid

              return (
                <Stack
                  key={uid}
                  direction="row" alignItems="center" spacing={1.5}
                  sx={{ p: 1.5, border: '1px solid', borderColor: isEditing ? 'primary.main' : 'divider', borderRadius: 2, transition: 'border-color 0.15s' }}
                >
                  <Avatar src={m.user?.avatar_url} sx={{ width: 36, height: 36, fontSize: '0.8rem', bgcolor: 'primary.main' }}>
                    {name[0].toUpperCase()}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>{name}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>{m.user?.email}</Typography>
                  </Box>

                  {isEditing ? (
                    <FormControl size="small" sx={{ width: 130 }}>
                      <Select value={editRole} onChange={e => setEditRole(e.target.value)}>
                        {ROLES.map(r => <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>{r}</MenuItem>)}
                      </Select>
                    </FormControl>
                  ) : (
                    <Chip label={m.role} size="small" variant="outlined" sx={{ textTransform: 'capitalize', minWidth: 70 }} />
                  )}

                  {isEditing ? (
                    <Stack direction="row">
                      <Tooltip title="Save">
                        <IconButton size="small" color="primary" onClick={() => updateMutation.mutate({ userId: uid, role: editRole })}>
                          {updateMutation.isPending ? <CircularProgress size={16} /> : <Check fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cancel">
                        <IconButton size="small" onClick={() => setEditingId(null)}><Close fontSize="small" /></IconButton>
                      </Tooltip>
                    </Stack>
                  ) : (
                    <Stack direction="row">
                      <Tooltip title="Edit role">
                        <IconButton size="small" onClick={() => { setEditingId(uid); setEditRole(m.role) }}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove">
                        <IconButton size="small" color="error" onClick={() => removeMutation.mutate(uid)}
                          disabled={removeMutation.isPending}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  )}
                </Stack>
              )
            })}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
