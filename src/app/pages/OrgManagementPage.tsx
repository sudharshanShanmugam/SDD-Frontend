import React, { useState } from 'react'
import {
  Box, Typography, Button, TextField, InputAdornment,
  Stack, Chip, Paper,
} from '@mui/material'
import {
  Add, Search, Business,
} from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { get } from '@api/client'
import { OrgList } from '@features/admin/components/OrgList'
import type { OrgPlan, OrgStatus } from '@/types'

interface OrgRow {
  id: string
  name: string
  plan: OrgPlan
  status: OrgStatus
  userCount: number
  projectCount: number
  storageGB: number
  createdAt: string
}
interface OrgListResponse { data: OrgRow[]; total: number }

const PLAN_CONFIG: Record<OrgPlan, { label: string; color: string; bg: string }> = {
  free:         { label: 'Free',         color: '#64748b', bg: '#f1f5f9' },
  starter:      { label: 'Starter',      color: '#6366f1', bg: '#eef2ff' },
  professional: { label: 'Professional', color: '#3b82f6', bg: '#eff6ff' },
  enterprise:   { label: 'Enterprise',   color: '#10b981', bg: '#f0fdf4' },
}

const STATUS_CONFIG: Record<OrgStatus, { label: string; color: string; bg: string }> = {
  active:    { label: 'Active',    color: '#10b981', bg: '#f0fdf4' },
  trial:     { label: 'Trial',     color: '#f59e0b', bg: '#fffbeb' },
  suspended: { label: 'Suspended', color: '#ef4444', bg: '#fef2f2' },
  cancelled: { label: 'Cancelled', color: '#94a3b8', bg: '#f1f5f9' },
}

function StatPill({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <Box sx={{ textAlign: 'center', px: 2.5, py: 1.5 }}>
      <Typography variant="h5" fontWeight={800} sx={{ color: color ?? 'text.primary', lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
        {label}
      </Typography>
    </Box>
  )
}

const ALL_PLANS: OrgPlan[]   = ['free', 'starter', 'professional', 'enterprise']
const ALL_STATUSES: OrgStatus[] = ['active', 'trial', 'suspended', 'cancelled']

export default function OrgManagementPage(): React.JSX.Element {
  const [search, setSearch] = useState('')
  const [activePlan, setActivePlan] = useState<OrgPlan | 'all'>('all')
  const [activeStatus, setActiveStatus] = useState<OrgStatus | 'all'>('all')

  const { data } = useQuery<OrgListResponse>({
    queryKey: ['admin', 'orgs', 'summary'],
    queryFn: async () => {
      try { return await get<OrgListResponse>('/admin/organizations?page=1&page_size=200') }
      catch { return { data: [], total: 0 } }
    },
  })

  const rows = data?.data ?? []
  const total     = rows.length
  const active    = rows.filter(r => r.status === 'active').length
  const trial     = rows.filter(r => r.status === 'trial').length
  const suspended = rows.filter(r => r.status === 'suspended').length
  const enterprise = rows.filter(r => r.plan === 'enterprise').length

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{
            width: 40, height: 40, borderRadius: 2,
            bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Business sx={{ color: 'white', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} lineHeight={1.2}>Organizations</Typography>
            <Typography variant="body2" color="text.secondary">View and manage registered organizations</Typography>
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          <Button variant="contained" startIcon={<Add />} size="small" sx={{ borderRadius: 2, fontWeight: 700 }}>
            New Organization
          </Button>
        </Stack>
      </Box>

      {/* ── Stat pills ─────────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ borderRadius: 2, display: 'inline-flex', flexWrap: 'wrap', alignSelf: 'flex-start' }}>
        <StatPill label="Total"      value={total}      />
        <Box sx={{ width: '1px', bgcolor: 'divider', my: 1 }} />
        <StatPill label="Active"     value={active}     color="#10b981" />
        <Box sx={{ width: '1px', bgcolor: 'divider', my: 1 }} />
        <StatPill label="Trial"      value={trial}      color="#f59e0b" />
        <Box sx={{ width: '1px', bgcolor: 'divider', my: 1 }} />
        <StatPill label="Suspended"  value={suspended}  color="#ef4444" />
        <Box sx={{ width: '1px', bgcolor: 'divider', my: 1 }} />
        <StatPill label="Enterprise" value={enterprise} color="#6366f1" />
      </Paper>

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Search organizations..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 260 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
        />

        {/* Plan filter */}
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Typography variant="caption" color="text.secondary" fontWeight={600}>Plan:</Typography>
          <Chip
            label="All" size="small"
            onClick={() => setActivePlan('all')}
            variant={activePlan === 'all' ? 'filled' : 'outlined'}
            sx={activePlan === 'all' ? { bgcolor: 'text.primary', color: 'background.paper', fontWeight: 700 } : {}}
          />
          {ALL_PLANS.map(p => {
            const cfg = PLAN_CONFIG[p]
            const active = activePlan === p
            return (
              <Chip key={p} label={cfg.label} size="small"
                onClick={() => setActivePlan(active ? 'all' : p)}
                variant={active ? 'filled' : 'outlined'}
                sx={{
                  borderColor: cfg.color,
                  color: active ? 'white' : cfg.color,
                  bgcolor: active ? cfg.color : undefined,
                  fontWeight: 600,
                }}
              />
            )
          })}
        </Stack>

        {/* Status filter */}
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Typography variant="caption" color="text.secondary" fontWeight={600}>Status:</Typography>
          {ALL_STATUSES.map(s => {
            const cfg = STATUS_CONFIG[s]
            const isActive = activeStatus === s
            return (
              <Chip key={s} label={cfg.label} size="small"
                onClick={() => setActiveStatus(isActive ? 'all' : s)}
                variant={isActive ? 'filled' : 'outlined'}
                sx={{
                  borderColor: cfg.color,
                  color: isActive ? 'white' : cfg.color,
                  bgcolor: isActive ? cfg.color : undefined,
                  fontWeight: 600,
                }}
              />
            )
          })}
        </Stack>
      </Box>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <OrgList search={search} planFilter={activePlan} statusFilter={activeStatus} />
    </Box>
  )
}
