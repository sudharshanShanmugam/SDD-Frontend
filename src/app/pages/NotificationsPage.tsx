import React from 'react'
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material'
import { NotificationsNone as BellIcon } from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post } from '@/api/client'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export default function NotificationsPage(): React.JSX.Element {
  const qc = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => get<Notification[]>('/notifications'),
  })

  const markRead = useMutation({
    mutationFn: (id: string) => post(`/notifications/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllRead = useMutation({
    mutationFn: () => post('/notifications/read-all', {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const notifications: Notification[] = Array.isArray(data) ? data : (data as any)?.data ?? []

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your activity feed and notification history.
          </Typography>
        </Box>
        {notifications.some(n => !n.is_read) && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            Mark all as read
          </Button>
        )}
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error">Failed to load notifications.</Alert>
      )}

      {!isLoading && !isError && notifications.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 10,
            gap: 1.5,
            color: 'text.secondary',
          }}
        >
          <BellIcon sx={{ fontSize: 56, opacity: 0.3 }} />
          <Typography variant="body1" fontWeight={500}>
            No notifications yet
          </Typography>
          <Typography variant="body2">
            You're all caught up! New notifications will appear here.
          </Typography>
        </Box>
      )}

      {!isLoading && !isError && notifications.length > 0 && (
        <List disablePadding>
          {notifications.map((n, index) => (
            <React.Fragment key={n.id}>
              <ListItem
                alignItems="flex-start"
                sx={{
                  px: 2,
                  py: 1.5,
                  borderRadius: 2,
                  bgcolor: n.is_read ? 'transparent' : 'action.hover',
                  gap: 1.5,
                }}
              >
                {/* Unread indicator dot */}
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: n.is_read ? 'transparent' : 'primary.main',
                    flexShrink: 0,
                    mt: 0.75,
                  }}
                />

                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      fontWeight={n.is_read ? 400 : 700}
                    >
                      {n.title}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                        {n.message}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                        {relativeTime(n.created_at)}
                      </Typography>
                    </Box>
                  }
                />

                {!n.is_read && (
                  <Button
                    size="small"
                    variant="text"
                    sx={{ flexShrink: 0, alignSelf: 'center', whiteSpace: 'nowrap' }}
                    onClick={() => markRead.mutate(n.id)}
                    disabled={markRead.isPending}
                  >
                    Mark as read
                  </Button>
                )}
              </ListItem>
              {index < notifications.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  )
}
