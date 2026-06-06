import React, { Suspense, useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import {
  Alert,
  AlertTitle,
  Collapse,
  ThemeProvider,
  CssBaseline,
  CircularProgress,
  Box,
  Snackbar,
  Stack,
} from '@mui/material'
import { queryClient } from './queryClient'
import { lightTheme, darkTheme } from '@theme'
import { AppRouter } from './Router'
import { GlobalErrorBoundary } from './ErrorBoundary'
import { SocketProvider } from '@/shared/providers/SocketProvider'
import { useUIStore, useToasts, type Toast } from '@store/uiStore'

// ============================================================
// App Shell Loading Fallback
// ============================================================

function AppLoadingFallback(): React.JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        bgcolor: 'background.default',
      }}
    >
      <CircularProgress size={40} thickness={4} />
    </Box>
  )
}

// ============================================================
// Global Toast Manager (uses UIStore)
// ============================================================

function ToastManager(): React.JSX.Element {
  const toasts = useToasts()
  const dismissToast = useUIStore((s) => s.dismissToast)

  return (
    <Stack
      spacing={1}
      sx={{
        position: 'fixed',
        top: 72,
        right: 16,
        zIndex: 9999,
        maxWidth: 400,
        width: '100%',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast: Toast) => (
        <Collapse key={toast.id} in appear>
          <Snackbar
            open
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            autoHideDuration={toast.duration ?? 4000}
            onClose={() => dismissToast(toast.id)}
            sx={{
              position: 'relative',
              transform: 'none',
              top: 'auto',
              right: 'auto',
              pointerEvents: 'auto',
            }}
          >
            <Alert
              severity={toast.severity}
              onClose={() => dismissToast(toast.id)}
              sx={{ width: '100%', boxShadow: 4 }}
              variant="filled"
            >
              {toast.title && <AlertTitle>{toast.title}</AlertTitle>}
              {toast.message}
            </Alert>
          </Snackbar>
        </Collapse>
      ))}
    </Stack>
  )
}

// ============================================================
// Inner App - reads theme from store
// ============================================================

function ThemedApp(): React.JSX.Element {
  const themeMode = useUIStore((s) => s.themeMode)
  const theme = themeMode === 'dark' ? darkTheme : lightTheme

  // Listen for programmatic toast events (from API interceptor)
  useEffect(() => {
    const handleToastEvent = (e: Event): void => {
      const detail = (e as CustomEvent<{ severity: Toast['severity']; title?: string; message: string }>).detail
      useUIStore.getState().showToast({ severity: detail.severity, title: detail.title, message: detail.message })
    }
    window.addEventListener('sdd:toast', handleToastEvent)
    return () => window.removeEventListener('sdd:toast', handleToastEvent)
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalErrorBoundary>
        <SocketProvider>
          <BrowserRouter>
            <Suspense fallback={<AppLoadingFallback />}>
              <AppRouter />
            </Suspense>
          </BrowserRouter>
          {/* Global toast notifications */}
          <ToastManager />
        </SocketProvider>
      </GlobalErrorBoundary>
    </ThemeProvider>
  )
}

// ============================================================
// Root App Component
// ============================================================

export default function App(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemedApp />
    </QueryClientProvider>
  )
}
