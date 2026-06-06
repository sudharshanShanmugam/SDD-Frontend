/**
 * ApprovalQueuePage — API-integrated approval review interface.
 *
 * Left panel: list of approvals (filterable by status tab).
 * Right panel: detail drawer for the selected approval with approve/reject actions.
 * Mutations call approvalsApi.decide() under the hood.
 */
import React, { useState } from 'react'
import {
  Alert,
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import {
  Cancel,
  CheckCircle,
  Close,
  ExpandLess,
  ExpandMore,
  PendingActions,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { useParams } from 'react-router-dom'
import { PageHeader } from '@/shared/components/PageHeader'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { EmptyState } from '@/shared/components/EmptyState'
import { approvalsApi } from '@/api/approvals'
import { useUIStore } from '@/store'
import type { Approval, ApprovalStatus } from '@/types/approval.types'

// ── Tab config ────────────────────────────────────────────────

const TABS: { label: string; status: ApprovalStatus | 'all' }[] = [
  { label: 'Pending',  status: 'pending'  },
  { label: 'Approved', status: 'approved' },
  { label: 'Rejected', status: 'rejected' },
  { label: 'All',      status: 'all'      },
]

// ── Approval List Item ───────────────────────────────────────

function ApprovalListItem({
  approval,
  selected,
  onClick,
}: {
  approval: Approval
  selected: boolean
  onClick: () => void
}): React.JSX.Element {
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 2,
        mb: 1.5,
        cursor: 'pointer',
        borderRadius: 2,
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? 'primary.50' : 'background.paper',
        transition: 'all 0.15s ease',
        '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={600} noWrap gutterBottom>
            {approval.entityName}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Chip
              label={approval.entityType.replace(/_/g, ' ')}
              size="small"
              sx={{ fontSize: '0.6875rem', height: 20, textTransform: 'capitalize' }}
            />
            <StatusBadge status={approval.status} size="small" />
          </Stack>
        </Box>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Requested by {approval.requester.displayName}
        {' · '}
        {new Date(approval.createdAt).toLocaleDateString(undefined, {
          month: 'short', day: 'numeric',
        })}
      </Typography>

      {approval.dueDate && (
        <Typography variant="caption" color="warning.main" sx={{ display: 'block' }}>
          Due {new Date(approval.dueDate).toLocaleDateString()}
        </Typography>
      )}
    </Paper>
  )
}

// ── Detail Panel ─────────────────────────────────────────────

function ApprovalDetailPanel({
  approval,
  onClose,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  approval: Approval
  onClose: () => void
  onApprove: (comment: string) => void
  onReject: (comment: string) => void
  isApproving: boolean
  isRejecting: boolean
}): React.JSX.Element {
  const [comment, setComment] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)

  const canReject = comment.trim().length > 0

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box sx={{ flex: 1, pr: 2 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            {approval.entityName}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={approval.entityType.replace(/_/g, ' ')}
              size="small"
              sx={{ textTransform: 'capitalize', fontSize: '0.75rem' }}
            />
            <StatusBadge status={approval.status} />
          </Stack>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close fontSize="small" />
        </IconButton>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* Metadata */}
      <Stack spacing={0.75} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={4}>
          <Box>
            <Typography variant="caption" color="text.secondary">Requested by</Typography>
            <Typography variant="body2" fontWeight={500}>{approval.requester.displayName}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Required approvals</Typography>
            <Typography variant="body2" fontWeight={500}>
              {approval.receivedApprovals} / {approval.requiredApprovals}
            </Typography>
          </Box>
          {approval.dueDate && (
            <Box>
              <Typography variant="caption" color="text.secondary">Due date</Typography>
              <Typography variant="body2" fontWeight={500} color="warning.main">
                {new Date(approval.dueDate).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </Stack>
      </Stack>

      {/* Comment on approval */}
      {approval.comment && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2, fontSize: '0.875rem' }}>
          {approval.comment}
        </Alert>
      )}

      {/* Approvers list */}
      {approval.approvers.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Approvers
          </Typography>
          <Stack spacing={0.75}>
            {approval.approvers.map((approver) => (
              <Stack
                key={approver.id}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="body2">{approver.user.displayName}</Typography>
                <StatusBadge
                  status={approver.decision ?? 'pending'}
                  size="small"
                />
              </Stack>
            ))}
          </Stack>
        </Box>
      )}

      <Divider sx={{ mb: 2 }} />

      {/* History toggle */}
      {approval.history.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ cursor: 'pointer', mb: historyOpen ? 1 : 0 }}
            onClick={() => setHistoryOpen((v) => !v)}
          >
            <Typography variant="subtitle2" fontWeight={600}>
              History ({approval.history.length})
            </Typography>
            <IconButton size="small">
              {historyOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </IconButton>
          </Stack>

          <AnimatePresence>
            {historyOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Stack spacing={1} sx={{ pb: 1 }}>
                  {approval.history.map((entry) => (
                    <Stack key={entry.id} direction="row" alignItems="flex-start" spacing={1.5}>
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          mt: 0.75,
                          flexShrink: 0,
                        }}
                      />
                      <Box>
                        <Typography variant="caption" fontWeight={500}>
                          {entry.user.displayName}
                        </Typography>{' '}
                        <Typography variant="caption" color="text.secondary">
                          {entry.action}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                          {new Date(entry.timestamp).toLocaleString()}
                        </Typography>
                        {entry.comment && (
                          <Typography
                            variant="caption"
                            sx={{ fontStyle: 'italic', color: 'text.secondary', display: 'block' }}
                          >
                            &ldquo;{entry.comment}&rdquo;
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      )}

      <Box sx={{ flex: 1 }} />

      {/* Actions — only show for pending approvals */}
      {approval.status === 'pending' && (
        <>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Your Decision
          </Typography>
          <TextField
            multiline
            rows={3}
            fullWidth
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment (required for rejection)..."
            size="small"
            sx={{ mb: 2 }}
          />
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => onApprove(comment)}
              disabled={isApproving || isRejecting}
              sx={{ flex: 1 }}
            >
              {isApproving ? 'Approving...' : 'Approve'}
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Cancel />}
              onClick={() => onReject(comment)}
              disabled={!canReject || isApproving || isRejecting}
              sx={{ flex: 1 }}
            >
              {isRejecting ? 'Rejecting...' : 'Reject'}
            </Button>
          </Stack>
        </>
      )}
    </Box>
  )
}

// ── Page ─────────────────────────────────────────────────────

export function ApprovalQueuePage(): React.JSX.Element {
  const { projectId } = useParams<{ projectId: string }>()
  const queryClient = useQueryClient()
  const toast = useUIStore((s) => s.toast)

  const [tab, setTab] = useState(0)
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null)

  const activeTab = TABS[tab]!

  const queryKey = ['approvals', projectId ?? 'global', activeTab.status]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      projectId
        ? approvalsApi.listForProject(projectId, {
            filters: activeTab.status !== 'all'
              ? [{ field: 'status', operator: 'eq', value: activeTab.status }]
              : [],
          })
        : approvalsApi.list({
            filters: activeTab.status !== 'all'
              ? [{ field: 'status', operator: 'eq', value: activeTab.status }]
              : [],
          }),
    staleTime: 15_000,
  })

  // Pending count (always fetched regardless of tab)
  const { data: pendingData } = useQuery({
    queryKey: ['approvals', projectId ?? 'global', 'pending', 'count'],
    queryFn: () =>
      projectId
        ? approvalsApi.listForProject(projectId, {
            filters: [{ field: 'status', operator: 'eq', value: 'pending' }],
          })
        : approvalsApi.list({
            filters: [{ field: 'status', operator: 'eq', value: 'pending' }],
          }),
    staleTime: 15_000,
  })
  const pendingCount = pendingData?.meta.total ?? 0

  const approveMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      approvalsApi.decide({
        approvalId: id,
        decision: 'approved',
        comment: comment || undefined,
      }),
    onSuccess: () => {
      toast.success('Approval granted')
      void queryClient.invalidateQueries({ queryKey: ['approvals'] })
      setSelectedApproval(null)
    },
    onError: () => toast.error('Failed to approve'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      approvalsApi.decide({
        approvalId: id,
        decision: 'rejected',
        comment,
      }),
    onSuccess: () => {
      toast.success('Item rejected')
      void queryClient.invalidateQueries({ queryKey: ['approvals'] })
      setSelectedApproval(null)
    },
    onError: () => toast.error('Failed to reject'),
  })

  const approvals: Approval[] = data?.data ?? []

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Approval Queue"
        subtitle="Review and approve AI-generated artifacts before they advance in the pipeline"
        badge={
          pendingCount > 0 ? (
            <Chip label={`${pendingCount} pending`} color="warning" size="small" />
          ) : undefined
        }
      />

      {/* Tab bar */}
      <Tabs
        value={tab}
        onChange={(_, v: number) => { setTab(v); setSelectedApproval(null) }}
        sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}
      >
        {TABS.map((t, i) => (
          <Tab
            key={t.status}
            label={
              i === 0 && pendingCount > 0 ? (
                <Badge badgeContent={pendingCount} color="warning">
                  <Box sx={{ pr: 2 }}>{t.label}</Box>
                </Badge>
              ) : (
                t.label
              )
            }
          />
        ))}
      </Tabs>

      {isLoading && <LinearProgress sx={{ mb: 1 }} />}

      {/* Content */}
      <Box sx={{ flex: 1, display: 'flex', gap: 2, overflow: 'hidden' }}>
        {/* Approval list */}
        <Box
          sx={{
            flex: selectedApproval ? '0 0 380px' : 1,
            overflowY: 'auto',
            transition: 'flex 0.2s ease',
          }}
        >
          <AnimatePresence mode="popLayout">
            {approvals.length === 0 && !isLoading ? (
              <EmptyState
                variant="no-data"
                title={`No ${activeTab.status === 'all' ? '' : activeTab.status} approvals`}
                description={
                  activeTab.status === 'pending'
                    ? 'All AI-generated artifacts have been reviewed.'
                    : 'No approvals found for this filter.'
                }
                compact
              />
            ) : (
              approvals.map((approval) => (
                <motion.div
                  key={approval.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  layout
                >
                  <ApprovalListItem
                    approval={approval}
                    selected={selectedApproval?.id === approval.id}
                    onClick={() => setSelectedApproval(approval)}
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </Box>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedApproval && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              style={{
                flex: 1,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Paper
                variant="outlined"
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <ApprovalDetailPanel
                  approval={selectedApproval}
                  onClose={() => setSelectedApproval(null)}
                  onApprove={(comment) =>
                    approveMutation.mutate({ id: selectedApproval.id, comment })
                  }
                  onReject={(comment) =>
                    rejectMutation.mutate({ id: selectedApproval.id, comment })
                  }
                  isApproving={approveMutation.isPending}
                  isRejecting={rejectMutation.isPending}
                />
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  )
}

export default ApprovalQueuePage
