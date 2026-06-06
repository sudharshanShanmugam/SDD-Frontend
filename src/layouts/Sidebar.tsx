import React, { useCallback } from 'react'
import { useLocation, useNavigate, useParams, NavLink } from 'react-router-dom'
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
  Divider,
  Avatar,
  Chip,
  IconButton,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  ListChecks,
  BookOpen,
  Zap,
  CheckSquare,
  FlaskConical,
  Tag,
  ShieldCheck,
  Sparkles,
  Code2,
  Bell,
  Users,
  Settings,
  ChevronRight,
  Briefcase,
  LayoutGrid,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '@store/authStore'
import { useWorkspaceStore } from '@store/workspaceStore'
import { useUIStore } from '@store/uiStore'

// ============================================================
// Types
// ============================================================

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number | string
  permission?: string
  roles?: string[]
  exact?: boolean
}

interface NavSection {
  title?: string
  items: NavItem[]
}

// ============================================================
// Nav Item Component
// ============================================================

interface SidebarNavItemProps {
  item: NavItem
  collapsed: boolean
}

function SidebarNavItem({ item, collapsed }: SidebarNavItemProps): React.JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = item.exact
    ? location.pathname === item.href
    : location.pathname.startsWith(item.href)

  const handleClick = (): void => {
    navigate(item.href)
  }

  const button = (
    <ListItemButton
      onClick={handleClick}
      selected={isActive}
      sx={{
        borderRadius: 2,
        mx: 1,
        mb: 0.5,
        px: collapsed ? 1.5 : 1.5,
        py: 1,
        justifyContent: collapsed ? 'center' : 'flex-start',
        minHeight: 40,
        color: isActive ? 'primary.main' : 'text.secondary',
        bgcolor: isActive ? 'primary.50' : 'transparent',
        '&:hover': {
          bgcolor: isActive ? 'primary.100' : 'action.hover',
          color: isActive ? 'primary.main' : 'text.primary',
        },
        '&.Mui-selected': {
          bgcolor: 'primary.50',
          color: 'primary.main',
          '&:hover': { bgcolor: 'primary.100' },
        },
        transition: 'all 150ms ease',
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: collapsed ? 'auto' : 36,
          color: 'inherit',
          '& svg': { width: 18, height: 18 },
        }}
      >
        {item.icon}
      </ListItemIcon>
      {!collapsed && (
        <ListItemText
          primary={item.label}
          primaryTypographyProps={{
            variant: 'body2',
            fontWeight: isActive ? 600 : 400,
            noWrap: true,
          }}
        />
      )}
      {!collapsed && item.badge !== undefined && (
        <Chip
          label={item.badge}
          size="small"
          color={isActive ? 'primary' : 'default'}
          sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
        />
      )}
    </ListItemButton>
  )

  if (collapsed) {
    return (
      <Tooltip title={item.label} placement="right" arrow>
        <ListItem disablePadding>{button}</ListItem>
      </Tooltip>
    )
  }

  return <ListItem disablePadding>{button}</ListItem>
}

// ============================================================
// Section Title
// ============================================================

function SectionTitle({ title, collapsed }: { title: string; collapsed: boolean }): React.JSX.Element {
  if (collapsed) return <Box sx={{ height: 8 }} />

  return (
    <Typography
      variant="overline"
      sx={{
        px: 2.5,
        pt: 2,
        pb: 0.5,
        display: 'block',
        color: 'text.disabled',
        fontSize: '0.6875rem',
        fontWeight: 600,
        letterSpacing: '0.08em',
      }}
    >
      {title}
    </Typography>
  )
}

// ============================================================
// Main Sidebar Component
// ============================================================

const SIDEBAR_WIDTH_EXPANDED = 240
const SIDEBAR_WIDTH_COLLAPSED = 64

interface SidebarProps {
  collapsed: boolean
}

export default function Sidebar({ collapsed }: SidebarProps): React.JSX.Element {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const hasAnyRole    = useAuthStore((s) => s.hasAnyRole)
  const canAccess     = useAuthStore((s) => s.canAccess)
  const currentProject = useWorkspaceStore((s) => s.currentProject)
  const { projectId } = useParams<{ projectId?: string }>()

  const effectiveProjectId = projectId ?? currentProject?.id

  // ── Navigation Sections ────────────────────────────────────

  const mainNav: NavSection = {
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard />,
        exact: true,
      },
      {
        label: 'Workspaces',
        href: '/workspaces',
        icon: <LayoutGrid />,
        exact: true,
      },
    ],
  }

  const projectNav: NavSection | null = effectiveProjectId
    ? {
        title: 'Project',
        items: [
          ...(canAccess('documents') ? [{
            label: 'Documents',
            href: `/projects/${effectiveProjectId}/documents`,
            icon: <FileText />,
          }] : []),
          ...(canAccess('requirements') ? [{
            label: 'Requirements',
            href: `/projects/${effectiveProjectId}/requirements`,
            icon: <ListChecks />,
          }] : []),
          ...(canAccess('stories') ? [{
            label: 'User Stories',
            href: `/projects/${effectiveProjectId}/stories`,
            icon: <BookOpen />,
          }] : []),
          ...(canAccess('sprints') ? [{
            label: 'Sprint Planning',
            href: `/projects/${effectiveProjectId}/sprints`,
            icon: <Zap />,
          }] : []),
          ...(canAccess('tasks') ? [{
            label: 'Task Board',
            href: `/projects/${effectiveProjectId}/tasks`,
            icon: <CheckSquare />,
          }] : []),
          ...(canAccess('qa') ? [{
            label: 'QA Dashboard',
            href: `/projects/${effectiveProjectId}/qa`,
            icon: <FlaskConical />,
          }] : []),
          ...(canAccess('releases') ? [{
            label: 'Releases',
            href: `/projects/${effectiveProjectId}/releases`,
            icon: <Tag />,
          }] : []),
        ],
      }
    : null

  const toolsNav: NavSection | null = effectiveProjectId
    ? {
        title: 'Tools',
        items: [
          ...(canAccess('approvals') ? [{
            label: 'Approvals',
            href: `/projects/${effectiveProjectId}/approvals`,
            icon: <ShieldCheck />,
            permission: 'approval:read',
          }] : []),
          ...(canAccess('ai-workflow') ? [{
            label: 'AI Workflow',
            href: `/projects/${effectiveProjectId}/ai-workflow`,
            icon: <Sparkles />,
            permission: 'ai:use',
          }] : []),
          ...(canAccess('ai-prompts') ? [{
            label: 'AI Prompts',
            href: `/projects/${effectiveProjectId}/ai-prompts`,
            icon: <Code2 />,
          }] : []),
          {
            label: 'Members',
            href: `/projects/${effectiveProjectId}/members`,
            icon: <Users />,
          },
        ],
      }
    : null

  const settingsNav: NavSection = {
    title: 'Account',
    items: [
      {
        label: 'Notifications',
        href: '/notifications',
        icon: <Bell />,
      },
      {
        label: 'Profile',
        href: '/profile',
        icon: <Settings />,
      },
      ...(hasAnyRole(['super_admin', 'org_admin'])
        ? [{ label: 'Admin', href: '/admin', icon: <Users /> }]
        : []),
    ],
  }

  const sections = [
    mainNav,
    projectNav,
    toolsNav,
    settingsNav,
  ].filter(Boolean) as NavSection[]

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          flexShrink: 0,
          transition: 'width 200ms ease',
        }}
      >
        {/* Logo / Brand */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: collapsed ? 1.5 : 2,
            height: 56,
            borderBottom: '1px solid',
            borderColor: 'divider',
            gap: 1.5,
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Briefcase size={18} color="white" />
          </Box>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
              >
                <Typography variant="h6" fontWeight={800} noWrap color="text.primary">
                  SDD Platform
                </Typography>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        {/* Navigation */}
        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1 }}>
          {sections.map((section, sIdx) => (
            <Box key={sIdx}>
              {sIdx > 0 && <Divider sx={{ my: 1, mx: 2 }} />}
              {section.title && (
                <SectionTitle title={section.title} collapsed={collapsed} />
              )}
              <List dense disablePadding>
                {section.items.map((item) => {
                  // Permission-gated items
                  if (item.permission && !hasPermission(item.permission as Parameters<typeof hasPermission>[0], effectiveProjectId)) {
                    return null
                  }
                  return (
                    <SidebarNavItem key={item.href} item={item} collapsed={collapsed} />
                  )
                })}
              </List>
            </Box>
          ))}
        </Box>

        {/* User profile + Logout */}
        <Box
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            p: collapsed ? 1 : 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            overflow: 'hidden',
          }}
        >
          <Tooltip title={collapsed ? `${user?.displayName ?? 'User'}` : ''} placement="right">
            <Avatar
              src={user?.avatar ?? undefined}
              sx={{ width: 32, height: 32, flexShrink: 0, fontSize: '0.875rem' }}
            >
              {user?.displayName?.[0]?.toUpperCase() ?? 'U'}
            </Avatar>
          </Tooltip>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}
              >
                <Typography variant="body2" fontWeight={500} noWrap>
                  {user?.displayName ?? 'User'}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {user?.email ?? ''}
                </Typography>
              </motion.div>
            )}
          </AnimatePresence>
          <Tooltip title="Sign out" placement={collapsed ? 'right' : 'top'}>
            <IconButton
              size="small"
              onClick={() => { logout(); navigate('/auth/login') }}
              sx={{
                flexShrink: 0,
                color: 'text.secondary',
                '&:hover': { color: 'error.main', bgcolor: 'error.50' },
                transition: 'color 150ms ease, background-color 150ms ease',
              }}
            >
              <LogOut size={16} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </motion.div>
  )
}
