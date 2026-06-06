import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Tabs,
  Tab,
  LinearProgress,
  Button,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit,
  AutoAwesome,
  Assignment,
  Link as LinkIcon,
  FlagOutlined,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { epicsApi } from '@/api';
import type { Epic } from './EpicCard';

interface EpicDetailProps {
  epic: Epic;
  onEdit?: () => void;
}

// Priority colour helpers
const priorityColor: Record<string, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#2563eb',
  low: '#16a34a',
  functional: '#2563eb',
  non_functional: '#7c3aed',
  business: '#0891b2',
  technical: '#64748b',
  constraint: '#dc2626',
};

const EpicDetail: React.FC<EpicDetailProps> = ({ epic, onEdit }) => {
  const [activeTab, setActiveTab] = useState(0);
  const progress = epic.storyCount > 0 ? (epic.completedStories / epic.storyCount) * 100 : 0;
  const stories: { id: string; storyId: string; title: string; status: string; points: number }[] = [];

  // Fetch linked requirements when the Requirements tab is active
  const {
    data: reqData,
    isLoading: reqLoading,
    error: reqError,
  } = useQuery({
    queryKey: ['epic-requirements', epic.id],
    queryFn: () => epicsApi.getRequirements(epic.id),
    enabled: activeTab === 2,
    staleTime: 30_000,
  });

  const linkedReqs = (reqData as any)?.data?.items ?? (reqData as any)?.items ?? [];
  const reqCount = epic.requirementCount ?? linkedReqs.length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Header ── */}
      <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={epic.epicId} size="small" sx={{ fontFamily: 'monospace', fontWeight: 700 }} />
            <Chip
              label={epic.status.replace('_', ' ')}
              size="small"
              color={epic.status === 'done' ? 'success' : epic.status === 'in_progress' ? 'primary' : 'default'}
            />
            <Chip
              label={epic.priority}
              size="small"
              color={epic.priority === 'critical' ? 'error' : epic.priority === 'high' ? 'warning' : 'default'}
            />
            {epic.isAiGenerated && (
              <Chip
                icon={<AutoAwesome sx={{ fontSize: 12 }} />}
                label="AI Generated"
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
          </Box>
          <Button variant="outlined" size="small" startIcon={<Edit />} onClick={onEdit} sx={{ borderRadius: 2 }}>
            Edit
          </Button>
        </Box>

        <Typography variant="h5" fontWeight={700} gutterBottom>
          {epic.title}
        </Typography>

        {/* Stats row */}
        <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap' }}>
          {epic.storyCount > 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {epic.completedStories} / {epic.storyCount} stories completed
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{ ml: 2 }}>
                  {Math.round(progress)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 8, borderRadius: 2, minWidth: 200 }}
                color={progress === 100 ? 'success' : 'primary'}
              />
            </Box>
          )}

          {reqCount > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Assignment sx={{ fontSize: 18, color: 'primary.main' }} />
              <Typography variant="body2" fontWeight={600} color="primary.main">
                {reqCount} requirement{reqCount === 1 ? '' : 's'} linked
              </Typography>
            </Box>
          )}
        </Box>

        {/* Tags */}
        {epic.tags && epic.tags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {epic.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.68rem' }} />
            ))}
          </Box>
        )}
      </Box>

      {/* ── Tabs ── */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ px: 2 }}>
          <Tab label="Description" />
          <Tab label={`Stories (${epic.storyCount})`} />
          <Tab label={`Requirements (${reqCount})`} />
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
        {/* ── Description tab ── */}
        {activeTab === 0 && (
          <Box>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}
            >
              {epic.description
                ? epic.description.replace(/<[^>]*>/g, '')
                : 'No description provided.'}
            </Typography>

            {(epic.startDate || epic.endDate) && (
              <Box sx={{ mt: 3, display: 'flex', gap: 3 }}>
                {epic.startDate && (
                  <Box>
                    <Typography variant="caption" color="text.disabled" fontWeight={600} display="block" gutterBottom>
                      START DATE
                    </Typography>
                    <Typography variant="body2">{epic.startDate}</Typography>
                  </Box>
                )}
                {epic.endDate && (
                  <Box>
                    <Typography variant="caption" color="text.disabled" fontWeight={600} display="block" gutterBottom>
                      TARGET DATE
                    </Typography>
                    <Typography variant="body2">{epic.endDate}</Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* ── Stories tab ── */}
        {activeTab === 1 && (
          <Box>
            {stories.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Assignment sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5, opacity: 0.5 }} />
                <Typography variant="h6" color="text.disabled" gutterBottom>
                  No stories yet
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  Generate user stories from this epic to break it into development tasks.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {stories.map((story) => (
                  <motion.div key={story.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                    <Paper
                      variant="outlined"
                      sx={{ p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}
                    >
                      <Assignment sx={{ fontSize: 18, color: story.status === 'done' ? 'success.main' : 'primary.main' }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={500}>{story.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{story.storyId}</Typography>
                      </Box>
                      <Chip label={`${story.points} pts`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                      <Chip label={story.status} size="small" color={story.status === 'done' ? 'success' : 'primary'} sx={{ height: 18, fontSize: '0.65rem' }} />
                    </Paper>
                  </motion.div>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* ── Requirements tab ── */}
        {activeTab === 2 && (
          <Box>
            {reqLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={32} />
              </Box>
            ) : reqError ? (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                Failed to load requirements. Please try again.
              </Alert>
            ) : linkedReqs.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <LinkIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5, opacity: 0.5 }} />
                <Typography variant="h6" color="text.disabled" gutterBottom>
                  No requirements linked
                </Typography>
                <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 340, mx: 'auto' }}>
                  Re-generate epics from requirements, or manually link requirements to this epic.
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ display: 'block', mb: 1.5, letterSpacing: 0.5 }}>
                  {linkedReqs.length} REQUIREMENT{linkedReqs.length !== 1 ? 'S' : ''} LINKED TO THIS EPIC
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {linkedReqs.map((req: any, idx: number) => (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          borderLeft: `3px solid ${priorityColor[req.priority] ?? '#94a3b8'}`,
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography
                            variant="caption"
                            sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.7rem', color: 'text.disabled' }}
                          >
                            {req.reqNumber}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Chip
                              label={req.type?.replace('_', ' ') || 'functional'}
                              size="small"
                              sx={{ height: 18, fontSize: '0.62rem', bgcolor: 'action.hover' }}
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                              <FlagOutlined sx={{ fontSize: 11, color: priorityColor[req.priority] ?? '#94a3b8' }} />
                              <Typography sx={{ fontSize: '0.65rem', color: priorityColor[req.priority] ?? '#94a3b8', fontWeight: 600 }}>
                                {req.priority}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.82rem', lineHeight: 1.4 }}>
                          {req.title}
                        </Typography>
                        {req.description && req.description !== req.title && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.5,
                              mt: 0.4,
                            }}
                          >
                            {req.description}
                          </Typography>
                        )}
                      </Paper>
                    </motion.div>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default EpicDetail;
