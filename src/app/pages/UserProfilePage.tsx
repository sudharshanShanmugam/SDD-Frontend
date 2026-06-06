import React, { useEffect } from 'react'
import {
  Avatar, Box, Button, Card, CardContent, CardHeader,
  CircularProgress, Divider, FormControl, FormControlLabel,
  InputLabel, MenuItem, Select, Stack, Switch, TextField,
  Typography, Alert,
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, patch, post } from '@/api/client'
import { useAuthStore } from '@store/authStore'
import { useUIStore } from '@store/uiStore'

// ─────────────────────────────────────────────────────────────────────────────
// Profile section
// ─────────────────────────────────────────────────────────────────────────────

interface ProfileForm {
  full_name: string
  timezone: string
  locale: string
}

function ProfileSection() {
  const toast = useUIStore(s => s.toast)
  const qc = useQueryClient()
  const updateAuthUser = useAuthStore(s => s.updateProfile)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => get<any>('/users/me'),
  })

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileForm>()

  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name ?? '',
        timezone: profile.timezone ?? 'UTC',
        locale: profile.locale ?? 'en',
      })
    }
  }, [profile, reset])

  const mutation = useMutation({
    mutationFn: (data: ProfileForm) => patch('/users/me', data),
    onSuccess: (updated: any) => {
      toast.success('Profile updated')
      qc.invalidateQueries({ queryKey: ['users', 'me'] })
      if (updated?.full_name) updateAuthUser({ displayName: updated.full_name })
    },
    onError: () => toast.error('Failed to update profile'),
  })

  if (isLoading) return <CircularProgress size={24} />

  return (
    <Card variant="outlined">
      <CardHeader title="Profile Information" subheader="Update your name, timezone, and locale" />
      <Divider />
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
          <Avatar sx={{ width: 72, height: 72, fontSize: 28, bgcolor: 'primary.main' }}>
            {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>{profile?.full_name}</Typography>
            <Typography variant="body2" color="text.secondary">{profile?.email}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
              {profile?.role?.replace(/_/g, ' ')}
            </Typography>
          </Box>
        </Stack>

        <Box component="form" onSubmit={handleSubmit(d => mutation.mutate(d))}>
          <Stack spacing={2.5}>
            <TextField
              label="Full Name"
              size="small"
              fullWidth
              {...register('full_name', { required: 'Name is required' })}
              error={!!errors.full_name}
              helperText={errors.full_name?.message}
            />

            <Stack direction="row" spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Timezone</InputLabel>
                <Select label="Timezone" defaultValue="UTC"
                  {...register('timezone')}>
                  <MenuItem value="UTC">UTC</MenuItem>
                  <MenuItem value="America/New_York">America / New York (EST)</MenuItem>
                  <MenuItem value="America/Chicago">America / Chicago (CST)</MenuItem>
                  <MenuItem value="America/Denver">America / Denver (MST)</MenuItem>
                  <MenuItem value="America/Los_Angeles">America / Los Angeles (PST)</MenuItem>
                  <MenuItem value="Europe/London">Europe / London (GMT)</MenuItem>
                  <MenuItem value="Europe/Paris">Europe / Paris (CET)</MenuItem>
                  <MenuItem value="Asia/Kolkata">Asia / Kolkata (IST)</MenuItem>
                  <MenuItem value="Asia/Tokyo">Asia / Tokyo (JST)</MenuItem>
                  <MenuItem value="Asia/Singapore">Asia / Singapore (SGT)</MenuItem>
                  <MenuItem value="Australia/Sydney">Australia / Sydney (AEST)</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Language</InputLabel>
                <Select label="Language" defaultValue="en" {...register('locale')}>
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Spanish</MenuItem>
                  <MenuItem value="fr">French</MenuItem>
                  <MenuItem value="de">German</MenuItem>
                  <MenuItem value="ja">Japanese</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Box>
              <Button
                type="submit"
                variant="contained"
                disabled={!isDirty || mutation.isPending}
                startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
              >
                Save Changes
              </Button>
            </Box>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Change password section
// ─────────────────────────────────────────────────────────────────────────────

interface PasswordForm {
  current_password: string
  new_password: string
  confirm_password: string
}

function PasswordSection() {
  const toast = useUIStore(s => s.toast)
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<PasswordForm>()

  const mutation = useMutation({
    mutationFn: (data: PasswordForm) =>
      post('/auth/change-password', {
        current_password: data.current_password,
        new_password: data.new_password,
      }),
    onSuccess: () => {
      toast.success('Password changed successfully')
      reset()
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail
      toast.error(detail ?? 'Failed to change password')
    },
  })

  return (
    <Card variant="outlined">
      <CardHeader title="Change Password" subheader="Use a strong password of at least 8 characters" />
      <Divider />
      <CardContent>
        <Box component="form" onSubmit={handleSubmit(d => mutation.mutate(d))}>
          <Stack spacing={2.5} maxWidth={400}>
            <TextField
              label="Current Password"
              type="password"
              size="small"
              fullWidth
              {...register('current_password', { required: 'Current password is required' })}
              error={!!errors.current_password}
              helperText={errors.current_password?.message}
            />
            <TextField
              label="New Password"
              type="password"
              size="small"
              fullWidth
              {...register('new_password', {
                required: 'New password is required',
                minLength: { value: 8, message: 'Minimum 8 characters' },
              })}
              error={!!errors.new_password}
              helperText={errors.new_password?.message}
            />
            <TextField
              label="Confirm New Password"
              type="password"
              size="small"
              fullWidth
              {...register('confirm_password', {
                required: 'Please confirm your password',
                validate: v => v === watch('new_password') || 'Passwords do not match',
              })}
              error={!!errors.confirm_password}
              helperText={errors.confirm_password?.message}
            />
            <Box>
              <Button
                type="submit"
                variant="contained"
                disabled={mutation.isPending}
                startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
              >
                Change Password
              </Button>
            </Box>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Preferences section
// ─────────────────────────────────────────────────────────────────────────────

interface PrefForm {
  theme: string
  notifications_email: boolean
  notifications_push: boolean
  notifications_in_app: boolean
  ai_suggestions_enabled: boolean
}

function PreferencesSection() {
  const toast = useUIStore(s => s.toast)
  const setTheme = useUIStore(s => s.setThemeMode)
  const qc = useQueryClient()

  const { data: prefs, isLoading } = useQuery({
    queryKey: ['users', 'me', 'preferences'],
    queryFn: () => get<any>('/users/me/preferences'),
  })

  const { control, handleSubmit, reset, formState: { isDirty } } = useForm<PrefForm>()

  useEffect(() => {
    if (prefs) {
      reset({
        theme: prefs.theme ?? 'light',
        notifications_email: prefs.notifications_email ?? true,
        notifications_push: prefs.notifications_push ?? true,
        notifications_in_app: prefs.notifications_in_app ?? true,
        ai_suggestions_enabled: prefs.ai_suggestions_enabled ?? true,
      })
    }
  }, [prefs, reset])

  const mutation = useMutation({
    mutationFn: (data: PrefForm) => patch('/users/me/preferences', data),
    onSuccess: (_, vars) => {
      toast.success('Preferences saved')
      if (vars.theme === 'dark' || vars.theme === 'light') setTheme(vars.theme)
      qc.invalidateQueries({ queryKey: ['users', 'me', 'preferences'] })
    },
    onError: () => toast.error('Failed to save preferences'),
  })

  if (isLoading) return <Box sx={{ p: 3 }}><CircularProgress size={24} /></Box>

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardHeader title="Preferences" subheader="Theme and notification settings" />
      <Divider />
      <CardContent>
        <Box component="form" onSubmit={handleSubmit(d => mutation.mutate(d))}>
          <Stack spacing={3}>

            {/* Appearance */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Appearance</Typography>
              <Controller
                name="theme"
                control={control}
                defaultValue="light"
                render={({ field }) => (
                  <FormControl size="small" fullWidth>
                    <InputLabel>Theme</InputLabel>
                    <Select {...field} label="Theme">
                      <MenuItem value="light">Light</MenuItem>
                      <MenuItem value="dark">Dark</MenuItem>
                      <MenuItem value="system">System default</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Box>

            <Divider />

            {/* Notifications */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Notifications</Typography>
              <Stack spacing={1}>
                {([
                  ['notifications_email',   'Email notifications',   'Receive updates via email'],
                  ['notifications_push',    'Push notifications',    'Browser push alerts'],
                  ['notifications_in_app',  'In-app notifications',  'Alerts inside the platform'],
                ] as const).map(([name, label, sub]) => (
                  <Controller key={name} name={name} control={control}
                    render={({ field }) => (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>{label}</Typography>
                          <Typography variant="caption" color="text.secondary">{sub}</Typography>
                        </Box>
                        <Switch {...field} checked={!!field.value} size="small" />
                      </Box>
                    )} />
                ))}
              </Stack>
            </Box>

            <Divider />

            {/* AI */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>AI Features</Typography>
              <Controller name="ai_suggestions_enabled" control={control}
                render={({ field }) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>AI suggestions</Typography>
                      <Typography variant="caption" color="text.secondary">Auto-suggest content as you work</Typography>
                    </Box>
                    <Switch {...field} checked={!!field.value} size="small" />
                  </Box>
                )} />
            </Box>

            <Button
              type="submit"
              variant="contained"
              disabled={!isDirty || mutation.isPending}
              startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
              sx={{ alignSelf: 'flex-start' }}
            >
              Save Preferences
            </Button>

          </Stack>
        </Box>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function UserProfilePage(): React.JSX.Element {
  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>My Profile</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your account settings, preferences, and security.
      </Typography>

      {/* Two-column layout on md+: Profile + Password on left, Preferences on right */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <Stack spacing={3}>
          <ProfileSection />
          <PasswordSection />
        </Stack>
        <PreferencesSection />
      </Box>
    </Box>
  )
}
