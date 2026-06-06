import React from 'react'
import { Box, Typography } from '@mui/material'

export default function OrgManagementPage(): React.JSX.Element {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>Organization Management</Typography>
      <Typography variant="body2" color="text.secondary">
        Manage all organizations on the platform (super admin only).
      </Typography>
    </Box>
  )
}
