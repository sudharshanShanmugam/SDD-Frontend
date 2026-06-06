import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Button, Card, CircularProgress,
  TextField, Typography, Alert, Chip, Stack, Link,
} from '@mui/material'
import { LockOutlined } from '@mui/icons-material'
import { useAuthStore } from '@store/authStore'
import { apiClient } from '@/api/client'

const DEMO_ACCOUNTS = [
  { email: 'admin@sdd-platform.com', role: 'Super Admin',      color: '#6366f1', desc: 'Full access to everything' },
  { email: 'ba@sdd-platform.com',    role: 'Business Analyst', color: '#10b981', desc: 'Documents, requirements, stories, sprints, tasks' },
  { email: 'dev@sdd-platform.com',   role: 'Developer',        color: '#f59e0b', desc: 'Sprint planning & task board only' },
  { email: 'qa@sdd-platform.com',    role: 'QA Engineer',      color: '#ef4444', desc: 'Sprints, tasks, QA dashboard & releases' },
]

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
      setAuthFromLogin(data)
      navigate(from, { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? err?.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  function quickLogin(demoEmail: string) {
    setEmail(demoEmail)
    setPassword('Pass@1234')
  }

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: 'grey.100', p: 2,
    }}>
      <Card sx={{ width: '100%', maxWidth: 820, display: 'flex', flexDirection: 'row', overflow: 'hidden' }} elevation={3}>

        {/* Left — demo accounts */}
        <Box sx={{
          width: 300, flexShrink: 0, bgcolor: 'grey.50',
          borderRight: '1px solid', borderColor: 'divider', p: 3,
        }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>Demo Accounts</Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            All use password: <strong>Pass@1234</strong>
          </Typography>
          <Stack spacing={1}>
            {DEMO_ACCOUNTS.map(acc => (
              <Box
                key={acc.email}
                onClick={() => quickLogin(acc.email)}
                sx={{
                  border: '1px solid', borderColor: email === acc.email ? acc.color : 'divider',
                  borderRadius: 2, p: 1.5, cursor: 'pointer', transition: 'all 150ms',
                  bgcolor: email === acc.email ? acc.color + '10' : 'transparent',
                  '&:hover': { borderColor: acc.color, bgcolor: acc.color + '08' },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }}>
                  <Chip label={acc.role} size="small"
                    sx={{ bgcolor: acc.color + '20', color: acc.color, fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', display: 'block' }}>
                  {acc.email}
                </Typography>
                <Typography variant="caption" color="text.secondary">{acc.desc}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Right — login form */}
        <Box sx={{ flex: 1, p: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Stack alignItems="center" spacing={1} sx={{ mb: 3 }}>
            <Box sx={{ bgcolor: 'primary.main', borderRadius: '50%', p: 1.5, display: 'flex' }}>
              <LockOutlined sx={{ color: 'white', fontSize: 28 }} />
            </Box>
            <Typography variant="h5" fontWeight={700}>SDD Platform</Typography>
            <Typography variant="body2" color="text.secondary">Sign in to your account</Typography>
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
