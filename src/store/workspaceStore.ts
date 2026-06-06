import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Workspace, Project, ProjectSummary } from '@/types';

interface WorkspaceState {
  currentWorkspace:   Workspace | null;
  currentProject:     Project | null;
  recentProjects:     ProjectSummary[];
  favoriteProjects:   ProjectSummary[];
  isWorkspaceLoading: boolean;
  isProjectLoading:   boolean;

  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setCurrentProject:   (project: Project | null) => void;
  updateCurrentProject: (updates: Partial<Project>) => void;
  addRecentProject:    (project: ProjectSummary) => void;
  toggleFavoriteProject: (project: ProjectSummary) => void;
  clearWorkspace:      () => void;
  setWorkspaceLoading: (loading: boolean) => void;
  setProjectLoading:   (loading: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  devtools(
    persist(
      immer((set, get) => ({
        currentWorkspace:   null,
        currentProject:     null,
        recentProjects:     [],
        favoriteProjects:   [],
        isWorkspaceLoading: false,
        isProjectLoading:   false,

        setCurrentWorkspace: (workspace) => {
          set((s) => { s.currentWorkspace = workspace; });
        },

        setCurrentProject: (project) => {
          set((s) => { s.currentProject = project; });
          if (project) {
            const summary: ProjectSummary = {
              id:    project.id,
              name:  project.name,
              slug:  project.slug,
              key:   project.key,
              status: project.status,
              color:  project.color,
              icon:   project.icon,
              owner:  project.owner,
              stats:  project.stats,
            };
            get().addRecentProject(summary);
          }
        },

        updateCurrentProject: (updates) => {
          set((s) => {
            if (s.currentProject) {
              Object.assign(s.currentProject, updates);
            }
          });
        },

        addRecentProject: (project) => {
          set((s) => {
            // Remove if already exists
            s.recentProjects = s.recentProjects.filter((p) => p.id !== project.id);
            // Add to front
            s.recentProjects.unshift(project);
            // Cap at 10
            if (s.recentProjects.length > 10) {
              s.recentProjects.pop();
            }
          });
        },

        toggleFavoriteProject: (project) => {
          set((s) => {
            const idx = s.favoriteProjects.findIndex((p) => p.id === project.id);
            if (idx !== -1) {
              s.favoriteProjects.splice(idx, 1);
            } else {
              s.favoriteProjects.push(project);
            }
          });
        },

        clearWorkspace: () => {
          set((s) => {
            s.currentWorkspace = null;
            s.currentProject   = null;
          });
        },

        setWorkspaceLoading: (loading) => {
          set((s) => { s.isWorkspaceLoading = loading; });
        },

        setProjectLoading: (loading) => {
          set((s) => { s.isProjectLoading = loading; });
        },
      })),
      {
        name: 'sdd_workspace_v1',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          recentProjects:   state.recentProjects,
          favoriteProjects: state.favoriteProjects,
          currentWorkspace: state.currentWorkspace
            ? { id: state.currentWorkspace.id, name: state.currentWorkspace.name, slug: state.currentWorkspace.slug }
            : null,
        }),
      }
    ),
    { name: 'WorkspaceStore' }
  )
);

export const useCurrentProject   = () => useWorkspaceStore((s) => s.currentProject);
export const useCurrentWorkspace = () => useWorkspaceStore((s) => s.currentWorkspace);
