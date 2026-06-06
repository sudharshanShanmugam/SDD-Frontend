import React, { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
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
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Moon,
  Search,
  Settings,
  Sun,
  User,
} from 'lucide-react'
import { useAuthStore } from '@store/authStore'
import { useUIStore } from '@store/uiStore'
import Sidebar from './Sidebar'

// ============================================================
// Constants
// ============================================================

const TOPBAR_HEIGHT = 56
const SIDEBAR_EXPANDED = 240
const SIDEBAR_COLLAPSED = 64

// ============================================================
// Top Navigation Bar
// ============================================================

interface TopBarProps {
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
}

function TopBar({ sidebarCollapsed, onToggleSidebar }: TopBarProps): React.JSX.Element {
  const theme = useTheme()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const themeMode = useUIStore((s) => s.themeMode)
  const toggleTheme = useUIStore((s) => s.toggleTheme)
  const toggleGlobalSearch = useUIStore((s) => s.toggleGlobalSearch)
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen)
  const globalLoading = useUIStore((s) => s.globalLoading)

  const [userMenuAnchor, setUserMenuAnchor] = React.useState<HTMLElement | null>(null)
  const [notifAnchor, setNotifAnchor] = React.useState<HTMLElement | null>(null)
  const notifCount = 3 // TODO: from notification store

  // Keyboard shortcut for global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setCommandPaletteOpen])

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'text.primary',
          left: sidebarWidth,
          width: `calc(100% - ${sidebarWidth}px)`,
          transition: 'left 200ms ease, width 200ms ease',
          zIndex: theme.zIndex.appBar,
        }}
      >
        {globalLoading && (
          <LinearProgress
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
            }}
          />
        )}
        <Toolbar
          sx={{
            minHeight: `${TOPBAR_HEIGHT}px !important`,
            px: 2,
            gap: 1,
          }}
        >
          {/* Sidebar Toggle */}
          <Tooltip title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <IconButton
              size="small"
              onClick={onToggleSidebar}
              sx={{
                width: 32,
                height: 32,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1.5,
              }}
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </IconButton>
          </Tooltip>

          {/* Global Search */}
          <TextField
            size="small"
            placeholder="Search anything... (⌘K)"
            onClick={toggleGlobalSearch}
            onFocus={toggleGlobalSearch}
            InputProps={{
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} />
                </InputAdornment>
              ),
            }}
            sx={{
              ml: 1,
              flex: 1,
              maxWidth: 400,
              cursor: 'pointer',
              '& .MuiInputBase-root': {
                cursor: 'pointer',
                bgcolor: 'background.subtle',
                '&:hover': { bgcolor: 'action.hover' },
              },
            }}
          />

          <Box sx={{ flex: 1 }} />

          {/* Theme Toggle */}
          <Tooltip title={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton size="small" onClick={toggleTheme}>
              {themeMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              size="small"
              onClick={(e) => setNotifAnchor(e.currentTarget)}
            >
              <Bell size={18} />
            </IconButton>
          </Tooltip>

          {/* User Menu */}
          <Tooltip title="Account">
            <IconButton
              size="small"
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
              sx={{ p: 0.5 }}
            >
              <Avatar
                src={user?.avatar ?? undefined}
                sx={{ width: 32, height: 32, fontSize: '0.875rem' }}
              >
                {user?.displayName?.[0]?.toUpperCase() ?? 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* User Dropdown Menu */}
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
        <MenuItem
          onClick={() => {
            setUserMenuAnchor(null)
            navigate('/profile')
          }}
        >
          <ListItemIcon><User size={16} /></ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem
          onClick={() => {
            setUserMenuAnchor(null)
            navigate('/notifications')
          }}
        >
          <ListItemIcon><Bell size={16} /></ListItemIcon>
          Notifications
        </MenuItem>
      </Menu>

      {/* Notification Dropdown (placeholder) */}
      <Menu
        anchorEl={notifAnchor}
        open={Boolean(notifAnchor)}
        onClose={() => setNotifAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ sx: { width: 360, mt: 1 } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Notifications
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No new notifications
          </Typography>
        </Box>
      </Menu>
    </>
  )
}

// ============================================================
// Main App Layout
// ============================================================

export default function AppLayout(): React.JSX.Element {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <Box
        component="nav"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: theme.zIndex.drawer,
          flexShrink: 0,
          width: sidebarWidth,
          transition: 'width 200ms ease',
          overflowX: 'hidden',
        }}
      >
        <Sidebar collapsed={sidebarCollapsed} />
      </Box>

      {/* Main content area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          marginLeft: `${sidebarWidth}px`,
          transition: 'margin-left 200ms ease',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Top Navigation */}
        <TopBar sidebarCollapsed={sidebarCollapsed} onToggleSidebar={toggleSidebar} />

        {/* Page Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: 'auto',
            mt: `${TOPBAR_HEIGHT}px`,
            bgcolor: 'background.default',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
