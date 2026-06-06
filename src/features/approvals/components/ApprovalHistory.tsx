import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Paper,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import { CheckCircle, Cancel, Edit, AutoAwesome, Send } from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';

export interface ApprovalHistoryEvent {
  id: string;
  action: 'created' | 'submitted' | 'approved' | 'rejected' | 'revised' | 'ai_generated';
  description: string;
  user?: { name: string; avatar?: string };
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface ApprovalHistoryProps {
  events: ApprovalHistoryEvent[];
}

const eventConfig: Record<
  ApprovalHistoryEvent['action'],
  { icon: React.ReactNode; color: 'primary' | 'success' | 'error' | 'warning' | 'grey' | 'secondary' }
> = {
  created: { icon: <Edit fontSize="small" />, color: 'grey' },
  submitted: { icon: <Send fontSize="small" />, color: 'primary' },
  approved: { icon: <CheckCircle fontSize="small" />, color: 'success' },
  rejected: { icon: <Cancel fontSize="small" />, color: 'error' },
  revised: { icon: <Edit fontSize="small" />, color: 'warning' },
  ai_generated: { icon: <AutoAwesome fontSize="small" />, color: 'secondary' },
};

const ApprovalHistory: React.FC<ApprovalHistoryProps> = ({ events }) => {
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
        Approval History
      </Typography>
      <Timeline position="right" sx={{ p: 0, m: 0 }}>
        {events.map((event, index) => {
          const cfg = eventConfig[event.action];
          return (
            <TimelineItem key={event.id} sx={{ minHeight: 60 }}>
              <TimelineOppositeContent sx={{ display: 'none' }} />
              <TimelineSeparator>
                <TimelineDot color={cfg.color} sx={{ m: 0.5, p: 0.5 }}>
                  {cfg.icon}
                </TimelineDot>
                {index < events.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent sx={{ py: 0.5, px: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={500}>{event.description}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                      {event.user && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Avatar src={event.user.avatar} sx={{ width: 16, height: 16, fontSize: '0.5rem' }}>
                            {event.user.name[0]}
                          </Avatar>
                          <Typography variant="caption" color="text.secondary">{event.user.name}</Typography>
                        </Box>
                      )}
                      <Typography variant="caption" color="text.disabled">
                        {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
    </Box>
  );
};

export default ApprovalHistory;
