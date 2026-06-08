export const API_VERSION = 'v1';
export const API_TIMEOUT = 30_000;

export const WS_PATH = '/socket.io';
export const WS_RECONNECT_ATTEMPTS = 5;
export const WS_RECONNECT_DELAY = 1_000;

export const AUTH_TOKEN_KEY = 'sdd_access_token';
export const AUTH_REFRESH_TOKEN_KEY = 'sdd_refresh_token';
export const AUTH_TOKEN_EXPIRY = 3_600;

export const FEATURES = {
  AI_ASSISTANT: true,
  COLLABORATION: true,
  ANALYTICS: true,
  GANTT: true,
  EXPORT_PDF: true,
} as const;

export const ANALYTICS_ENABLED = false;

export const SENTRY_TRACES_SAMPLE_RATE = 0.1;

export const MAX_FILE_SIZE_MB = 50;
export const ALLOWED_FILE_TYPES = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx',
  'png', 'jpg', 'jpeg', 'gif', 'svg',
  'txt', 'md',
] as const;

export const AI_MODEL_DEFAULT = 'gpt-4o';
export const AI_CONFIDENCE_THRESHOLD = 0.7;

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;
