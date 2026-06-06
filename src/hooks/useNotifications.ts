import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '@/store';
import { apiClient } from '@/api';
import type { Notification, UUID } from '@/types';

const NOTIFICATIONS_KEY = ['notifications'];

export function useNotifications() {
  const queryClient = useQueryClient();

  const {
    notifications,
    unreadCount,
    isLoading: storeLoading,
    hasMore,
    page,
    addNotifications,
    markAsRead: markAsReadStore,
    markAllAsRead: markAllAsReadStore,
    removeNotification,
    setLoading,
    setHasMore,
    incrementPage,
    resetPagination,
  } = useNotificationStore();

  // ── Fetch ─────────────────────────────────────────────────

  const { isFetching: isFetchingInitial } = useQuery({
    queryKey: [...NOTIFICATIONS_KEY, 'initial'],
    queryFn: async () => {
      setLoading(true);
      try {
        const response = await apiClient.get<{
          data: Notification[];
          meta: { total: number; hasMore: boolean };
        }>('/notifications', { params: { page: 1, pageSize: 20 } });

        addNotifications(response.data.data, true);
        setHasMore(response.data.meta.hasMore);
        resetPagination();
        return response.data;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,  // Refresh every minute
  });

  // ── Load More ─────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (!hasMore || storeLoading) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const response = await apiClient.get<{
        data: Notification[];
        meta: { hasMore: boolean };
      }>('/notifications', { params: { page: nextPage, pageSize: 20 } });

      addNotifications(response.data.data);
      setHasMore(response.data.meta.hasMore);
      incrementPage();
    } finally {
      setLoading(false);
    }
  }, [hasMore, storeLoading, page, addNotifications, setHasMore, incrementPage, setLoading]);

  // ── Mark as Read ──────────────────────────────────────────

  const markAsReadMutation = useMutation({
    mutationFn: (id: UUID) =>
      apiClient.patch(`/notifications/${id}/read`),
    onMutate: (id) => {
      markAsReadStore(id);
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiClient.patch('/notifications/read-all'),
    onMutate: () => {
      markAllAsReadStore();
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: UUID) =>
      apiClient.delete(`/notifications/${id}`),
    onMutate: (id) => {
      removeNotification(id);
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading: storeLoading || isFetchingInitial,
    hasMore,
    loadMore,
    markAsRead:    (id: UUID) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    deleteNotification: (id: UUID) => deleteMutation.mutate(id),
  };
}
