import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Button, Card, CircularProgress,
  TextField, Typography, Alert, Stack, Link,
} from '@mui/material'
import { LockOutlined } from '@mui/icons-material'
import { useAuthStore } from '@store/authStore'
import { apiClient, resetLogoutGuard } from '@/api/client'

export default function LoginPage() {
  const navigate         = useNavigate()
  const location         = useLocation()
  const setAuthFromLogin = useAuthStore(s => s.setAuthFromLogin)

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const from = (location.state as any)?.from?.pathname ?? '/dashboard'

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.post('/auth/login', { email, password })
      const data = res.data as any
      if (!data.access_token) throw new Error('Invalid response from server')
      resetLogoutGuard()
      setAuthFromLogin(data)
      navigate(from, { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? err?.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: 'grey.100', p: 2,
    }}>
      <Card sx={{ width: '100%', maxWidth: 440, overflow: 'hidden' }} elevation={3}>
        <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Stack alignItems="center" spacing={1} sx={{ mb: 3 }}>
            <Box sx={{ bgcolor: 'primary.main', borderRadius: '50%', p: 1.5, display: 'flex' }}>
              <LockOutlined sx={{ color: 'white', fontSize: 28 }} />
            </Box>
            <Typography variant="h5" fontWeight={700}>SDD Platform</Typography>
            <Typography variant="body2" color="text.secondary">Sign in to your account</Typography>
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box
            onClick={() => { setEmail('admin@sdd-platform.com'); setPassword('Pass@1234') }}
            sx={{
              border: '1px dashed', borderColor: 'primary.main', borderRadius: 2,
              p: 1.5, mb: 2, cursor: 'pointer', bgcolor: 'primary.50',
              '&:hover': { bgcolor: 'primary.100' },
            }}
          >
            <Typography variant="caption" fontWeight={700} color="primary">Super Admin Demo</Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontFamily: 'monospace' }}>
              admin@sdd-platform.com · Pass@1234
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleLogin}>
            <TextField
              label="Email" type="email" fullWidth size="small" required
              value={email} onChange={e => setEmail(e.target.value)} sx={{ mb: 2 }}
              autoComplete="email" autoFocus
            />
            <TextField
              label="Password" type="password" fullWidth size="small" required
              value={password} onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5, mb: 3 }}>
              <Link href="#" variant="caption" underline="hover" color="text.secondary">
                Forgot password?
              </Link>
            </Box>
            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </Box>
        </Box>
      </Card>
    </Box>
  )
}
