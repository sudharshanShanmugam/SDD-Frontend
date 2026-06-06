import React, { memo } from 'react'
import { useLocation, NavLink, useParams } from 'react-router-dom'
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Chip,
} from '@mui/material'
import {
  LayoutDashboard,
  FileText,
  Hash,
  BookOpen,
  Zap,
  CheckSquare,
  FlaskConical,
  Tag,
  ShieldCheck,
  Sparkles,
  Timer,
  LayoutGrid,
  Users,
} from 'lucide-react'
import { useCurrentProject } from '@/store'

interface NavItem {
  label:       string
  path:        string
  icon:        React.ReactNode
  badge?:      number | string
  divider?:    boolean
  /** Match exactly (no startsWith fallback). */
  exact?:      boolean
  /**
   * Override the path prefix used for the startsWith active check.
   * Useful when several URLs should highlight the same nav item
   * (e.g. /sprints/board AND /sprints/:id → Sprint Board).
   */
  activePath?: string
}

function getNavItems(projectId: string): NavItem[] {
  const base = `/projects/${projectId}`
  return [
    { label: 'Overview',      path: base,                    icon: <LayoutDashboard size={16} /> },
    { label: 'Documents',     path: `${base}/documents`,     icon: <FileText size={16} /> },
    { label: 'Requirements',  path: `${base}/requirements`,  icon: <Hash size={16} /> },
    { label: 'Stories',       path: `${base}/stories`,         icon: <BookOpen size={16} />, divider: true },
    // Sprint Planning is exact — /sprints/board and /sprints/:id should NOT activate this item.
    { label: 'Sprint Plan',   path: `${base}/sprints`,         icon: <Timer size={16} />,       exact: true },
    // Sprint Board matches /sprints/board AND /sprints/:sprintId (any path under /sprints/).
    { label: 'Sprint Board',  path: `${base}/sprints/board`,   icon: <LayoutGrid size={16} />,  activePath: `${base}/sprints/` },
    { label: 'Tasks',         path: `${base}/tasks`,           icon: <CheckSquare size={16} /> },
    { label: 'QA',            path: `${base}/qa`,            icon: <FlaskConical size={16} />, divider: true },
    { label: 'Releases',      path: `${base}/releases`,      icon: <Tag size={16} /> },
    { label: 'Approvals',     path: `${base}/approvals`,     icon: <ShieldCheck size={16} />, divider: true },
    { label: 'AI Workflow',   path: `${base}/ai-workflow`,   icon: <Sparkles size={16} /> },
    { label: 'AI Prompts',    path: `${base}/ai-prompts`,    icon: <Zap size={16} />, divider: true },
    { label: 'Members',       path: `${base}/members`,       icon: <Users size={16} /> },
  ]
}

export const ProjectSidebar = memo(() => {
  const { projectId } = useParams<{ projectId: string }>()
  const location      = useLocation()
  const project       = useCurrentProject()

  if (!projectId) return null

  const navItems = getNavItems(projectId)

  return (
    <Box
      sx={{
        width:    220,
        height:   '100%',
        bgcolor:  'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Project name */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Project
        </Typography>
        <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ mt: 0.25 }}>
          {project?.name ?? 'Loading...'}
        </Typography>
        {project?.key && (
          <Chip label={project.key} size="small" sx={{ mt: 0.5, height: 18, fontSize: '0.65rem' }} />
        )}
      </Box>

      <Divider />

      {/* Nav Items */}
      <List dense sx={{ px: 1, py: 1, flex: 1, overflow: 'auto' }} disablePadding>
        {navItems.map((item, idx) => {
          // Exact-match items never use startsWith.
          // activePath lets a nav item highlight on a broader prefix
          // (e.g. Sprint Board highlights on both /sprints/board and /sprints/:id).
          const checkPath = item.activePath ?? item.path
          const isActive = location.pathname === item.path || (
            !item.exact &&
            checkPath !== `/projects/${projectId}` &&
            location.pathname.startsWith(checkPath)
          )

          return (
            <React.Fragment key={item.path}>
              {item.divider && idx > 0 && <Divider sx={{ my: 0.75, mx: 1 }} />}
              <ListItemButton
                component={NavLink}
                to={item.path}
                selected={isActive}
                sx={{
                  borderRadius: 1.5,
                  mb: 0.25,
                  py: 0.75,
                  px: 1.25,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 30,
                    color:    isActive ? 'primary.main' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    variant:    'body2',
                    fontWeight: isActive ? 600 : 500,
                    fontSize:   '0.8125rem',
                  }}
                />
                {item.badge !== undefined && (
                  <Chip
                    label={item.badge}
                    size="small"
                    sx={{ height: 18, '& .MuiChip-label': { px: 0.75, fontSize: '0.65rem' } }}
                    color={isActive ? 'primary' : 'default'}
                  />
                )}
              </ListItemButton>
            </React.Fragment>
          )
        })}
      </List>
    </Box>
  )
})

ProjectSidebar.displayName = 'ProjectSidebar'

export default ProjectSidebar
