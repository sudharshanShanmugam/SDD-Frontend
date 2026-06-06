import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { Box, Button, Container, Typography } from '@mui/material'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class GlobalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ errorInfo: info })
    console.error('[ErrorBoundary] Caught unhandled error:', error, info)
    this.props.onError?.(error, info)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleReload = (): void => {
    window.location.reload()
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Container maxWidth="sm">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              gap: 3,
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: 'error.50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'error.main',
              }}
            >
              <AlertTriangle size={32} />
            </Box>

            <Box>
              <Typography variant="h4" gutterBottom fontWeight={700}>
                Something went wrong
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
                An unexpected error occurred. Please try refreshing the page.
              </Typography>
            </Box>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'error.50',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'error.200',
                  textAlign: 'left',
                  width: '100%',
                  maxHeight: 200,
                  overflow: 'auto',
                }}
              >
                <Typography variant="caption" component="pre" color="error.dark" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={this.handleReset}
                sx={{ gap: 1 }}
              >
                <RefreshCw size={16} />
                Try Again
              </Button>
              <Button
                variant="contained"
                onClick={this.handleReload}
              >
                Reload Page
              </Button>
            </Box>
          </Box>
        </Container>
      )
    }

    return this.props.children
  }
}

// Alias for backwards compatibility and App.tsx usage
export const ErrorBoundary = GlobalErrorBoundary

// Feature-level error boundary with lighter UI
export class FeatureErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ errorInfo: info })
    console.error('[FeatureErrorBoundary]', error, info)
    this.props.onError?.(error, info)
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            p: 3,
            textAlign: 'center',
            bgcolor: 'error.50',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'error.200',
          }}
        >
          <Typography variant="body2" color="error.main" fontWeight={500}>
            Failed to load this section
          </Typography>
          <Button
            size="small"
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            sx={{ mt: 1 }}
          >
            Retry
          </Button>
        </Box>
      )
    }

    return this.props.children
  }
}
