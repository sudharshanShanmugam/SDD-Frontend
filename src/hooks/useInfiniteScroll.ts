import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  hasNextPage:       boolean;
  isFetchingNextPage: boolean;
  fetchNextPage:     () => void;
  threshold?:        number;
  rootMargin?:       string;
}

/**
 * Infinite scroll using IntersectionObserver.
 * Attach the returned `sentinelRef` to a sentinel element at the bottom of your list.
 */
export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  threshold  = 0,
  rootMargin = '100px',
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(observerCallback, {
      threshold,
      rootMargin,
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [observerCallback, threshold, rootMargin]);

  return { sentinelRef };
}

/**
 * Scroll position tracker.
 */
export function useScrollPosition(containerRef?: React.RefObject<HTMLElement>) {
  const positionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef?.current ?? window;

    const handler = () => {
      if (container instanceof Window) {
        positionRef.current = { x: container.scrollX, y: container.scrollY };
      } else {
        positionRef.current = { x: container.scrollLeft, y: container.scrollTop };
      }
    };

    container.addEventListener('scroll', handler, { passive: true });
    return () => container.removeEventListener('scroll', handler);
  }, [containerRef]);

  return positionRef;
}
