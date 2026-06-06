import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Paper,
  Button,
  LinearProgress,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Skeleton,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Refresh,
  AutoAwesome,
  CheckCircle,
  Error as ErrorIcon,
  AccessTime,
  Token,
  FiberManualRecord,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@hooks/useWebSocket';
import { useUIStore } from '@store/uiStore';
import WorkflowDiagram from '../components/WorkflowDiagram';
import type { WorkflowStage } from '../components/WorkflowDiagram';

// ─── Types ────────────────────────────────────────────────────────────────

type WorkflowRunStatus = 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'PENDING';

interface WorkflowEvent {
  id: string;
  timestamp: string;
  stage: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
}

interface WorkflowStatusData {
  runId: string;
  projectId: string;
  status: WorkflowRunStatus;
  currentStage: string;
  currentStageLabel: string;
  confidenceScore: number;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    inputBudget: number;
    outputBudget: number;
  };
  processingTimeMs: number;
  stages: WorkflowStage[];
  events: WorkflowEvent[];
  startedAt: string;
  completedAt: string | null;
}

// ─── Status config ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  WorkflowRunStatus,
  { label: string; color: 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info' }
> = {
  RUNNING:   { label: 'RUNNING',   color: 'primary' },
  PAUSED:    { label: 'PAUSED',    color: 'warning' },
  COMPLETED: { label: 'COMPLETED', color: 'success' },
  FAILED:    { label: 'FAILED',    color: 'error' },
  PENDING:   { label: 'PENDING',   color: 'default' },
};

const EVENT_LEVEL_CONFIG: Record<
  WorkflowEvent['level'],
  { color: string; icon: React.ReactNode }
> = {
  info:    { color: '#3b82f6', icon: <FiberManualRecord sx={{ fontSize: 8 }} /> },
  success: { color: '#10b981', icon: <CheckCircle sx={{ fontSize: 12 }} /> },
  warning: { color: '#f59e0b', icon: <FiberManualRecord sx={{ fontSize: 8 }} /> },
  error:   { color: '#ef4444', icon: <ErrorIcon sx={{ fontSize: 12 }} /> },
};

// ─── Circular confidence gauge ────────────────────────────────────────────

const ConfidenceGauge: React.FC<{ value: number }> = ({ value }) => {
  const color = value >= 85 ? '#10b981' : value >= 65 ? '#f59e0b' : '#ef4444';
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', mx: 'auto' }}>
      <CircularProgress
        variant="determinate"
        value={100}
        size={88}
        thickness={5}
        sx={{ color: 'action.hover', position: 'absolute' }}
      />
      <CircularProgress
        variant="determinate"
        value={value}
        size={88}
        thickness={5}
        sx={{ color }}
      />
      <Box
        sx={{
          top: 0, left: 0, bottom: 0, right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <Typography variant="h6" fontWeight={800} sx={{ color, lineHeight: 1 }}>
          {value}%
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
          confidence
        </Typography>
      </Box>
    </Box>
  );
};

// ─── Token usage bar ──────────────────────────────────────────────────────

const TokenBar: React.FC<{
  label: string;
  used: number;
  budget: number;
}> = ({ label, used, budget }) => {
  const pct = budget > 0 ? Math.min(100, Math.round((used / budget) * 100)) : 0;
  const color = pct > 90 ? 'error' : pct > 70 ? 'warning' : 'primary';
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Token sx={{ fontSize: 14, color: 'text.disabled' }} />
          <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Box>
        <Typography variant="caption" fontWeight={700}>
          {used.toLocaleString()}/{budget.toLocaleString()}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        color={color}
        sx={{ height: 6, borderRadius: 3 }}
      />
    </Box>
  );
};

// ─── API ──────────────────────────────────────────────────────────────────

async function fetchWorkflowStatus(workflowRunId: string): Promise<WorkflowStatusData> {
  const res = await fetch(`/api/v1/ai/workflow/${workflowRunId}/status`);
  if (!res.ok) throw new Error('Failed to fetch workflow status');
  return res.json() as Promise<WorkflowStatusData>;
}

// ─── Page ─────────────────────────────────────────────────────────────────

const AIWorkflowPage: React.FC = () => {
  const { workflowRunId } = useParams<{ workflowRunId: string }>();
  const queryClient = useQueryClient();
  const { toast } = useUIStore();
  const [selectedStage, setSelectedStage] = useState<WorkflowStage | null>(null);
  const [wsEvents, setWsEvents] = useState<WorkflowEvent[]>([]);

  // ── WebSocket for real-time updates ──
  const { subscribe, isConnected } = useWebSocket({
    rooms: workflowRunId ? [`workflow:${workflowRunId}`] : [],
  });

  // ── Query ──
  const {
    data: workflowData,
    isLoading,
    isError,
    refetch,
  } = useQuery<WorkflowStatusData>({
    queryKey: ['workflow-status', workflowRunId],
    queryFn: () => fetchWorkflowStatus(workflowRunId!),
    enabled: !!workflowRunId,
    refetchInterval: (query) => {
      const d = query.state.data;
      return d?.status === 'RUNNING' ? 5_000 : false;
    },
  });

  // ── Subscribe to WS events ──
  useEffect(() => {
    if (!workflowRunId) return;
    const unsub = subscribe<{ event: WorkflowEvent }>(
      'workflow:update',
      ({ event }) => {
        setWsEvents((prev) => [event, ...prev].slice(0, 20));
        queryClient.invalidateQueries({ queryKey: ['workflow-status', workflowRunId] });
      },
    );
    return unsub;
  }, [workflowRunId, subscribe, queryClient]);

  const allEvents = wsEvents.length > 0 ? wsEvents : (workflowData?.events ?? []);

  // ── Mutations ──
  const makeWorkflowAction = (action: string) => () =>
    fetch(`/api/v1/ai/workflow/${workflowRunId}/${action}`, { method: 'POST' }).then((r) => {
      if (!r.ok) throw new Error('Action failed');
    });

  const resumeMutation = useMutation({
    mutationFn: makeWorkflowAction('resume'),
    onSuccess: () => {
      toast.success('Workflow resumed');
      queryClient.invalidateQueries({ queryKey: ['workflow-status', workflowRunId] });
    },
    onError: () => toast.error('Failed to resume workflow'),
  });

  const pauseMutation = useMutation({
    mutationFn: makeWorkflowAction('pause'),
    onSuccess: () => {
      toast.success('Workflow paused');
      queryClient.invalidateQueries({ queryKey: ['workflow-status', workflowRunId] });
    },
    onError: () => toast.error('Failed to pause workflow'),
  });

  const restartMutation = useMutation({
    mutationFn: makeWorkflowAction('restart'),
    onSuccess: () => {
      toast.success('Workflow restarting…');
      queryClient.invalidateQueries({ queryKey: ['workflow-status', workflowRunId] });
    },
    onError: () => toast.error('Failed to restart workflow'),
  });

  const processingTimeSec =
    workflowData?.processingTimeMs != null
      ? (workflowData.processingTimeMs / 1000).toFixed(1)
      : '—';

  // ─── Loading ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', height: '100%' }}>
        <Box sx={{ flex: 1, p: 2 }}>
          <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
          <Skeleton
            variant="rectangular"
            sx={{ height: 'calc(100% - 80px)', borderRadius: 2 }}
          />
        </Box>
        <Box
          sx={{
            width: 300,
            p: 2,
            borderLeft: '1px solid',
            borderColor: 'divider',
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={64}
              sx={{ mb: 1.5, borderRadius: 2 }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Failed to load workflow status.
        </Alert>
      </Box>
    );
  }

  const status: WorkflowRunStatus = workflowData?.status ?? 'PENDING';
  const statusCfg = STATUS_CONFIG[status];

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* ── Main column ── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Box
            sx={{
              px: 3,
              py: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              flexShrink: 0,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AutoAwesome color="primary" />
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  AI SDLC Workflow
                </Typography>
                {workflowData?.runId && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontFamily: 'monospace' }}
                  >
                    Run ID: {workflowData.runId}
                  </Typography>
                )}
              </Box>
            </Box>

            <Chip
              label={statusCfg.label}
              color={statusCfg.color}
              size="small"
              icon={
                status === 'RUNNING' ? (
                  <CircularProgress size={10} color="inherit" />
                ) : undefined
              }
              sx={{ fontWeight: 800, letterSpacing: 0.5 }}
            />

            {isConnected && (
              <Chip
                label="Live"
                size="small"
                color="success"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            )}

            <Box sx={{ ml: 'auto' }}>
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={() => refetch()}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </motion.div>

        {/* Workflow diagram */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <WorkflowDiagram
            stages={workflowData?.stages}
            onNodeClick={setSelectedStage}
            isLive={status === 'RUNNING'}
          />
        </Box>
      </Box>

      {/* ── Right sidebar (300px) ── */}
      <Box
        sx={{
          width: 300,
          flexShrink: 0,
          borderLeft: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': { borderRadius: 2, bgcolor: 'divider' },
          }}
        >
          {/* Current stage */}
          <Paper
            elevation={0}
            sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
              display="block"
              mb={0.75}
            >
              CURRENT STAGE
            </Typography>
            <Typography variant="subtitle2" fontWeight={700}>
              {workflowData?.currentStageLabel ??
                selectedStage?.label ??
                '—'}
            </Typography>
            {workflowData?.currentStage && (
              <Chip
                label={workflowData.currentStage}
                size="small"
                sx={{ mt: 0.5, height: 18, fontSize: '0.65rem' }}
              />
            )}
          </Paper>

          {/* AI Confidence gauge */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
              alignSelf="flex-start"
            >
              AI CONFIDENCE
            </Typography>
            <ConfidenceGauge value={workflowData?.confidenceScore ?? 0} />
          </Paper>

          {/* Token usage */}
          {workflowData?.tokenUsage && (
            <Paper
              elevation={0}
              sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={700}
                display="block"
                mb={1.5}
              >
                TOKEN USAGE
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TokenBar
                  label="Input tokens"
                  used={workflowData.tokenUsage.inputTokens}
                  budget={workflowData.tokenUsage.inputBudget}
                />
                <TokenBar
                  label="Output tokens"
                  used={workflowData.tokenUsage.outputTokens}
                  budget={workflowData.tokenUsage.outputBudget}
                />
              </Box>
            </Paper>
          )}

          {/* Processing time */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <AccessTime sx={{ color: 'text.disabled', fontSize: 20 }} />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Processing time
              </Typography>
              <Typography variant="subtitle2" fontWeight={700}>
                {processingTimeSec}s
              </Typography>
            </Box>
          </Paper>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {(status === 'PAUSED' || status === 'FAILED') && (
              <Button
                variant="contained"
                fullWidth
                startIcon={
                  resumeMutation.isPending ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <PlayArrow />
                  )
                }
                onClick={() => resumeMutation.mutate()}
                disabled={resumeMutation.isPending}
              >
                Resume Workflow
              </Button>
            )}

            {status === 'RUNNING' && (
              <Button
                variant="outlined"
                fullWidth
                startIcon={
                  pauseMutation.isPending ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Pause />
                  )
                }
                onClick={() => pauseMutation.mutate()}
                disabled={pauseMutation.isPending}
              >
                Pause
              </Button>
            )}

            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              startIcon={
                restartMutation.isPending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Refresh />
                )
              }
              onClick={() => restartMutation.mutate()}
              disabled={restartMutation.isPending}
            >
              Restart
            </Button>
          </Box>

          <Divider />

          {/* Recent events log */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
              display="block"
              mb={1}
            >
              RECENT EVENTS
            </Typography>
            <List dense disablePadding>
              <AnimatePresence initial={false}>
                {allEvents.slice(0, 5).map((event) => {
                  const cfg = EVENT_LEVEL_CONFIG[event.level];
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ListItem
                        disablePadding
                        sx={{
                          py: 0.75,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          '&:last-child': { borderBottom: 'none' },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 24, color: cfg.color }}>
                          {cfg.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography
                              variant="caption"
                              sx={{ lineHeight: 1.4 }}
                            >
                              {event.message}
                            </Typography>
                          }
                          secondary={
                            <Typography
                              variant="caption"
                              color="text.disabled"
                              sx={{ fontSize: '0.65rem' }}
                            >
                              {new Date(event.timestamp).toLocaleTimeString()}
                              {' · '}
                              {event.stage}
                            </Typography>
                          }
                        />
                      </ListItem>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {allEvents.length === 0 && (
                <Typography
                  variant="caption"
                  color="text.disabled"
                  sx={{ py: 2, display: 'block', textAlign: 'center' }}
                >
                  No events yet
                </Typography>
              )}
            </List>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AIWorkflowPage;
