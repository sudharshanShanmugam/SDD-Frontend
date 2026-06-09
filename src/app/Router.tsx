import React, { lazy, type ReactNode } from 'react'
import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import type { Permission, RoleName } from '@/types/auth.types'
import { useAuthStore } from '@store/authStore'

// ============================================================
// Lazy Page Imports
// ============================================================

// Dashboard pages
const OrgDashboardPage       = lazy(() => import('@features/dashboard/pages/OrgDashboardPage'))
const WorkspaceDashboardPage = lazy(() => import('@features/dashboard/pages/WorkspaceDashboardPage'))
const WorkspacesPage         = lazy(() => import('@features/workspaces/pages/WorkspacesPage'))

// Project pages
const ProjectDashboardPage   = lazy(() => import('./pages/ProjectDashboardPage'))
const ProjectOverviewPage    = lazy(() => import('@features/dashboard/pages/ProjectOverviewPage'))
const DocumentListPage     = lazy(() => import('@features/documents/pages/DocumentListPage'))
const DocumentUploadPage   = lazy(() => import('@features/documents/pages/DocumentUploadPage'))
const DocumentDetailPage   = lazy(() => import('@features/documents/pages/DocumentDetailPage'))
const RequirementsPage     = lazy(() => import('./pages/RequirementsPage'))
const StoriesPage          = lazy(() => import('./pages/StoriesPage'))
const SprintPlanningPage   = lazy(() => import('@features/sprints/pages/SprintPlanningPage'))
const SprintBoardPage      = lazy(() => import('@features/sprints/pages/SprintBoardPage'))
const TaskBoardPage        = lazy(() => import('./pages/TaskBoardPage'))
const QADashboardPage      = lazy(() => import('./pages/QADashboardPage'))
const ReleasesPage         = lazy(() => import('./pages/ReleasesPage'))
const ApprovalsPage        = lazy(() => import('./pages/ApprovalsPage'))
const AIWorkflowPage       = lazy(() => import('./pages/AIWorkflowPage'))
const ProjectMembersPage   = lazy(() => import('./pages/ProjectMembersPage'))

// User / org pages
const UserProfilePage        = lazy(() => import('./pages/UserProfilePage'))
const NotificationsPage      = lazy(() => import('./pages/NotificationsPage'))

// Admin pages
const AdminConsolePage      = lazy(() => import('./pages/AdminConsolePage'))
const UserManagementPage    = lazy(() => import('./pages/UserManagementPage'))
const OrgManagementPage     = lazy(() => import('./pages/OrgManagementPage'))

// Auth / misc pages
const LoginPage       = lazy(() => import('./pages/LoginPage'))
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'))

// Not found
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

// Layout
const AppLayout = lazy(() => import('@layouts/AppLayout'))

// ============================================================
// Inline Loading Spinner
// ============================================================

function PageSpinner(): React.JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 300,
        flex: 1,
      }}
    >
      <CircularProgress size={36} thickness={4} />
    </Box>
  )
}

// ============================================================
// ProtectedRoute
// ============================================================

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps): React.JSX.Element {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}

// ============================================================
// RoleGuard
// ============================================================

interface RoleGuardProps {
  children: ReactNode
  roles?: RoleName[]
  permissions?: Permission[]
  projectId?: string
  fallback?: ReactNode
}

export function RoleGuard({
  children,
  roles,
  permissions,
  fallback,
}: RoleGuardProps): React.JSX.Element {
  const { hasAnyRole, hasAnyPermission, isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles?.length && !hasAnyRole(roles)) {
    return <>{fallback ?? <Navigate to="/unauthorized" replace />}</>
  }
  if (permissions?.length && !hasAnyPermission(permissions)) {
    return <>{fallback ?? <Navigate to="/unauthorized" replace />}</>
  }
  return <>{children}</>
}

// ============================================================
// Project Route Wrapper (injects projectId context)
// ============================================================

function ProjectRouteGuard({ children }: { children: ReactNode }): React.JSX.Element {
  const { projectId } = useParams<{ projectId: string }>()

  return (
    <RoleGuard
      permissions={['project:read']}
      projectId={projectId}
      fallback={<Navigate to="/dashboard" replace />}
    >
      {children}
    </RoleGuard>
  )
}

// ============================================================
// Main Router
// ============================================================

export function AppRouter(): React.JSX.Element {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<React.Suspense fallback={<PageSpinner />}><LoginPage /></React.Suspense>} />
      <Route path="/unauthorized" element={<React.Suspense fallback={<PageSpinner />}><UnauthorizedPage /></React.Suspense>} />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected routes under AppLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <React.Suspense fallback={<PageSpinner />}>
              <AppLayout />
            </React.Suspense>
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route path="dashboard" element={
          <React.Suspense fallback={<PageSpinner />}>
            <OrgDashboardPage />
          </React.Suspense>
        } />

        {/* Workspaces list */}
        <Route path="workspaces" element={
          <React.Suspense fallback={<PageSpinner />}>
            <WorkspacesPage />
          </React.Suspense>
        } />

        {/* Workspace detail */}
        <Route path="workspaces/:workspaceId" element={
          <React.Suspense fallback={<PageSpinner />}>
            <WorkspaceDashboardPage />
          </React.Suspense>
        } />

        {/* Project routes */}
        <Route path="projects/:projectId" element={
          <React.Suspense fallback={<PageSpinner />}>
            <ProjectRouteGuard>
              <ProjectDashboardPage />
            </ProjectRouteGuard>
          </React.Suspense>
        }>
          <Route index element={
            <React.Suspense fallback={<PageSpinner />}>
              <ProjectOverviewPage />
            </React.Suspense>
          } />

          <Route path="documents" element={
            <React.Suspense fallback={<PageSpinner />}>
              <DocumentListPage />
            </React.Suspense>
          } />
          <Route path="documents/upload" element={
            <React.Suspense fallback={<PageSpinner />}>
              <DocumentUploadPage />
            </React.Suspense>
          } />
          <Route path="documents/:documentId" element={
            <React.Suspense fallback={<PageSpinner />}>
              <DocumentDetailPage />
            </React.Suspense>
          } />

          <Route path="requirements" element={
            <React.Suspense fallback={<PageSpinner />}>
              <RequirementsPage />
            </React.Suspense>
          } />
          <Route path="stories" element={
            <React.Suspense fallback={<PageSpinner />}>
              <StoriesPage />
            </React.Suspense>
          } />
          <Route path="sprints" element={
            <React.Suspense fallback={<PageSpinner />}>
              <SprintPlanningPage />
            </React.Suspense>
          } />
          {/* Sprint board — /sprints/board (no specific sprint, auto-selects active)
              and /sprints/:sprintId (jump directly to a sprint) */}
          <Route path="sprints/board" element={
            <React.Suspense fallback={<PageSpinner />}>
              <SprintBoardPage />
            </React.Suspense>
          } />
          <Route path="sprints/:sprintId" element={
            <React.Suspense fallback={<PageSpinner />}>
              <SprintBoardPage />
            </React.Suspense>
          } />
          <Route path="tasks" element={
            <React.Suspense fallback={<PageSpinner />}>
              <TaskBoardPage />
            </React.Suspense>
          } />
          <Route path="qa" element={
            <React.Suspense fallback={<PageSpinner />}>
              <QADashboardPage />
            </React.Suspense>
          } />
          <Route path="releases" element={
            <React.Suspense fallback={<PageSpinner />}>
              <ReleasesPage />
            </React.Suspense>
          } />
          <Route path="approvals" element={
            <React.Suspense fallback={<PageSpinner />}>
              <ApprovalsPage />
            </React.Suspense>
          } />
          <Route path="ai-workflow" element={
            <React.Suspense fallback={<PageSpinner />}>
              <AIWorkflowPage />
            </React.Suspense>
          } />
          <Route path="members" element={
            <React.Suspense fallback={<PageSpinner />}>
              <ProjectMembersPage />
            </React.Suspense>
          } />
        </Route>

        {/* Admin routes */}
        <Route path="admin" element={
          <RoleGuard roles={['super_admin', 'org_admin']}>
            <React.Suspense fallback={<PageSpinner />}>
              <AdminConsolePage />
            </React.Suspense>
          </RoleGuard>
        } />
        <Route path="admin/users" element={
          <RoleGuard roles={['super_admin', 'org_admin']}>
            <React.Suspense fallback={<PageSpinner />}>
              <UserManagementPage />
            </React.Suspense>
          </RoleGuard>
        } />
        <Route path="admin/organizations" element={
          <RoleGuard roles={['super_admin']}>
            <React.Suspense fallback={<PageSpinner />}>
              <OrgManagementPage />
            </React.Suspense>
          </RoleGuard>
        } />

        {/* User pages */}
        <Route path="notifications" element={
          <React.Suspense fallback={<PageSpinner />}>
            <NotificationsPage />
          </React.Suspense>
        } />
        <Route path="profile" element={
          <React.Suspense fallback={<PageSpinner />}>
            <UserProfilePage />
          </React.Suspense>
        } />
      </Route>

      {/* 404 catch-all */}
      <Route path="*" element={
        <React.Suspense fallback={<PageSpinner />}>
          <NotFoundPage />
        </React.Suspense>
      } />
    </Routes>
  )
}
