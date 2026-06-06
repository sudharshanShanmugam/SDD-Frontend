import { createTheme, type Theme, type ThemeOptions } from '@mui/material/styles';
import { colorTokens, semanticColors } from './palette';
import { typography } from './typography';
import { createComponents } from './components';

// ============================================================
// Custom Theme Augmentations
// ============================================================

declare module '@mui/material/styles' {
  interface Palette {
    neutral: {
      50: string; 100: string; 200: string; 300: string; 400: string;
      500: string; 600: string; 700: string; 800: string; 900: string;
    };
    ai: {
      purple: string; blue: string; cyan: string; teal: string;
    };
  }

  interface PaletteOptions {
    neutral?: {
      50?: string; 100?: string; 200?: string; 300?: string; 400?: string;
      500?: string; 600?: string; 700?: string; 800?: string; 900?: string;
    };
    ai?: {
      purple?: string; blue?: string; cyan?: string; teal?: string;
    };
  }

  interface TypeBackground {
    subtle: string;
    emphasis: string;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    gradient: true;
    soft: true;
  }
}

declare module '@mui/material/Card' {
  interface CardPropsVariantOverrides {
    elevated: true;
  }
}

// ============================================================
// Shadow Scale
// ============================================================

const shadows: Theme['shadows'] = [
  'none',
  '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  '0 25px 50px -12px rgb(0 0 0 / 0.25)',
];

// ============================================================
// Base Theme Options
// ============================================================

function buildThemeOptions(mode: 'light' | 'dark'): ThemeOptions {
  const colors = semanticColors[mode];

  return {
    palette: {
      mode,
      primary: {
        main:         colorTokens.primary[600],
        light:        colorTokens.primary[400],
        dark:         colorTokens.primary[800],
        contrastText: '#FFFFFF',
      },
      secondary: {
        main:         colorTokens.secondary[600],
        light:        colorTokens.secondary[400],
        dark:         colorTokens.secondary[800],
        contrastText: '#FFFFFF',
      },
      success: {
        main:         colorTokens.success[600],
        light:        colorTokens.success[400],
        dark:         colorTokens.success[800],
        contrastText: '#FFFFFF',
      },
      error: {
        main:         colorTokens.error[600],
        light:        colorTokens.error[400],
        dark:         colorTokens.error[800],
        contrastText: '#FFFFFF',
      },
      warning: {
        main:         colorTokens.warning[500],
        light:        colorTokens.warning[300],
        dark:         colorTokens.warning[700],
        contrastText: '#FFFFFF',
      },
      info: {
        main:         colorTokens.info[600],
        light:        colorTokens.info[400],
        dark:         colorTokens.info[800],
        contrastText: '#FFFFFF',
      },
      neutral: { ...colorTokens.neutral },
      ai: {
        purple: '#7C3AED',
        blue:   '#2563EB',
        cyan:   '#0891B2',
        teal:   '#0D9488',
      },
      background: {
        default:   colors.background.default,
        paper:     colors.background.paper,
        subtle:    colors.background.subtle,
        emphasis:  colors.background.emphasis,
      } as Theme['palette']['background'] & { subtle: string; emphasis: string },
      text: {
        primary:   colors.text.primary,
        secondary: colors.text.secondary,
        disabled:  colors.text.disabled,
      },
      divider: colors.border.default,
      action: {
        hover:       colors.action.hover,
        selected:    colors.action.selected,
        disabled:    colors.action.disabled,
        disabledBackground: colors.action.disabled,
      },
    },
    typography,
    shadows,
    shape: {
      borderRadius: 8,
    },
    spacing: 4,   // base unit: 4px
    breakpoints: {
      values: {
        xs:  0,
        sm:  640,
        md:  768,
        lg:  1024,
        xl:  1280,
      },
    },
    transitions: {
      duration: {
        shortest:        150,
        shorter:         200,
        short:           250,
        standard:        300,
        complex:         375,
        enteringScreen:  225,
        leavingScreen:   195,
      },
      easing: {
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeOut:   'cubic-bezier(0.0, 0, 0.2, 1)',
        easeIn:    'cubic-bezier(0.4, 0, 1, 1)',
        sharp:     'cubic-bezier(0.4, 0, 0.6, 1)',
      },
    },
    zIndex: {
      mobileStepper:  1000,
      fab:            1050,
      speedDial:      1050,
      appBar:         1100,
      drawer:         1200,
      modal:          1300,
      snackbar:       1400,
      tooltip:        1500,
    },
  };
}

// ============================================================
// Theme Factory
// ============================================================

function createAppTheme(mode: 'light' | 'dark'): Theme {
  const baseOptions = buildThemeOptions(mode);
  const baseTheme = createTheme(baseOptions);

  return createTheme(baseTheme, {
    components: createComponents(baseTheme),
  });
}

export const lightTheme = createAppTheme('light');
export const darkTheme  = createAppTheme('dark');

export default lightTheme;
