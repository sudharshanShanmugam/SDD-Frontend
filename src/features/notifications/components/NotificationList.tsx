import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Divider,
  Chip,
  Paper,
  CircularProgress,
} from '@mui/material';
import { CheckCircle, Notifications } from '@mui/icons-material';
import { AnimatePresence } from 'framer-motion';
import NotificationItem, { Notification, NotificationType } from './NotificationItem';

interface NotificationListProps {
  notifications?: Notification[];
  loading?: boolean;
  onMarkAllRead?: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications = [],
  loading = false,
  onMarkAllRead,
}) => {
  const [items, setItems] = useState(notifications);
  const [tab, setTab] = useState(0);

  const unreadCount = items.filter((n) => !n.read).length;

  const filtered = tab === 0 ? items : items.filter((n) => !n.read);

  const handleRead = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleDismiss = (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  const handleMarkAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    onMarkAllRead?.();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2, pt: 1.5, pb: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Notifications fontSize="small" />
            <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
            {unreadCount > 0 && (
              <Chip
                label={unreadCount}
                size="small"
                color="primary"
                sx={{ height: 18, minWidth: 24, fontSize: '0.7rem' }}
              />
            )}
          </Box>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<CheckCircle fontSize="small" />}
              onClick={handleMarkAllRead}
              sx={{ fontSize: '0.75rem' }}
            >
              Mark all read
            </Button>
          )}
        </Box>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ '& .MuiTab-root': { minHeight: 36, py: 0, fontSize: '0.8rem' } }}
        >
          <Tab label="All" />
          <Tab label={`Unread (${unreadCount})`} />
        </Tabs>
      </Box>

      <Divider />

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Notifications sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {tab === 1 ? 'No unread notifications' : 'No notifications yet'}
            </Typography>
          </Box>
        ) : (
          <AnimatePresence>
            {filtered.map((notif) => (
              <React.Fragment key={notif.id}>
                <NotificationItem
                  notification={notif}
                  onRead={handleRead}
                  onDismiss={handleDismiss}
                />
                <Divider sx={{ mx: 2 }} />
              </React.Fragment>
            ))}
          </AnimatePresence>
        )}
      </Box>
    </Box>
  );
};

export default NotificationList;
