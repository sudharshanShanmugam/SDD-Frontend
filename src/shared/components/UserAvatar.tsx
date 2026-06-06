import React, { memo } from 'react'
import { Avatar, Badge, type AvatarProps, Tooltip } from '@mui/material'
import type { UserSummary } from '@/types'

interface UserAvatarProps {
  user: Pick<UserSummary, 'displayName' | 'avatar'> | null | undefined
  size?: number
  showOnlineIndicator?: boolean
  isOnline?: boolean
  tooltipEnabled?: boolean
  avatarProps?: Omit<AvatarProps, 'src' | 'alt'>
}

function getInitials(name: string | undefined | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return (parts[0]?.[0] ?? '?').toUpperCase()
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
}

function stringToHue(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}

function getAvatarBg(name: string): string {
  const hue = stringToHue(name)
  return `hsl(${hue}, 55%, 48%)`
}

export const UserAvatar = memo<UserAvatarProps>(
  ({
    user,
    size = 32,
    showOnlineIndicator = false,
    isOnline = false,
    tooltipEnabled = true,
    avatarProps,
  }) => {
    const initials = getInitials(user?.displayName)
    const bgColor  = getAvatarBg(user?.displayName ?? 'unknown')

    const avatar = (
      <Avatar
        src={user?.avatar ?? undefined}
        alt={user?.displayName ?? 'User'}
        sx={{
          width:  size,
          height: size,
          fontSize: size * 0.375,
          fontWeight: 600,
          bgcolor: bgColor,
          ...avatarProps?.sx,
        }}
        {...avatarProps}
      >
        {!user?.avatar && initials}
      </Avatar>
    )

    const withBadge = showOnlineIndicator ? (
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant="dot"
        sx={{
          '& .MuiBadge-dot': {
            width:  10,
            height: 10,
            border: '2px solid',
            borderColor: 'background.paper',
            borderRadius: '50%',
            bgcolor: isOnline ? 'success.main' : 'text.disabled',
          },
        }}
      >
        {avatar}
      </Badge>
    ) : avatar

    if (tooltipEnabled && user?.displayName) {
      return (
        <Tooltip title={user.displayName} placement="top">
          <span style={{ display: 'inline-flex' }}>{withBadge}</span>
        </Tooltip>
      )
    }

    return withBadge
  },
)

UserAvatar.displayName = 'UserAvatar'
