import { get } from './client';

export interface AnalyticsPeriod {
  start: string;
  end: string;
}

export const analyticsApi = {
  getDashboard: (projectId: string, period?: AnalyticsPeriod) =>
    get<DashboardAnalytics>(`/projects/${projectId}/analytics/dashboard`, { params: period }),

  getVelocity: (projectId: string) =>
    get<VelocityAnalytics>(`/projects/${projectId}/analytics/velocity`),

  getBurndown: (sprintId: string) =>
    get<BurndownAnalytics>(`/sprints/${sprintId}/analytics/burndown`),

  getRequirementsCoverage: (projectId: string) =>
    get<RequirementsCoverage>(`/projects/${projectId}/analytics/requirements-coverage`),

  getTeamWorkload: (projectId: string) =>
    get<TeamWorkload[]>(`/projects/${projectId}/analytics/team-workload`),

  getOrgMetrics: (orgId: string, period?: AnalyticsPeriod) =>
    get<OrgMetrics>(`/organizations/${orgId}/analytics`, { params: period }),
};

export interface DashboardAnalytics {
  totalRequirements: number;
  approvedRequirements: number;
  totalStories: number;
  completedStories: number;
  totalTasks: number;
  completedTasks: number;
  activeSprintProgress: number;
  aiGeneratedCount: number;
  requirementsByStatus: Array<{ status: string; count: number }>;
  storiesByStatus: Array<{ status: string; count: number }>;
  recentActivity: Array<{ date: string; count: number }>;
  topContributors: Array<{ userId: string; name: string; contributions: number }>;
}

export interface VelocityAnalytics {
  sprints: Array<{
    id: string;
    name: string;
    committed: number;
    completed: number;
    velocity: number;
  }>;
  average: number;
  trend: 'up' | 'down' | 'stable';
}

export interface BurndownAnalytics {
  dataPoints: Array<{ date: string; remaining: number; ideal: number }>;
  isOnTrack: boolean;
  completionDate: string | null;
}

export interface RequirementsCoverage {
  total: number;
  covered: number;
  percentage: number;
  uncoveredRequirements: Array<{ id: string; title: string }>;
}

export interface TeamWorkload {
  userId: string;
  name: string;
  avatar: string | null;
  assignedStories: number;
  assignedTasks: number;
  totalPoints: number;
  completedPoints: number;
  utilizationPercent: number;
}

export interface OrgMetrics {
  totalProjects: number;
  activeProjects: number;
  totalUsers: number;
  aiRequestsThisMonth: number;
  avgProjectVelocity: number;
  requirementCompletionRate: number;
}
