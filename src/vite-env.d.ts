/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_OAUTH_GOOGLE_CLIENT_ID: string
  readonly VITE_OAUTH_GITHUB_CLIENT_ID: string
  readonly VITE_ANALYTICS_KEY: string
  readonly VITE_SENTRY_DSN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
