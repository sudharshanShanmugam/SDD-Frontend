import React from 'react'
import { Box, Typography } from '@mui/material'

export default function AIPromptsPage(): React.JSX.Element {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>AI Prompts</Typography>
      <Typography variant="body2" color="text.secondary">
        Manage and customize AI prompt templates for this project.
      </Typography>
    </Box>
  )
}
