import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  ListItemIcon,
  Menu,
  MenuItem,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import { Bell, ChevronLeft, ChevronRight, LogOut, Moon, Search, Settings, Sun, User } from 'lucide-react'
import { useAuthStore, useUIStore } from '@/store'
import { useUnreadCount } from '@/store'
import { NotificationBell } from '@/shared/components/NotificationBell'
import { GlobalSearchDialog } from '@/shared/components/SearchBar'

const TOPBAR_HEIGHT   = 56
const SIDEBAR_EXPANDED  = 240
const SIDEBAR_COLLAPSED = 64

interface TopBarProps {
  sidebarCollapsed: boolean
  onToggleSidebar:  () => void
}

export function TopBar({ sidebarCollapsed, onToggleSidebar }: TopBarProps): React.JSX.Element {
  const navigate    = useNavigate()
  const user        = useAuthStore((s) => s.user)
  const logout      = useAuthStore((s) => s.logout)
  const themeMode   = useUIStore((s) => s.themeMode)
  const toggleTheme = useUIStore((s) => s.toggleTheme)
  const globalLoading = useUIStore((s) => s.globalLoading)
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen)
  const setGlobalSearchOpen   = useUIStore((s) => s.setGlobalSearchOpen)

  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null)

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setGlobalSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setCommandPaletteOpen, setGlobalSearchOpen])

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor:        'background.paper',
          borderBottom:   '1px solid',
          borderColor:    'divider',
          color:          'text.primary',
          left:           sidebarWidth,
          width:          `calc(100% - ${sidebarWidth}px)`,
          transition:     'left 200ms ease, width 200ms ease',
          zIndex:         (theme) => theme.zIndex.appBar,
        }}
      >
        {globalLoading && (
          <LinearProgress
            sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2 }}
          />
        )}

        <Toolbar sx={{ minHeight: `${TOPBAR_HEIGHT}px !important`, px: 2, gap: 1 }}>
          {/* Sidebar Toggle */}
          <Tooltip title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <IconButton
              size="small"
              onClick={onToggleSidebar}
              sx={{ width: 32, height: 32, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </IconButton>
          </Tooltip>

          {/* Search Trigger */}
          <TextField
            size="small"
            placeholder="Search... (⌘/)"
            onClick={() => setGlobalSearchOpen(true)}
            InputProps={{
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={15} />
                </InputAdornment>
              ),
              sx: {
                cursor: 'pointer',
                bgcolor: 'background.subtle',
                '& input': { cursor: 'pointer' },
              },
            }}
            sx={{ ml: 1, maxWidth: 360, flex: 1, cursor: 'pointer' }}
          />

          <Box sx={{ flex: 1 }} />

          {/* Theme Toggle */}
          <Tooltip title={themeMode === 'dark' ? 'Light mode' : 'Dark mode'}>
            <IconButton size="small" onClick={toggleTheme}>
              {themeMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <NotificationBell />

          {/* User Menu */}
          <Tooltip title="Account">
            <IconButton
              size="small"
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
              sx={{ p: 0.5 }}
            >
              <Avatar
                src={user?.avatar ?? undefined}
                sx={{ width: 32, height: 32, fontSize: '0.875rem', fontWeight: 600 }}
              >
                {user?.displayName?.[0]?.toUpperCase() ?? 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={() => setUserMenuAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ sx: { width: 220, mt: 1 } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={600} noWrap>
            {user?.displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {user?.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => { setUserMenuAnchor(null); navigate('/profile') }}>
          <ListItemIcon><User size={16} /></ListItemIcon>
          My Profile
        </MenuItem>
        <MenuItem onClick={() => { setUserMenuAnchor(null); navigate('/settings') }}>
          <ListItemIcon><Settings size={16} /></ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem
          onClick={() => { setUserMenuAnchor(null); logout(); navigate('/auth/login') }}
          sx={{ color: 'error.main', '&:hover': { bgcolor: 'error.50' } }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}><LogOut size={16} /></ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>

      {/* Global Search Dialog */}
      <GlobalSearchDialog />
    </>
  )
}

export default TopBar
