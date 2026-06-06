import React from 'react'
import { Box, Typography } from '@mui/material'

export default function ReleasesPage(): React.JSX.Element {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>Releases</Typography>
      <Typography variant="body2" color="text.secondary">
        Release management with AI-generated release notes.
      </Typography>
    </Box>
  )
}
