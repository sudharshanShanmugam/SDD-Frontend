import React, { memo, useState } from 'react'
import {
  Box,
  Button,
  Divider,
  IconButton,
  List,
  ListItemButton,
  Menu,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material'
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '@/hooks/useNotifications'
import { useUnreadCount } from '@/store'
import type { Notification } from '@/types'

const NOTIF_TYPE_COLORS: Record<string, string> = {
  success:           '#10B981',
  info:              '#0EA5E9',
  warning:           '#F59E0B',
  error:             '#F43F5E',
  ai_complete:       '#7C3AED',
  mention:           '#4F46E5',
  approval_request:  '#D97706',
  approval_decision: '#059669',
  comment:           '#64748B',
}

export const NotificationBell = memo(() => {
  const navigate    = useNavigate()
  const unreadCount = useUnreadCount()
  const { notifications, isLoading, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications()

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const isOpen = Boolean(anchorEl)

  const handleNotifClick = (notif: Notification) => {
    if (!notif.read) markAsRead(notif.id)
    if (notif.link) {
      navigate(notif.link)
      setAnchorEl(null)
    }
  }

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label={`${unreadCount} unread notifications`}
        >
          <Bell size={18} />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: { width: 380, maxHeight: 560, display: 'flex', flexDirection: 'column' },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<CheckCheck size={14} />}
              onClick={markAllAsRead}
              sx={{ fontSize: '0.75rem' }}
            >
              Mark all read
            </Button>
          )}
        </Box>
        <Divider />

        {/* List */}
        <List
          dense
          sx={{ flex: 1, overflow: 'auto', py: 0 }}
          disablePadding
        >
          {isLoading && notifications.length === 0 ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Box key={i} sx={{ px: 2, py: 1.5 }}>
                <Skeleton height={40} sx={{ borderRadius: 1 }} />
              </Box>
            ))
          ) : notifications.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Bell size={28} color="#94A3B8" />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                You&apos;re all caught up!
              </Typography>
            </Box>
          ) : (
            notifications.slice(0, 20).map((notif) => (
              <React.Fragment key={notif.id}>
                <ListItemButton
                  onClick={() => handleNotifClick(notif)}
                  selected={!notif.read}
                  sx={{
                    px: 2,
                    py: 1.25,
                    alignItems: 'flex-start',
                    gap: 1.5,
                    bgcolor: notif.read ? undefined : 'primary.50',
                    '&.Mui-selected': { bgcolor: 'primary.50', '&:hover': { bgcolor: 'primary.100' } },
                  }}
                >
                  {/* Color indicator */}
                  <Box
                    sx={{
                      width:        8,
                      height:       8,
                      borderRadius: '50%',
                      bgcolor:      NOTIF_TYPE_COLORS[notif.type] ?? '#64748B',
                      mt:           0.6,
                      flexShrink:   0,
                    }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={notif.read ? 400 : 600}
                      sx={{ mb: 0.25 }}
                    >
                      {notif.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                      {notif.message}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5 }}>
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </Typography>
                  </Box>
                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                    {!notif.read && (
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); markAsRead(notif.id) }}
                        title="Mark as read"
                        sx={{ width: 24, height: 24 }}
                      >
                        <Check size={12} />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id) }}
                      title="Delete"
                      sx={{ width: 24, height: 24 }}
                    >
                      <Trash2 size={12} />
                    </IconButton>
                  </Box>
                </ListItemButton>
                <Divider component="li" />
              </React.Fragment>
            ))
          )}
        </List>

        {/* Footer */}
        <Divider />
        <Box sx={{ p: 1.5 }}>
          <Button
            fullWidth
            variant="text"
            size="small"
            onClick={() => { setAnchorEl(null); navigate('/notifications') }}
          >
            View all notifications
          </Button>
        </Box>
      </Menu>
    </>
  )
})

NotificationBell.displayName = 'NotificationBell'
