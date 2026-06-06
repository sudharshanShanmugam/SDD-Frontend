import React, { memo, useState } from 'react'
import {
  Box,
  Button,
  ButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react'
import type { ApprovalDecision } from '@/types'

interface ApprovalButtonProps {
  onDecide:   (decision: ApprovalDecision, comment?: string) => Promise<void> | void
  requireComment?: boolean
  disabled?:  boolean
  compact?:   boolean
}

export const ApprovalButton = memo<ApprovalButtonProps>(
  ({ onDecide, requireComment = false, disabled = false, compact = false }) => {
    const [decision,   setDecision]   = useState<ApprovalDecision | null>(null)
    const [comment,    setComment]    = useState('')
    const [isPending,  setIsPending]  = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)

    const handleClick = (d: ApprovalDecision) => {
      if (requireComment || d === 'rejected') {
        setDecision(d)
        setDialogOpen(true)
      } else {
        void submitDecision(d)
      }
    }

    const submitDecision = async (d: ApprovalDecision, c?: string) => {
      setIsPending(true)
      try {
        await onDecide(d, c)
        setDialogOpen(false)
        setComment('')
        setDecision(null)
      } finally {
        setIsPending(false)
      }
    }

    return (
      <>
        <ButtonGroup size={compact ? 'small' : 'medium'} disabled={disabled || isPending}>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle size={compact ? 14 : 16} />}
            onClick={() => handleClick('approved')}
          >
            {compact ? 'Approve' : 'Approve'}
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<XCircle size={compact ? 14 : 16} />}
            onClick={() => handleClick('rejected')}
          >
            {compact ? 'Reject' : 'Reject'}
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<MessageSquare size={compact ? 14 : 16} />}
            onClick={() => { setDecision('abstained'); setDialogOpen(true) }}
          >
            {compact ? '' : 'Abstain'}
          </Button>
        </ButtonGroup>

        <Dialog
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); setDecision(null); setComment('') }}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>
            {decision === 'approved' ? 'Approve with comment'
             : decision === 'rejected' ? 'Reject with reason'
             : 'Abstain from decision'}
          </DialogTitle>
          <DialogContent>
            {decision === 'rejected' && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Please provide a reason for rejecting this item.
              </Typography>
            )}
            <TextField
              autoFocus
              fullWidth
              multiline
              rows={3}
              label={decision === 'rejected' ? 'Reason (required)' : 'Comment (optional)'}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              size="small"
            />
          </DialogContent>
          <DialogActions>
            <Button
              variant="outlined"
              onClick={() => { setDialogOpen(false); setDecision(null); setComment('') }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color={decision === 'approved' ? 'success' : decision === 'rejected' ? 'error' : 'inherit'}
              disabled={isPending || (decision === 'rejected' && !comment.trim())}
              onClick={() => decision && void submitDecision(decision, comment || undefined)}
            >
              {isPending ? 'Submitting...' : 'Confirm'}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    )
  },
)

ApprovalButton.displayName = 'ApprovalButton'
