import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Button,
  Avatar,
  Collapse,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Cancel,
  AutoAwesome,
  Assignment,
  AccountTree,
  Description,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

export type ApprovalType = 'requirement' | 'epic' | 'story' | 'test_case' | 'release_note';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'needs_revision';

export interface ApprovalItem {
  id: string;
  type: ApprovalType;
  title: string;
  summary: string;
  originalContent: string;
  modifiedContent?: string;
  status: ApprovalStatus;
  aiConfidence?: number;
  requestedBy?: { id: string; name: string; avatar?: string };
  requestedAt: string;
  reviewedBy?: { id: string; name: string; avatar?: string };
  reviewedAt?: string;
  comments?: string[];
}

const typeIcons: Record<ApprovalType, React.ReactNode> = {
  requirement: <Description fontSize="small" />,
  epic: <AccountTree fontSize="small" />,
  story: <Assignment fontSize="small" />,
  test_case: <AutoAwesome fontSize="small" />,
  release_note: <Description fontSize="small" />,
};

const statusColors: Record<ApprovalStatus, 'warning' | 'success' | 'error' | 'info'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  needs_revision: 'info',
};

interface ApprovalCardProps {
  item: ApprovalItem;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason?: string) => void;
  onViewDiff?: (item: ApprovalItem) => void;
  compact?: boolean;
}

const ApprovalCard: React.FC<ApprovalCardProps> = ({
  item,
  onApprove,
  onReject,
  onViewDiff,
  compact = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card
        variant="outlined"
        sx={{
          borderRadius: 2,
          borderLeft: `4px solid`,
          borderLeftColor:
            item.status === 'approved' ? 'success.main' :
            item.status === 'rejected' ? 'error.main' :
            'warning.main',
        }}
        elevation={0}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ color: 'text.secondary' }}>{typeIcons[item.type]}</Box>
              <Chip
                label={item.type.replace('_', ' ')}
                size="small"
                sx={{ height: 18, fontSize: '0.65rem', textTransform: 'capitalize' }}
              />
              <Chip
                label={item.status.replace('_', ' ')}
                size="small"
                color={statusColors[item.status]}
                sx={{ height: 18, fontSize: '0.65rem' }}
              />
              {item.aiConfidence !== undefined && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                  <AutoAwesome sx={{ fontSize: 12, color: 'secondary.main' }} />
                  <Typography variant="caption" color="secondary.main" fontWeight={600}>
                    {item.aiConfidence}%
                  </Typography>
                </Box>
              )}
            </Box>
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </IconButton>
          </Box>

          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
            {item.title}
          </Typography>

          {!compact && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 1.5 }}
            >
              {item.summary}
            </Typography>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {item.requestedBy && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Avatar src={item.requestedBy.avatar} sx={{ width: 18, height: 18, fontSize: '0.55rem' }}>
                    {item.requestedBy.name[0]}
                  </Avatar>
                  <Typography variant="caption" color="text.secondary">
                    {formatDistanceToNow(new Date(item.requestedAt), { addSuffix: true })}
                  </Typography>
                </Box>
              )}
            </Box>

            {item.status === 'pending' && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                {item.modifiedContent && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onViewDiff?.(item)}
                    sx={{ borderRadius: 2, fontSize: '0.7rem' }}
                  >
                    View Diff
                  </Button>
                )}
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  startIcon={<Cancel sx={{ fontSize: '14px !important' }} />}
                  onClick={() => onReject?.(item.id)}
                  sx={{ borderRadius: 2, fontSize: '0.7rem' }}
                >
                  Reject
                </Button>
                <Button
                  size="small"
                  color="success"
                  variant="contained"
                  startIcon={<CheckCircle sx={{ fontSize: '14px !important' }} />}
                  onClick={() => onApprove?.(item.id)}
                  sx={{ borderRadius: 2, fontSize: '0.7rem' }}
                >
                  Approve
                </Button>
              </Box>
            )}
          </Box>

          <Collapse in={expanded}>
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                {item.originalContent}
              </Typography>
              {item.comments && item.comments.length > 0 && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">Comments</Typography>
                  {item.comments.map((c, i) => (
                    <Typography key={i} variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      • {c}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ApprovalCard;
