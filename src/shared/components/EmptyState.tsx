import React, { memo, type ReactNode } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { FileX, Search, AlertCircle } from 'lucide-react'

type EmptyStateVariant = 'no-data' | 'no-results' | 'error' | 'no-permission'

interface EmptyStateProps {
  variant?: EmptyStateVariant
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: ReactNode
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  icon?: ReactNode
}

const VARIANT_DEFAULTS: Record<EmptyStateVariant, { title: string; description: string; icon: ReactNode }> = {
  'no-data': {
    title: 'Nothing here yet',
    description: "Get started by creating your first item.",
    icon: <FileX size={40} strokeWidth={1.5} />,
  },
  'no-results': {
    title: 'No results found',
    description: 'Try adjusting your search or filter criteria.',
    icon: <Search size={40} strokeWidth={1.5} />,
  },
  'error': {
    title: 'Something went wrong',
    description: 'An error occurred while loading this content. Please try again.',
    icon: <AlertCircle size={40} strokeWidth={1.5} />,
  },
  'no-permission': {
    title: 'Access restricted',
    description: "You don't have permission to view this content.",
    icon: <AlertCircle size={40} strokeWidth={1.5} />,
  },
}

export const EmptyState = memo<EmptyStateProps>(
  ({ variant = 'no-data', title, description, action, secondaryAction, icon }) => {
    const defaults = VARIANT_DEFAULTS[variant]

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
          px: 4,
          textAlign: 'center',
          maxWidth: 480,
          mx: 'auto',
        }}
      >
        <Box
          sx={{
            mb: 2,
            p: 2.5,
            borderRadius: '50%',
            bgcolor: 'action.hover',
            color: 'text.secondary',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon ?? defaults.icon}
        </Box>

        <Typography variant="h6" fontWeight={600} gutterBottom>
          {title ?? defaults.title}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
          {description ?? defaults.description}
        </Typography>

        {action && (
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={action.onClick}
              startIcon={action.icon}
            >
              {action.label}
            </Button>
            {secondaryAction && (
              <Button variant="outlined" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
          </Box>
        )}
      </Box>
    )
  },
)

EmptyState.displayName = 'EmptyState'
