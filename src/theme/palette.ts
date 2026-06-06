// ============================================================
// Design Tokens - Color Palette
// ============================================================

export const colorTokens = {
  // Primary - Indigo (brand color)
  primary: {
    50:  '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
    950: '#1E1B4B',
  },

  // Secondary - Violet
  secondary: {
    50:  '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },

  // Success - Emerald
  success: {
    50:  '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  // Warning - Amber
  warning: {
    50:  '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Error - Rose
  error: {
    50:  '#FFF1F2',
    100: '#FFE4E6',
    200: '#FECDD3',
    300: '#FDA4AF',
    400: '#FB7185',
    500: '#F43F5E',
    600: '#E11D48',
    700: '#BE123C',
    800: '#9F1239',
    900: '#881337',
  },

  // Info - Sky
  info: {
    50:  '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9',
    600: '#0284C7',
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
  },

  // Neutral - Slate
  neutral: {
    50:  '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },

  // White & Black
  white: '#FFFFFF',
  black: '#000000',
} as const;

// ============================================================
// Semantic Colors
// ============================================================

export const semanticColors = {
  light: {
    background: {
      default:   colorTokens.neutral[50],
      paper:     colorTokens.white,
      subtle:    colorTokens.neutral[100],
      emphasis:  colorTokens.primary[50],
      overlay:   'rgba(15, 23, 42, 0.5)',
    },
    text: {
      primary:   colorTokens.neutral[900],
      secondary: colorTokens.neutral[600],
      tertiary:  colorTokens.neutral[400],
      disabled:  colorTokens.neutral[300],
      inverse:   colorTokens.white,
      link:      colorTokens.primary[600],
      onPrimary: colorTokens.white,
    },
    border: {
      default:   colorTokens.neutral[200],
      subtle:    colorTokens.neutral[100],
      emphasis:  colorTokens.neutral[300],
      focus:     colorTokens.primary[500],
    },
    action: {
      hover:    'rgba(99, 102, 241, 0.04)',
      selected: 'rgba(99, 102, 241, 0.08)',
      disabled: 'rgba(0, 0, 0, 0.12)',
    },
  },
  dark: {
    background: {
      default:   colorTokens.neutral[900],
      paper:     colorTokens.neutral[800],
      subtle:    colorTokens.neutral[700],
      emphasis:  'rgba(99, 102, 241, 0.1)',
      overlay:   'rgba(0, 0, 0, 0.7)',
    },
    text: {
      primary:   colorTokens.neutral[50],
      secondary: colorTokens.neutral[400],
      tertiary:  colorTokens.neutral[500],
      disabled:  colorTokens.neutral[600],
      inverse:   colorTokens.neutral[900],
      link:      colorTokens.primary[400],
      onPrimary: colorTokens.white,
    },
    border: {
      default:   colorTokens.neutral[700],
      subtle:    colorTokens.neutral[800],
      emphasis:  colorTokens.neutral[600],
      focus:     colorTokens.primary[400],
    },
    action: {
      hover:    'rgba(99, 102, 241, 0.08)',
      selected: 'rgba(99, 102, 241, 0.16)',
      disabled: 'rgba(255, 255, 255, 0.12)',
    },
  },
} as const;

// ============================================================
// Status Color Map
// ============================================================

export const statusColors = {
  // Document / Requirement / Epic statuses
  draft:       { bg: colorTokens.neutral[100],   text: colorTokens.neutral[700],   border: colorTokens.neutral[300] },
  pending:     { bg: colorTokens.warning[50],    text: colorTokens.warning[700],   border: colorTokens.warning[200] },
  in_review:   { bg: colorTokens.info[50],       text: colorTokens.info[700],      border: colorTokens.info[200] },
  approved:    { bg: colorTokens.success[50],    text: colorTokens.success[700],   border: colorTokens.success[200] },
  rejected:    { bg: colorTokens.error[50],      text: colorTokens.error[700],     border: colorTokens.error[200] },
  active:      { bg: colorTokens.primary[50],    text: colorTokens.primary[700],   border: colorTokens.primary[200] },
  completed:   { bg: colorTokens.success[50],    text: colorTokens.success[700],   border: colorTokens.success[200] },
  archived:    { bg: colorTokens.neutral[100],   text: colorTokens.neutral[500],   border: colorTokens.neutral[200] },
  cancelled:   { bg: colorTokens.neutral[100],   text: colorTokens.neutral[500],   border: colorTokens.neutral[200] },
  in_progress: { bg: colorTokens.primary[50],    text: colorTokens.primary[700],   border: colorTokens.primary[200] },
  done:        { bg: colorTokens.success[50],    text: colorTokens.success[700],   border: colorTokens.success[200] },
  published:   { bg: colorTokens.success[50],    text: colorTokens.success[700],   border: colorTokens.success[200] },
  backlog:     { bg: colorTokens.neutral[100],   text: colorTokens.neutral[600],   border: colorTokens.neutral[200] },
  blocked:     { bg: colorTokens.error[50],      text: colorTokens.error[700],     border: colorTokens.error[200] },
} as const;

export type StatusColorKey = keyof typeof statusColors;

// ============================================================
// Priority Color Map
// ============================================================

export const priorityColors = {
  critical: { bg: colorTokens.error[50],    text: colorTokens.error[700],   dot: colorTokens.error[500] },
  high:     { bg: colorTokens.warning[50],  text: colorTokens.warning[700], dot: colorTokens.warning[500] },
  medium:   { bg: colorTokens.info[50],     text: colorTokens.info[700],    dot: colorTokens.info[500] },
  low:      { bg: colorTokens.neutral[100], text: colorTokens.neutral[600], dot: colorTokens.neutral[400] },
} as const;
