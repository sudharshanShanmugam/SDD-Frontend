import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import {
  AssignmentOutlined,
  AutoStoriesOutlined,
  BookmarkBorderOutlined,
  CheckCircleOutlined,
  InfoOutlined,
  SmartToyOutlined,
  AlternateEmailOutlined,
  NotificationsOutlined,
  GavelOutlined,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import type { Notification, NotificationType, UUID } from '@/types';

// ── Type colour + icon map ────────────────────────────────────────────────────

const TYPE_META: Record<
  NotificationType,
  { icon: React.ReactNode; bg: string; fg: string }
> = {
  info: {
    icon: <InfoOutlined fontSize="small" />,
    bg: '#E3F2FD',
    fg: '#1565C0',
  },
  success: {
    icon: <CheckCircleOutlined fontSize="small" />,
    bg: '#E8F5E9',
    fg: '#2E7D32',
  },
  warning: {
    icon: <NotificationsOutlined fontSize="small" />,
    bg: '#FFF8E1',
    fg: '#F57F17',
  },
  error: {
    icon: <GavelOutlined fontSize="small" />,
    bg: '#FFEBEE',
    fg: '#C62828',
  },
  ai_complete: {
    icon: <SmartToyOutlined fontSize="small" />,
    bg: '#F3E5F5',
    fg: '#6A1B9A',
  },
  mention: {
    icon: <AlternateEmailOutlined fontSize="small" />,
    bg: '#E8EAF6',
    fg: '#283593',
  },
  approval_request: {
    icon: <AssignmentOutlined fontSize="small" />,
    bg: '#FFF3E0',
    fg: '#E65100',
  },
  approval_decision: {
    icon: <CheckCircleOutlined fontSize="small" />,
    bg: '#E8F5E9',
    fg: '#2E7D32',
  },
  comment: {
    icon: <BookmarkBorderOutlined fontSize="small" />,
    bg: '#F1F8E9',
    fg: '#33691E',
  },
};

// Fallback for any future type values
function getTypeMeta(type: NotificationType) {
  return (
    TYPE_META[type] ?? {
      icon: <AutoStoriesOutlined fontSize="small" />,
      bg: '#F5F5F5',
      fg: '#616161',
    }
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface NotificationItemProps {
  notification: {
    id: UUID;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    link?: string;
    createdAt: string;
  };
  onRead: (id: UUID) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const meta = getTypeMeta(notification.type);

  function handleClick() {
    if (!notification.read) {
      onRead(notification.id);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
  }

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
    } catch {
      return '';
    }
  })();

  return (
    <ListItem
      alignItems="flex-start"
      onClick={handleClick}
      sx={{
        cursor: 'pointer',
        borderRadius: 1,
        px: 2,
        py: 1.5,
        transition: 'background-color 0.15s',
        bgcolor: notification.read ? 'transparent' : 'action.hover',
        '&:hover': {
          bgcolor: 'action.selected',
        },
        position: 'relative',
      }}
      disablePadding={false}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <Box
          sx={{
            position: 'absolute',
            left: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: 'primary.main',
          }}
        />
      )}

      <ListItemAvatar sx={{ minWidth: 44 }}>
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: meta.bg,
            color: meta.fg,
          }}
        >
          {meta.icon}
        </Avatar>
      </ListItemAvatar>

      <ListItemText
        primary={
          <Typography
            variant="body2"
            fontWeight={notification.read ? 400 : 600}
            sx={{
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {notification.title}
          </Typography>
        }
        secondary={
          <Box component="span">
            <Typography
              component="span"
              variant="caption"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {notification.message}
            </Typography>
            <Typography
              component="span"
              variant="caption"
              color="text.disabled"
              display="block"
              mt={0.25}
            >
              {timeAgo}
            </Typography>
          </Box>
        }
      />
    </ListItem>
  );
}

export default NotificationItem;
