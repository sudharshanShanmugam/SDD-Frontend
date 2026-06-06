import React from 'react'
import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'

/**
 * DashboardLayout — wraps dashboard-specific pages.
 * Provides extra padding and max-width constraints for full-width dashboard views.
 */
export default function DashboardLayout(): React.JSX.Element {
  return (
    <Box
      sx={{
        width:    '100%',
        height:   '100%',
        overflow: 'auto',
      }}
    >
      <Outlet />
    </Box>
  )
}
