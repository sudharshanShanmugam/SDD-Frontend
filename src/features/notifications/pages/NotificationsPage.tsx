import React, { useCallback, useRef, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  List,
  Stack,
  Tab,
  Tabs,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  DoneAllOutlined,
  DeleteSweepOutlined,
  TuneOutlined,
  NotificationsNoneOutlined,
} from '@mui/icons-material';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { get, post, del } from '@api/client';
import { useNotificationStore } from '@store/notificationStore';
import { useUIStore } from '@store/uiStore';
import { NotificationItem } from '../components/NotificationItem';
import { NotificationPreferences } from '../components/NotificationPreferences';
import type { Notification, PaginatedResponse, NotificationType, UUID } from '@/types';

// ── Tab definition ────────────────────────────────────────────────────────────

type TabKey = 'all' | 'unread' | 'mentions' | 'system';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'mentions', label: 'Mentions' },
  { key: 'system', label: 'System' },
];

function filterNotifications(notifications: Notification[], tab: TabKey): Notification[] {
  switch (tab) {
    case 'unread':
      return notifications.filter((n) => !n.read);
    case 'mentions':
      return notifications.filter((n) => n.type === 'mention');
    case 'system':
      return notifications.filter((n) =>
        (['info', 'warning', 'error', 'success'] as NotificationType[]).includes(n.type)
      );
    default:
      return notifications;
  }
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: TabKey }) {
  const messages: Record<TabKey, string> = {
    all: "You're all caught up! No notifications yet.",
    unread: 'No unread notifications.',
    mentions: 'No mentions found.',
    system: 'No system alerts.',
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        gap: 2,
        color: 'text.disabled',
      }}
    >
      <NotificationsNoneOutlined sx={{ fontSize: 64 }} />
      <Typography variant="body1" color="text.secondary" textAlign="center">
        {messages[tab]}
      </Typography>
    </Box>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [prefsOpen, setPrefsOpen] = useState(false);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();
  const toast = useUIStore((s) => s.toast);
  const { markAsRead, markAllAsRead, clearAll, addNotifications } = useNotificationStore();
  const storeNotifications = useNotificationStore((s) => s.notifications);

  // ── Infinite query ────────────────────────────────────────────────────────

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['notifications', activeTab],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      const unreadOnly = activeTab === 'unread';
      const res = await get<PaginatedResponse<Notification>>(
        `/notifications?page=${page}&page_size=20&unread_only=${unreadOnly}`
      );
      addNotifications(res.data);
      return res;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNext ? lastPage.meta.page + 1 : undefined,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const markReadMutation = useMutation({
    mutationFn: (id: UUID) => post(`/notifications/${id}/read`, {}),
    onMutate: (id) => markAsRead(id),
    onError: () => toast.error('Failed to mark as read'),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => post('/notifications/read-all', {}),
    onMutate: () => markAllAsRead(),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => toast.error('Failed to mark all as read'),
  });

  const clearAllMutation = useMutation({
    mutationFn: () => del('/notifications'),
    onMutate: () => clearAll(),
    onSuccess: () => {
      toast.success('All notifications cleared');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => toast.error('Failed to clear notifications'),
  });

  // ── Intersection observer for infinite scroll ─────────────────────────────

  const observerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        },
        { threshold: 0.5 }
      );
      observer.observe(node);
      loaderRef.current = node;
      return () => observer.disconnect();
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  // ── Flatten pages + filter ────────────────────────────────────────────────

  const allFetched = (data?.pages ?? []).flatMap((p) => p.data);
  // Merge store (includes WS pushed) with fetched, deduplicated
  const mergedIds = new Set(allFetched.map((n) => n.id));
  const merged = [
    ...storeNotifications.filter((n) => !mergedIds.has(n.id)),
    ...allFetched,
  ];
  const visible = filterNotifications(merged, activeTab);

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          Notifications
        </Typography>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Mark all read">
            <span>
              <IconButton
                size="small"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
              >
                <DoneAllOutlined fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Clear all">
            <span>
              <IconButton
                size="small"
                onClick={() => clearAllMutation.mutate()}
                disabled={clearAllMutation.isPending}
              >
                <DeleteSweepOutlined fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Preferences">
            <IconButton size="small" onClick={() => setPrefsOpen(true)}>
              <TuneOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v: TabKey) => setActiveTab(v)}
        sx={{ mb: 1 }}
        variant="scrollable"
        scrollButtons="auto"
      >
        {TABS.map((t) => (
          <Tab key={t.key} value={t.key} label={t.label} />
        ))}
      </Tabs>

      <Divider />

      {/* Bulk actions bar */}
      {visible.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            py: 1,
            justifyContent: 'flex-end',
          }}
        >
          <Button
            size="small"
            startIcon={<DoneAllOutlined />}
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            Mark All Read
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteSweepOutlined />}
            onClick={() => clearAllMutation.mutate()}
            disabled={clearAllMutation.isPending}
          >
            Clear All
          </Button>
        </Box>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {/* List */}
      {!isLoading && (
        <>
          {visible.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : (
            <List disablePadding>
              <AnimatePresence initial={false}>
                {visible.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 32, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.2 }}
                  >
                    <NotificationItem
                      notification={notification}
                      onRead={(id) => markReadMutation.mutate(id)}
                    />
                    <Divider component="li" variant="inset" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </List>
          )}

          {/* Infinite scroll sentinel */}
          <Box ref={observerRef} sx={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isFetchingNextPage && <CircularProgress size={24} />}
          </Box>
        </>
      )}

      {/* Preferences drawer */}
      <NotificationPreferences open={prefsOpen} onClose={() => setPrefsOpen(false)} />
    </Box>
  );
}
