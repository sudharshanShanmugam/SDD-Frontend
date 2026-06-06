/// <reference types="vite/client" />

// Augment Vite's ImportMetaEnv with the project-specific variables
// defined in .env / .env.local
interface ImportMetaEnv {
  // App
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_ENV: string

  // API
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_VERSION: string
  readonly VITE_API_TIMEOUT: string

  // WebSocket / Socket.IO
  readonly VITE_WS_URL: string
  readonly VITE_WS_PATH: string
  readonly VITE_WS_RECONNECT_ATTEMPTS: string
  readonly VITE_WS_RECONNECT_DELAY: string

  // Auth
  readonly VITE_AUTH_TOKEN_KEY: string
  readonly VITE_AUTH_REFRESH_TOKEN_KEY: string
  readonly VITE_AUTH_TOKEN_EXPIRY: string
  readonly VITE_OAUTH_GOOGLE_CLIENT_ID: string
  readonly VITE_OAUTH_GITHUB_CLIENT_ID: string

  // Feature flags
  readonly VITE_FEATURE_AI_ASSISTANT: string
  readonly VITE_FEATURE_COLLABORATION: string
  readonly VITE_FEATURE_ANALYTICS: string
  readonly VITE_FEATURE_GANTT: string
  readonly VITE_FEATURE_EXPORT_PDF: string

  // Analytics
  readonly VITE_ANALYTICS_ENABLED: string
  readonly VITE_ANALYTICS_KEY: string

  // Sentry
  readonly VITE_SENTRY_DSN: string
  readonly VITE_SENTRY_ENVIRONMENT: string
  readonly VITE_SENTRY_TRACES_SAMPLE_RATE: string

  // Files
  readonly VITE_MAX_FILE_SIZE_MB: string
  readonly VITE_ALLOWED_FILE_TYPES: string

  // AI
  readonly VITE_AI_MODEL_DEFAULT: string
  readonly VITE_AI_CONFIDENCE_THRESHOLD: string

  // Pagination
  readonly VITE_DEFAULT_PAGE_SIZE: string
  readonly VITE_MAX_PAGE_SIZE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
