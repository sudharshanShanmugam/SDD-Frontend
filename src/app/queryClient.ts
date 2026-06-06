import { QueryClient, MutationCache, QueryCache } from '@tanstack/react-query'

// Custom error type for typed error handling
export interface ApiError {
  code: string
  message: string
  status: number
  details?: Record<string, string[]>
  requestId?: string
}

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as ApiError).status === 'number'
  )
}

function handleGlobalError(error: unknown): void {
  if (!isApiError(error)) return

  if (error.status === 403) {
    console.warn('[QueryClient] 403 Forbidden:', error.message)
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleGlobalError,
  }),
  mutationCache: new MutationCache({
    onError: handleGlobalError,
  }),
  defaultOptions: {
    queries: {
      // 5 minutes stale time
      staleTime: 5 * 60 * 1000,
      // 30 minutes garbage collection time
      gcTime: 30 * 60 * 1000,
      // Retry 3 times with exponential backoff
      retry: (failureCount, error) => {
        if (isApiError(error) && (error.status === 403 || error.status === 404)) {
          return false
        }
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for live data
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error) => {
        if (isApiError(error) && error.status < 500) {
          return false
        }
        return failureCount < 2
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
})
