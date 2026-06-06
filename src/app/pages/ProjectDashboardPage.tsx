import React, { useEffect } from 'react'
import { Outlet, useParams, useNavigate } from 'react-router-dom'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useWorkspaceStore } from '@store/workspaceStore'

export default function ProjectDashboardPage(): React.JSX.Element {
  const { projectId } = useParams<{ projectId: string }>()
  const currentProject = useWorkspaceStore((s) => s.currentProject)
  const isProjectLoading = useWorkspaceStore((s) => s.isProjectLoading)

  if (isProjectLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 300 }}>
        <CircularProgress size={36} />
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Outlet />
    </Box>
  )
}
