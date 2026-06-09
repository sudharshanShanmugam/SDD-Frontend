import { Box, Button, Typography } from '@mui/material'
import { LockOutlined } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'

export default function UnauthorizedPage() {
  const navigate    = useNavigate()
  const role        = useAuthStore(s => s.currentRole())
  const logout      = useAuthStore(s => s.logout)
  const canAccess   = useAuthStore(s => s.canAccess)

  const home = canAccess('dashboard') ? '/dashboard' : '/workspaces'

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
      <LockOutlined sx={{ fontSize: 64, color: 'text.disabled' }} />
      <Typography variant="h5" fontWeight={700}>Access Restricted</Typography>
      <Typography color="text.secondary" textAlign="center" maxWidth={400}>
        Your role (<strong>{role.replace(/_/g, ' ')}</strong>) doesn't have permission to access this page.
        Contact your administrator if you need access.
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Button variant="contained" onClick={() => navigate(home)}>Go to Home</Button>
        <Button variant="outlined" onClick={() => { logout(); navigate('/login') }}>Switch Account</Button>
      </Box>
    </Box>
  )
}
