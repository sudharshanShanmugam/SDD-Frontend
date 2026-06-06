import type { Components, Theme } from '@mui/material/styles';
import { colorTokens } from './palette';

export function createComponents(_theme: Theme): Components<Theme> {
  return {
    // ============================================================
    // MuiCssBaseline
    // ============================================================
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFeatureSettings: '"cv11", "ss01"',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '*::-webkit-scrollbar': { width: 6, height: 6 },
        '*::-webkit-scrollbar-track': { background: 'transparent' },
        '*::-webkit-scrollbar-thumb': {
          background: colorTokens.neutral[300],
          borderRadius: 3,
        },
        '*::-webkit-scrollbar-thumb:hover': { background: colorTokens.neutral[400] },
      },
    },

    // ============================================================
    // MuiButton
    // ============================================================
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        disableRipple: false,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.875rem',
          letterSpacing: '0.01em',
          textTransform: 'none',
          transition: 'all 150ms ease',
          '&:focus-visible': {
            outline: `2px solid ${colorTokens.primary[500]}`,
            outlineOffset: 2,
          },
        },
        sizeSmall: {
          padding: '6px 12px',
          fontSize: '0.8125rem',
          lineHeight: 1.5,
          borderRadius: 6,
        },
        sizeMedium: {
          padding: '8px 16px',
          lineHeight: 1.75,
        },
        sizeLarge: {
          padding: '10px 24px',
          fontSize: '0.9375rem',
          lineHeight: 1.75,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${colorTokens.primary[600]} 0%, ${colorTokens.primary[500]} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${colorTokens.primary[700]} 0%, ${colorTokens.primary[600]} 100%)`,
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
        outlinedPrimary: {
          borderColor: colorTokens.primary[300],
          '&:hover': {
            backgroundColor: colorTokens.primary[50],
            borderColor: colorTokens.primary[500],
          },
        },
        text: {
          '&:hover': {
            backgroundColor: 'rgba(99, 102, 241, 0.06)',
          },
        },
      },
      variants: [
        {
          props: { variant: 'gradient' },
          style: {
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            color: '#FFFFFF',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4338CA 0%, #6D28D9 100%)',
              boxShadow: '0 6px 20px rgba(99, 102, 241, 0.5)',
              transform: 'translateY(-1px)',
            },
          },
        },
        {
          props: { variant: 'soft' },
          style: {
            backgroundColor: colorTokens.primary[50],
            color: colorTokens.primary[700],
            '&:hover': {
              backgroundColor: colorTokens.primary[100],
            },
          },
        },
      ],
    },

    // ============================================================
    // MuiIconButton
    // ============================================================
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 150ms ease',
          '&:hover': {
            backgroundColor: 'rgba(99, 102, 241, 0.06)',
          },
          '&:focus-visible': {
            outline: `2px solid ${colorTokens.primary[500]}`,
            outlineOffset: 2,
          },
        },
        sizeSmall: { borderRadius: 6 },
      },
    },

    // ============================================================
    // MuiCard
    // ============================================================
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${colorTokens.neutral[200]}`,
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          overflow: 'visible',
          transition: 'box-shadow 200ms ease',
        },
      },
      variants: [
        {
          props: { variant: 'outlined' },
          style: {
            boxShadow: 'none',
            border: `1px solid ${colorTokens.neutral[200]}`,
          },
        },
        {
          props: { variant: 'elevated' },
          style: {
            boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          },
        },
      ],
    },

    // ============================================================
    // MuiCardContent
    // ============================================================
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
          '&:last-child': { paddingBottom: 24 },
        },
      },
    },

    // ============================================================
    // MuiCardHeader
    // ============================================================
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
        title: {
          fontSize: '1rem',
          fontWeight: 600,
        },
        subheader: {
          fontSize: '0.875rem',
          color: colorTokens.neutral[500],
        },
      },
    },

    // ============================================================
    // MuiPaper
    // ============================================================
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 12,
        },
      },
    },

    // ============================================================
    // MuiTextField / MuiOutlinedInput
    // ============================================================
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: '0.875rem',
          transition: 'all 150ms ease',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: colorTokens.primary[400],
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
            borderColor: colorTokens.primary[500],
          },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': {
            borderColor: colorTokens.error[500],
          },
        },
        notchedOutline: {
          borderColor: colorTokens.neutral[300],
        },
        input: {
          padding: '8.5px 14px',
          '&::placeholder': {
            color: colorTokens.neutral[400],
            opacity: 1,
          },
        },
        inputSizeSmall: {
          padding: '7px 12px',
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          color: colorTokens.neutral[600],
          '&.Mui-focused': {
            color: colorTokens.primary[600],
          },
        },
      },
    },

    // ============================================================
    // MuiSelect
    // ============================================================
    MuiSelect: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        icon: {
          color: colorTokens.neutral[400],
        },
      },
    },

    // ============================================================
    // MuiChip
    // ============================================================
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem',
          fontWeight: 500,
          height: 24,
          borderRadius: 6,
          '& .MuiChip-label': {
            padding: '0 8px',
          },
        },
        sizeSmall: {
          height: 20,
          fontSize: '0.6875rem',
          '& .MuiChip-label': {
            padding: '0 6px',
          },
        },
        filled: {
          backgroundColor: colorTokens.neutral[100],
          color: colorTokens.neutral[700],
          '&:hover': {
            backgroundColor: colorTokens.neutral[200],
          },
        },
        filledPrimary: {
          backgroundColor: colorTokens.primary[100],
          color: colorTokens.primary[700],
        },
        filledSuccess: {
          backgroundColor: colorTokens.success[100],
          color: colorTokens.success[700],
        },
        filledError: {
          backgroundColor: colorTokens.error[100],
          color: colorTokens.error[700],
        },
        filledWarning: {
          backgroundColor: colorTokens.warning[100],
          color: colorTokens.warning[700],
        },
        outlined: {
          borderColor: colorTokens.neutral[300],
          color: colorTokens.neutral[700],
        },
        outlinedPrimary: {
          borderColor: colorTokens.primary[300],
          color: colorTokens.primary[700],
          backgroundColor: colorTokens.primary[50],
        },
      },
    },

    // ============================================================
    // MuiTable
    // ============================================================
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: 'separate',
          borderSpacing: 0,
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: colorTokens.neutral[50],
          '& .MuiTableCell-root': {
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: colorTokens.neutral[500],
            borderBottom: `2px solid ${colorTokens.neutral[200]}`,
            padding: '10px 16px',
            whiteSpace: 'nowrap',
          },
        },
      },
    },

    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root': {
            transition: 'background-color 100ms ease',
            '&:hover': {
              backgroundColor: colorTokens.neutral[50],
            },
            '&:last-child .MuiTableCell-root': {
              borderBottom: 'none',
            },
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          padding: '12px 16px',
          borderBottom: `1px solid ${colorTokens.neutral[100]}`,
          color: colorTokens.neutral[800],
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: colorTokens.primary[50],
            '&:hover': {
              backgroundColor: colorTokens.primary[100],
            },
          },
        },
      },
    },

    // ============================================================
    // MuiDialog
    // ============================================================
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
          overflow: 'visible',
        },
        paperWidthSm: { maxWidth: 480 },
        paperWidthMd: { maxWidth: 720 },
        paperWidthLg: { maxWidth: 1080 },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.125rem',
          fontWeight: 700,
          padding: '20px 24px 16px',
          lineHeight: 1.4,
        },
      },
    },

    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '0 24px 20px',
        },
        dividers: {
          borderTop: `1px solid ${colorTokens.neutral[200]}`,
          borderBottom: `1px solid ${colorTokens.neutral[200]}`,
        },
      },
    },

    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px 20px',
          gap: 8,
        },
      },
    },

    // ============================================================
    // MuiMenu
    // ============================================================
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 10,
          border: `1px solid ${colorTokens.neutral[200]}`,
          boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.08)',
          minWidth: 180,
          overflow: 'hidden',
        },
        list: {
          padding: '4px',
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          fontWeight: 500,
          borderRadius: 6,
          padding: '7px 12px',
          gap: 10,
          transition: 'background-color 100ms ease',
          '&:hover': {
            backgroundColor: colorTokens.neutral[100],
          },
          '&.Mui-selected': {
            backgroundColor: colorTokens.primary[50],
            color: colorTokens.primary[700],
            '&:hover': {
              backgroundColor: colorTokens.primary[100],
            },
          },
        },
      },
    },

    // ============================================================
    // MuiTooltip
    // ============================================================
    MuiTooltip: {
      defaultProps: {
        arrow: true,
        placement: 'top',
      },
      styleOverrides: {
        tooltip: {
          backgroundColor: colorTokens.neutral[900],
          color: colorTokens.neutral[100],
          fontSize: '0.75rem',
          fontWeight: 500,
          borderRadius: 6,
          padding: '6px 10px',
          maxWidth: 300,
        },
        arrow: {
          color: colorTokens.neutral[900],
        },
      },
    },

    // ============================================================
    // MuiAlert
    // ============================================================
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontSize: '0.875rem',
          fontWeight: 500,
          alignItems: 'flex-start',
        },
        standardSuccess: {
          backgroundColor: colorTokens.success[50],
          color: colorTokens.success[800],
          '& .MuiAlert-icon': { color: colorTokens.success[600] },
        },
        standardError: {
          backgroundColor: colorTokens.error[50],
          color: colorTokens.error[800],
          '& .MuiAlert-icon': { color: colorTokens.error[600] },
        },
        standardWarning: {
          backgroundColor: colorTokens.warning[50],
          color: colorTokens.warning[800],
          '& .MuiAlert-icon': { color: colorTokens.warning[600] },
        },
        standardInfo: {
          backgroundColor: colorTokens.info[50],
          color: colorTokens.info[800],
          '& .MuiAlert-icon': { color: colorTokens.info[600] },
        },
      },
    },

    // ============================================================
    // MuiLinearProgress
    // ============================================================
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 6,
          backgroundColor: colorTokens.neutral[100],
        },
        bar: {
          borderRadius: 4,
        },
      },
    },

    // ============================================================
    // MuiCircularProgress
    // ============================================================
    MuiCircularProgress: {
      defaultProps: {
        size: 24,
        thickness: 4,
      },
    },

    // ============================================================
    // MuiAvatar
    // ============================================================
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          fontWeight: 600,
        },
        colorDefault: {
          backgroundColor: colorTokens.primary[100],
          color: colorTokens.primary[700],
        },
      },
    },

    // ============================================================
    // MuiAvatarGroup
    // ============================================================
    MuiAvatarGroup: {
      styleOverrides: {
        root: {
          '& .MuiAvatar-root': {
            border: `2px solid ${colorTokens.white}`,
            width: 28,
            height: 28,
            fontSize: '0.75rem',
          },
        },
      },
    },

    // ============================================================
    // MuiBadge
    // ============================================================
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontSize: '0.65rem',
          fontWeight: 700,
          minWidth: 18,
          height: 18,
          padding: '0 4px',
        },
      },
    },

    // ============================================================
    // MuiTabs
    // ============================================================
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${colorTokens.neutral[200]}`,
          minHeight: 44,
        },
        indicator: {
          height: 2,
          borderRadius: '2px 2px 0 0',
          backgroundColor: colorTokens.primary[600],
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          fontWeight: 500,
          textTransform: 'none',
          minHeight: 44,
          padding: '10px 16px',
          color: colorTokens.neutral[600],
          letterSpacing: '0',
          '&.Mui-selected': {
            color: colorTokens.primary[700],
            fontWeight: 600,
          },
          '&:hover': {
            color: colorTokens.primary[600],
            opacity: 1,
          },
        },
      },
    },

    // ============================================================
    // MuiSkeleton
    // ============================================================
    MuiSkeleton: {
      defaultProps: {
        animation: 'wave',
      },
      styleOverrides: {
        root: {
          backgroundColor: colorTokens.neutral[100],
        },
        wave: {
          '&::after': {
            background: `linear-gradient(90deg, transparent, ${colorTokens.neutral[200]}, transparent)`,
          },
        },
      },
    },

    // ============================================================
    // MuiDivider
    // ============================================================
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: colorTokens.neutral[200],
        },
      },
    },

    // ============================================================
    // MuiListItemButton
    // ============================================================
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '1px 4px',
          padding: '8px 12px',
          transition: 'background-color 150ms ease',
          '&:hover': {
            backgroundColor: 'rgba(99, 102, 241, 0.06)',
          },
          '&.Mui-selected': {
            backgroundColor: colorTokens.primary[50],
            color: colorTokens.primary[700],
            '&:hover': {
              backgroundColor: colorTokens.primary[100],
            },
            '& .MuiListItemIcon-root': {
              color: colorTokens.primary[600],
            },
            '& .MuiListItemText-primary': {
              fontWeight: 600,
              color: colorTokens.primary[700],
            },
          },
        },
      },
    },

    // ============================================================
    // MuiSnackbar
    // ============================================================
    MuiSnackbar: {
      defaultProps: {
        anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
        autoHideDuration: 4000,
      },
    },

    // ============================================================
    // MuiBreadcrumbs
    // ============================================================
    MuiBreadcrumbs: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
        },
        separator: {
          color: colorTokens.neutral[400],
        },
        ol: {
          flexWrap: 'nowrap',
        },
      },
    },

    // ============================================================
    // MuiSwitch
    // ============================================================
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 42,
          height: 24,
          padding: 0,
          '& .MuiSwitch-switchBase': {
            padding: 0,
            margin: 3,
            transitionDuration: '200ms',
            '&.Mui-checked': {
              transform: 'translateX(18px)',
              color: '#fff',
              '& + .MuiSwitch-track': {
                backgroundColor: colorTokens.primary[600],
                opacity: 1,
                border: 0,
              },
            },
          },
          '& .MuiSwitch-thumb': {
            boxSizing: 'border-box',
            width: 18,
            height: 18,
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          },
          '& .MuiSwitch-track': {
            borderRadius: 12,
            backgroundColor: colorTokens.neutral[300],
            opacity: 1,
          },
        },
      },
    },

    // ============================================================
    // MuiCheckbox
    // ============================================================
    MuiCheckbox: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          padding: 6,
          '&:hover': {
            backgroundColor: 'rgba(99, 102, 241, 0.06)',
          },
        },
      },
    },

    // ============================================================
    // MuiAccordion
    // ============================================================
    MuiAccordion: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: `1px solid ${colorTokens.neutral[200]}`,
          borderRadius: '8px !important',
          marginBottom: 8,
          '&:before': { display: 'none' },
          '&.Mui-expanded': { margin: '0 0 8px' },
        },
      },
    },

    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          padding: '0 16px',
          minHeight: 52,
          '&.Mui-expanded': {
            minHeight: 52,
            borderBottom: `1px solid ${colorTokens.neutral[200]}`,
          },
        },
        content: {
          '&.Mui-expanded': { margin: '12px 0' },
        },
      },
    },

    MuiAccordionDetails: {
      styleOverrides: {
        root: { padding: 16 },
      },
    },
  };
}
