import React, { memo } from 'react'
import { Backdrop, Box, CircularProgress, Typography, Fade } from '@mui/material'

interface LoadingOverlayProps {
  open: boolean
  message?: string
  transparent?: boolean
}

export const LoadingOverlay = memo<LoadingOverlayProps>(
  ({ open, message, transparent = false }) => {
    return (
      <Backdrop
        open={open}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 10,
          bgcolor: transparent ? 'rgba(255,255,255,0.8)' : 'background.default',
          backdropFilter: transparent ? 'blur(4px)' : 'none',
          flexDirection: 'column',
          gap: 2,
        }}
        component={Fade}
        in={open}
        timeout={200}
      >
        <>
          <CircularProgress size={48} thickness={3} />
          {message && (
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {message}
            </Typography>
          )}
        </>
      </Backdrop>
    )
  },
)

LoadingOverlay.displayName = 'LoadingOverlay'

// Inline spinner for sections
export const SectionLoader = memo<{ height?: number | string }>(
  ({ height = 200 }) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height,
        width: '100%',
      }}
    >
      <CircularProgress size={32} thickness={4} />
    </Box>
  ),
)

SectionLoader.displayName = 'SectionLoader'
