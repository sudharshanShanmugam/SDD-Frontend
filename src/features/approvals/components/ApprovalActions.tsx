import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { CheckCircle, Cancel, Comment, Autorenew } from '@mui/icons-material';

interface ApprovalActionsProps {
  approvalId: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  onApprove?: (id: string, comment?: string) => Promise<void>;
  onReject?: (id: string, reason: string) => Promise<void>;
  onRequestRevision?: (id: string, notes: string) => Promise<void>;
  disabled?: boolean;
}

const ApprovalActions: React.FC<ApprovalActionsProps> = ({
  approvalId,
  status,
  onApprove,
  onReject,
  onRequestRevision,
  disabled = false,
}) => {
  const [rejectDialog, setRejectDialog] = useState(false);
  const [revisionDialog, setRevisionDialog] = useState(false);
  const [comment, setComment] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setLoading('approve');
    setError(null);
    try {
      await onApprove?.(approvalId, comment);
      setSuccess('Successfully approved!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    setLoading('reject');
    setError(null);
    try {
      await onReject?.(approvalId, comment);
      setRejectDialog(false);
      setComment('');
      setSuccess('Rejected successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Rejection failed');
    } finally {
      setLoading(null);
    }
  };

  const handleRevision = async () => {
    if (!revisionNotes.trim()) return;
    setLoading('revision');
    setError(null);
    try {
      await onRequestRevision?.(approvalId, revisionNotes);
      setRevisionDialog(false);
      setRevisionNotes('');
      setSuccess('Revision requested');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to request revision');
    } finally {
      setLoading(null);
    }
  };

  if (status !== 'pending') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          icon={status === 'approved' ? <CheckCircle sx={{ fontSize: '14px !important' }} /> : <Cancel sx={{ fontSize: '14px !important' }} />}
          label={status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Needs Revision'}
          color={status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'warning'}
        />
      </Box>
    );
  }

  return (
    <Box>
      {success && <Alert severity="success" sx={{ mb: 1.5, borderRadius: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<Autorenew fontSize="small" />}
          onClick={() => setRevisionDialog(true)}
          disabled={disabled || !!loading}
          sx={{ borderRadius: 2 }}
        >
          Request Revision
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<Cancel fontSize="small" />}
          onClick={() => setRejectDialog(true)}
          disabled={disabled || !!loading}
          sx={{ borderRadius: 2 }}
        >
          Reject
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={loading === 'approve' ? <CircularProgress size={16} color="inherit" /> : <CheckCircle fontSize="small" />}
          onClick={handleApprove}
          disabled={disabled || !!loading}
          sx={{ borderRadius: 2 }}
        >
          Approve
        </Button>
      </Box>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Reject Approval</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide a reason for rejection. This will be visible to the submitter.
          </Typography>
          <TextField
            label="Rejection Reason"
            multiline
            rows={4}
            fullWidth
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            error={!comment.trim() && !!error}
            helperText={!comment.trim() && error ? error : undefined}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectDialog(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={loading === 'reject'}
            sx={{ borderRadius: 2 }}
          >
            {loading === 'reject' ? <CircularProgress size={20} color="inherit" /> : 'Confirm Rejection'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Revision Dialog */}
      <Dialog open={revisionDialog} onClose={() => setRevisionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Request Revision</DialogTitle>
        <DialogContent>
          <TextField
            label="Revision Notes"
            multiline
            rows={4}
            fullWidth
            value={revisionNotes}
            onChange={(e) => setRevisionNotes(e.target.value)}
            placeholder="Describe what needs to be revised..."
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRevisionDialog(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            onClick={handleRevision}
            variant="contained"
            color="warning"
            disabled={!revisionNotes.trim() || loading === 'revision'}
            sx={{ borderRadius: 2 }}
          >
            {loading === 'revision' ? <CircularProgress size={20} color="inherit" /> : 'Send Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApprovalActions;
