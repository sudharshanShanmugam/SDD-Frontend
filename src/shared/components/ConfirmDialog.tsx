import React, { memo, useState, useCallback } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
} from '@mui/material'
import { AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { useUIStore } from '@/store'

// ── Global Confirm Dialog (driven by UIStore) ─────────────────

export const GlobalConfirmDialog = memo(() => {
  const { isOpen, title, message, confirmLabel, cancelLabel, severity, onConfirm, onCancel } =
    useUIStore((s) => s.confirmDialog)
  const hideConfirm = useUIStore((s) => s.hideConfirm)
  const [isPending, setIsPending] = useState(false)

  const handleConfirm = useCallback(async () => {
    if (!onConfirm) {
      hideConfirm()
      return
    }
    setIsPending(true)
    try {
      await onConfirm()
      hideConfirm()
    } finally {
      setIsPending(false)
    }
  }, [onConfirm, hideConfirm])

  const handleCancel = useCallback(() => {
    onCancel?.()
    hideConfirm()
  }, [onCancel, hideConfirm])

  const IconComponent = severity === 'error' ? AlertCircle
    : severity === 'warning' ? AlertTriangle
    : Info

  const iconColor = severity === 'error' ? 'error.main'
    : severity === 'warning' ? 'warning.main'
    : 'info.main'

  return (
    <Dialog
      open={isOpen}
      onClose={handleCancel}
      maxWidth="xs"
      fullWidth
      disableEscapeKeyDown={isPending}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ color: iconColor, display: 'flex' }}>
            <IconComponent size={22} />
          </Box>
          {title}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={handleCancel} disabled={isPending}>
          {cancelLabel ?? 'Cancel'}
        </Button>
        <Button
          variant="contained"
          color={severity === 'error' ? 'error' : severity === 'warning' ? 'warning' : 'primary'}
          onClick={() => void handleConfirm()}
          disabled={isPending}
          autoFocus
        >
          {isPending ? 'Please wait...' : (confirmLabel ?? 'Confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
})

GlobalConfirmDialog.displayName = 'GlobalConfirmDialog'

// ── Standalone confirm dialog ─────────────────────────────────

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  severity?: 'warning' | 'error' | 'info'
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

export const ConfirmDialog = memo<ConfirmDialogProps>(
  ({ open, title, message, confirmLabel, cancelLabel, severity = 'info', onConfirm, onClose }) => {
    const [isPending, setIsPending] = useState(false)

    const handleConfirm = async () => {
      setIsPending(true)
      try {
        await onConfirm()
        onClose()
      } finally {
        setIsPending(false)
      }
    }

    const IconComponent = severity === 'error' ? AlertCircle
      : severity === 'warning' ? AlertTriangle
      : Info

    const iconColor = severity === 'error' ? 'error.main'
      : severity === 'warning' ? 'warning.main'
      : 'info.main'

    return (
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ color: iconColor, display: 'flex' }}>
              <IconComponent size={22} />
            </Box>
            {title}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {message}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={onClose} disabled={isPending}>
            {cancelLabel ?? 'Cancel'}
          </Button>
          <Button
            variant="contained"
            color={severity === 'error' ? 'error' : severity === 'warning' ? 'warning' : 'primary'}
            onClick={() => void handleConfirm()}
            disabled={isPending}
            autoFocus
          >
            {isPending ? 'Please wait...' : (confirmLabel ?? 'Confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    )
  },
)

ConfirmDialog.displayName = 'ConfirmDialog'
