import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Skeleton,
  Paper,
  List,
  ListItem,
  Divider,
} from '@mui/material';
import {
  Description,
  CheckCircle,
  AutoAwesome,
  BugReport,
  Assignment,
  Person,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

export interface ActivityEvent {
  id: string;
  type: 'document_upload' | 'requirement_extracted' | 'ai_generated' | 'bug_created' | 'story_approved' | 'user_joined';
  title: string;
  description?: string;
  user?: { name: string; avatar?: string };
  timestamp: string;
  metadata?: Record<string, unknown>;
}

const eventConfig: Record<
  ActivityEvent['type'],
  { icon: React.ReactNode; color: string; chipLabel: string }
> = {
  document_upload: { icon: <Description fontSize="small" />, color: '#6366f1', chipLabel: 'Upload' },
  requirement_extracted: { icon: <CheckCircle fontSize="small" />, color: '#10b981', chipLabel: 'AI' },
  ai_generated: { icon: <AutoAwesome fontSize="small" />, color: '#f59e0b', chipLabel: 'Generated' },
  bug_created: { icon: <BugReport fontSize="small" />, color: '#ef4444', chipLabel: 'Bug' },
  story_approved: { icon: <Assignment fontSize="small" />, color: '#3b82f6', chipLabel: 'Approved' },
  user_joined: { icon: <Person fontSize="small" />, color: '#8b5cf6', chipLabel: 'New User' },
};

interface ActivityFeedProps {
  events?: ActivityEvent[];
  loading?: boolean;
  maxItems?: number;
}

const ActivityItem: React.FC<{ event: ActivityEvent; index: number }> = ({ event, index }) => {
  const config = eventConfig[event.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <ListItem
        sx={{
          px: 2,
          py: 1.5,
          gap: 1.5,
          alignItems: 'flex-start',
          '&:hover': { bgcolor: 'action.hover', borderRadius: 2 },
        }}
        disablePadding
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: `${config.color}1a`,
            color: config.color,
            flexShrink: 0,
            mt: 0.25,
          }}
        >
          {config.icon}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" fontWeight={600} sx={{ flexShrink: 0 }}>
              {event.title}
            </Typography>
            <Chip
              label={config.chipLabel}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.65rem',
                bgcolor: `${config.color}1a`,
                color: config.color,
                border: 'none',
              }}
            />
          </Box>
          {event.description && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {event.description}
            </Typography>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            {event.user && (
              <Typography variant="caption" color="text.secondary">
                {event.user.name}
              </Typography>
            )}
            <Typography variant="caption" color="text.disabled">
              • {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
            </Typography>
          </Box>
        </Box>
      </ListItem>
    </motion.div>
  );
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  events = [],
  loading = false,
  maxItems = 10,
}) => {
  const displayed = events.slice(0, maxItems);

  return (
    <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={600}>
          Recent Activity
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ p: 2 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
              <Skeleton variant="circular" width={36} height={36} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="60%" height={16} />
                <Skeleton width="40%" height={14} sx={{ mt: 0.5 }} />
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <List disablePadding sx={{ p: 1 }}>
          <AnimatePresence>
            {displayed.map((event, index) => (
              <React.Fragment key={event.id}>
                <ActivityItem event={event} index={index} />
                {index < displayed.length - 1 && (
                  <Divider sx={{ my: 0.5, borderColor: 'divider' }} />
                )}
              </React.Fragment>
            ))}
          </AnimatePresence>
        </List>
      )}
    </Paper>
  );
};

export default ActivityFeed;
