import React from 'react'
import { Box, Typography } from '@mui/material'

export default function SprintPlanningPage(): React.JSX.Element {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>Sprint Planning</Typography>
      <Typography variant="body2" color="text.secondary">
        AI-generated sprint plans with story point estimates.
      </Typography>
    </Box>
  )
}
