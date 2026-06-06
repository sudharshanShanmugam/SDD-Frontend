import type { TypographyOptions } from '@mui/material/styles/createTypography';

export const typography: TypographyOptions = {
  fontFamily: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
  ].join(','),

  fontWeightLight:   300,
  fontWeightRegular: 400,
  fontWeightMedium:  500,
  fontWeightBold:    700,

  // Display variants
  h1: {
    fontSize: '2.25rem',     // 36px
    fontWeight: 800,
    lineHeight: 1.2,
    letterSpacing: '-0.03em',
  },
  h2: {
    fontSize: '1.875rem',    // 30px
    fontWeight: 700,
    lineHeight: 1.25,
    letterSpacing: '-0.025em',
  },
  h3: {
    fontSize: '1.5rem',      // 24px
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: '-0.02em',
  },
  h4: {
    fontSize: '1.25rem',     // 20px
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '-0.015em',
  },
  h5: {
    fontSize: '1.125rem',    // 18px
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '-0.01em',
  },
  h6: {
    fontSize: '1rem',        // 16px
    fontWeight: 600,
    lineHeight: 1.5,
    letterSpacing: '-0.005em',
  },

  // Subtitle variants
  subtitle1: {
    fontSize: '1rem',        // 16px
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0',
  },
  subtitle2: {
    fontSize: '0.875rem',    // 14px
    fontWeight: 500,
    lineHeight: 1.57,
    letterSpacing: '0',
  },

  // Body variants
  body1: {
    fontSize: '1rem',        // 16px
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0',
  },
  body2: {
    fontSize: '0.875rem',    // 14px
    fontWeight: 400,
    lineHeight: 1.57,
    letterSpacing: '0',
  },

  // Button
  button: {
    fontSize: '0.875rem',
    fontWeight: 600,
    lineHeight: 1.75,
    letterSpacing: '0.01em',
    textTransform: 'none',
  },

  // Caption
  caption: {
    fontSize: '0.75rem',     // 12px
    fontWeight: 400,
    lineHeight: 1.66,
    letterSpacing: '0.01em',
  },

  // Overline
  overline: {
    fontSize: '0.6875rem',   // 11px
    fontWeight: 600,
    lineHeight: 2.5,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
};
