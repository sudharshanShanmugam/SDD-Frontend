import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ThemeMode, ModalState, BreadcrumbItem } from '@/types';
import { nanoid } from 'nanoid';

// ============================================================
// Types
// ============================================================

export type ToastSeverity = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  severity: ToastSeverity;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  severity?: 'warning' | 'error' | 'info';
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface UIState {
  // Sidebar
  sidebarOpen:      boolean;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  projectSidebarOpen: boolean;

  // Theme
  themeMode: ThemeMode;

  // Breadcrumbs
  breadcrumbs: BreadcrumbItem[];

  // Toasts
  toasts: Toast[];

  // Modals
  confirmDialog: ConfirmDialogState;
  modals: Record<string, ModalState>;

  // Loading
  globalLoading: boolean;
  loadingMessage: string;

  // Search
  globalSearchOpen: boolean;

  // Command palette
  commandPaletteOpen: boolean;

  // Active panel
  activeRightPanel: string | null;

  // Density mode
  densityMode: 'comfortable' | 'compact' | 'spacious';

  // ── Actions ────────────────────────────────────────────────

  toggleSidebar:        () => void;
  setSidebarOpen:       (open: boolean) => void;
  setSidebarCollapsed:  (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleProjectSidebar: () => void;

  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme:  () => void;

  setBreadcrumbs: (crumbs: BreadcrumbItem[]) => void;

  showToast:   (toast: Omit<Toast, 'id'>) => string;
  dismissToast:(id: string) => void;
  clearToasts: () => void;

  // Convenience toast methods
  toast: {
    success: (message: string, title?: string) => void;
    error:   (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info:    (message: string, title?: string) => void;
  };

  showConfirm:    (config: Omit<ConfirmDialogState, 'isOpen'>) => void;
  hideConfirm:    () => void;

  openModal:  (key: string, data?: unknown) => void;
  closeModal: (key: string) => void;
  isModalOpen:(key: string) => boolean;
  getModalData: <T>(key: string) => T | undefined;

  setGlobalLoading:  (loading: boolean, message?: string) => void;
  setGlobalSearchOpen: (open: boolean) => void;
  toggleGlobalSearch:  () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette:  () => void;
  setActiveRightPanel:   (panel: string | null) => void;
  setDensityMode: (mode: 'comfortable' | 'compact' | 'spacious') => void;
}

// ============================================================
// Store
// ============================================================

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // ── Initial State ──────────────────────────────────────
        sidebarOpen:        true,
        sidebarCollapsed:   false,
        mobileSidebarOpen:  false,
        projectSidebarOpen: true,
        themeMode:          'light',
        breadcrumbs:        [],
        toasts:             [],
        confirmDialog: {
          isOpen: false,
          title:  '',
          message: '',
        },
        modals:            {},
        globalLoading:     false,
        loadingMessage:    '',
        globalSearchOpen:  false,
        commandPaletteOpen: false,
        activeRightPanel:  null,
        densityMode:       'comfortable',

        // ── Sidebar ────────────────────────────────────────────

        toggleSidebar: () => {
          set((s) => { s.sidebarOpen = !s.sidebarOpen; });
        },

        setSidebarOpen: (open) => {
          set((s) => { s.sidebarOpen = open; });
        },

        setSidebarCollapsed: (collapsed) => {
          set((s) => { s.sidebarCollapsed = collapsed; });
        },

        setMobileSidebarOpen: (open) => {
          set((s) => { s.mobileSidebarOpen = open; });
        },

        toggleProjectSidebar: () => {
          set((s) => { s.projectSidebarOpen = !s.projectSidebarOpen; });
        },

        // ── Theme ──────────────────────────────────────────────

        setThemeMode: (mode) => {
          set((s) => { s.themeMode = mode; });
        },

        toggleTheme: () => {
          set((s) => {
            s.themeMode = s.themeMode === 'dark' ? 'light' : 'dark';
          });
        },

        // ── Breadcrumbs ────────────────────────────────────────

        setBreadcrumbs: (crumbs) => {
          set((s) => { s.breadcrumbs = crumbs; });
        },

        // ── Toasts ─────────────────────────────────────────────

        showToast: (toast) => {
          const id = nanoid();
          set((s) => {
            s.toasts.push({ ...toast, id });
            // Cap at 5 toasts
            if (s.toasts.length > 5) {
              s.toasts.shift();
            }
          });
          return id;
        },

        dismissToast: (id) => {
          set((s) => {
            s.toasts = s.toasts.filter((t) => t.id !== id);
          });
        },

        clearToasts: () => {
          set((s) => { s.toasts = []; });
        },

        toast: {
          success: (message, title) => {
            get().showToast({ severity: 'success', message, title });
          },
          error: (message, title) => {
            get().showToast({ severity: 'error', message, title, duration: 6000 });
          },
          warning: (message, title) => {
            get().showToast({ severity: 'warning', message, title });
          },
          info: (message, title) => {
            get().showToast({ severity: 'info', message, title });
          },
        },

        // ── Confirm Dialog ─────────────────────────────────────

        showConfirm: (config) => {
          set((s) => {
            s.confirmDialog = { ...config, isOpen: true };
          });
        },

        hideConfirm: () => {
          set((s) => {
            s.confirmDialog = { isOpen: false, title: '', message: '' };
          });
        },

        // ── Modals ─────────────────────────────────────────────

        openModal: (key, data) => {
          set((s) => {
            s.modals[key] = { isOpen: true, data };
          });
        },

        closeModal: (key) => {
          set((s) => {
            if (s.modals[key]) {
              s.modals[key] = { ...s.modals[key]!, isOpen: false };
            }
          });
        },

        isModalOpen: (key) => {
          return get().modals[key]?.isOpen ?? false;
        },

        getModalData: <T>(key: string) => {
          return get().modals[key]?.data as T | undefined;
        },

        // ── Global Loading ─────────────────────────────────────

        setGlobalLoading: (loading, message = '') => {
          set((s) => {
            s.globalLoading   = loading;
            s.loadingMessage  = message;
          });
        },

        // ── Search & Command Palette ───────────────────────────

        setGlobalSearchOpen: (open) => {
          set((s) => { s.globalSearchOpen = open; });
        },

        toggleGlobalSearch: () => {
          set((s) => { s.globalSearchOpen = !s.globalSearchOpen; });
        },

        setCommandPaletteOpen: (open) => {
          set((s) => { s.commandPaletteOpen = open; });
        },

        toggleCommandPalette: () => {
          set((s) => { s.commandPaletteOpen = !s.commandPaletteOpen; });
        },

        // ── Panels ─────────────────────────────────────────────

        setActiveRightPanel: (panel) => {
          set((s) => { s.activeRightPanel = panel; });
        },

        setDensityMode: (mode) => {
          set((s) => { s.densityMode = mode; });
        },
      })),
      {
        name: 'sdd_ui_v1',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          themeMode:        state.themeMode,
          sidebarCollapsed: state.sidebarCollapsed,
          densityMode:      state.densityMode,
          projectSidebarOpen: state.projectSidebarOpen,
        }),
      }
    ),
    { name: 'UIStore' }
  )
);

// ============================================================
// Convenience selectors
// ============================================================

export const useThemeMode    = ()  => useUIStore((s) => s.themeMode);
export const useToasts       = ()  => useUIStore((s) => s.toasts);
export const useConfirmDialog = () => useUIStore((s) => s.confirmDialog);
export const useSidebarState = ()  => useUIStore((s) => ({
  open:      s.sidebarOpen,
  collapsed: s.sidebarCollapsed,
  mobile:    s.mobileSidebarOpen,
}));
