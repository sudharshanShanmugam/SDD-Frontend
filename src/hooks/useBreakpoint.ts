import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Returns the current MUI breakpoint.
 */
export function useBreakpoint() {
  const theme = useTheme();

  const isXs  = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm  = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd  = useMediaQuery(theme.breakpoints.only('md'));
  const isLg  = useMediaQuery(theme.breakpoints.only('lg'));
  const isXl  = useMediaQuery(theme.breakpoints.up('xl'));

  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));

  const isMobile  = !isMdUp;
  const isTablet  = isMdUp && !isLgUp;
  const isDesktop = isLgUp;

  const current: Breakpoint = isXl ? 'xl'
    : isLg ? 'lg'
    : isMd ? 'md'
    : isSm ? 'sm'
    : 'xs';

  return {
    current,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    isSmUp,
    isMdUp,
    isLgUp,
    isMobile,
    isTablet,
    isDesktop,
  };
}

/**
 * Returns window dimensions, updates on resize.
 */
export function useWindowSize() {
  const getSize = useCallback(() => ({
    width:  typeof window !== 'undefined' ? window.innerWidth  : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }), []);

  const [size, setSize] = useState(getSize);

  useEffect(() => {
    let raf: number;
    const handler = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setSize(getSize()));
    };
    window.addEventListener('resize', handler, { passive: true });
    return () => {
      window.removeEventListener('resize', handler);
      cancelAnimationFrame(raf);
    };
  }, [getSize]);

  return size;
}
