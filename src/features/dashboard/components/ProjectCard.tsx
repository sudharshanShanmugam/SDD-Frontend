import React from 'react';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Avatar,
  AvatarGroup,
  Tooltip,
} from '@mui/material';
import {
  AutoAwesome,
  AccessTime,
} from '@mui/icons-material';
import { FolderKanban } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  key?: string;
  description?: string;
  status: 'active' | 'draft' | 'completed' | 'on_hold';
  stage: 'requirements' | 'epics' | 'stories' | 'sprints' | 'tasks' | 'qa' | 'release';
  progress: number;
  storyCount: number;
  completedStories: number;
  members: Array<{ id: string; name: string; avatar?: string }>;
  updatedAt: string;
  aiConfidence?: number;
  color?: string;
}

// ─────────────────────────────────────────────────────────────
// Config maps
// ─────────────────────────────────────────────────────────────

const statusConfig: Record<
  Project['status'],
  { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'error' }
> = {
  active:    { label: 'Active',    color: 'primary'  },
  draft:     { label: 'Draft',     color: 'default'  },
  completed: { label: 'Completed', color: 'success'  },
  on_hold:   { label: 'On Hold',   color: 'warning'  },
};

const stageLabels: Record<Project['stage'], string> = {
  requirements: 'Requirements',
  epics:        'Epics',
  stories:      'Stories',
  sprints:      'Sprint Planning',
  tasks:        'Tasks',
  qa:           'QA',
  release:      'Release',
};

const stageColor: Record<Project['stage'], string> = {
  requirements: '#6366f1',
  epics:        '#8b5cf6',
  stories:      '#3b82f6',
  sprints:      '#10b981',
  tasks:        '#f59e0b',
  qa:           '#ec4899',
  release:      '#14b8a6',
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: Project;
  workspaceId: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const navigate  = useNavigate();
  const statusCfg = statusConfig[project.status];
  const accent    = project.color ?? stageColor[project.stage] ?? '#6366f1';

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ height: '100%' }}
    >
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'border-color 180ms, box-shadow 180ms',
          '&:hover': {
            borderColor: accent,
            boxShadow: `0 4px 20px ${accent}22`,
          },
        }}
      >
        {/* Colour accent strip */}
        <Box sx={{ height: 4, bgcolor: accent, flexShrink: 0 }} />

        <CardActionArea
          onClick={() => navigate(`/projects/${project.id}`)}
          sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
        >
          <CardContent sx={{ flex: 1, p: 2.5, pb: '10px !important' }}>
            {/* Top row: icon + status */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.75 }}>
              <Box
                sx={{
                  width: 40, height: 40,
                  borderRadius: 2,
                  bgcolor: `${accent}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: accent,
                  flexShrink: 0,
                }}
              >
                <FolderKanban size={20} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {project.key && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: 'text.disabled',
                      letterSpacing: '0.05em',
                      fontSize: '0.68rem',
                    }}
                  >
                    {project.key}
                  </Typography>
                )}
                <Chip
                  label={statusCfg.label}
                  color={statusCfg.color}
                  size="small"
                  sx={{ borderRadius: 1, height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                />
              </Box>
            </Box>

            {/* Name */}
            <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ mb: 0.5, lineHeight: 1.3 }}>
              {project.name}
            </Typography>

            {/* Description */}
            {project.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 1.75,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  fontSize: '0.8rem',
                  lineHeight: 1.5,
                }}
              >
                {project.description}
              </Typography>
            )}

            {/* Progress */}
            <Box sx={{ mb: 1.75 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {stageLabels[project.stage]}
                </Typography>
                <Typography variant="caption" fontWeight={700} sx={{ color: accent }}>
                  {project.progress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={project.progress}
                sx={{
                  borderRadius: 1,
                  height: 5,
                  bgcolor: `${accent}18`,
                  '& .MuiLinearProgress-bar': { bgcolor: accent, borderRadius: 1 },
                }}
              />
            </Box>

            {/* Footer: stories + members */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Typography variant="caption" color="text.secondary">
                  {project.completedStories}/{project.storyCount} stories
                </Typography>
                {project.aiConfidence !== undefined && (
                  <Chip
                    icon={<AutoAwesome sx={{ fontSize: '11px !important' }} />}
                    label={`${project.aiConfidence}%`}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.63rem',
                      fontWeight: 700,
                      bgcolor: 'secondary.main',
                      color: 'white',
                    }}
                  />
                )}
              </Box>

              {project.members.length > 0 && (
                <AvatarGroup
                  max={3}
                  sx={{ '& .MuiAvatar-root': { width: 22, height: 22, fontSize: '0.6rem', border: '1.5px solid white' } }}
                >
                  {project.members.map((m) => (
                    <Tooltip key={m.id} title={m.name}>
                      <Avatar {...(m.avatar ? { src: m.avatar } : {})} alt={m.name}>
                        {m.name[0]}
                      </Avatar>
                    </Tooltip>
                  ))}
                </AvatarGroup>
              )}
            </Box>
          </CardContent>

          {/* Timestamp footer */}
          <Box
            sx={{
              px: 2.5,
              py: 1.25,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              bgcolor: 'grey.50',
            }}
          >
            <AccessTime sx={{ fontSize: 13, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.72rem' }}>
              Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
            </Typography>
          </Box>
        </CardActionArea>
      </Card>
    </motion.div>
  );
};

export default ProjectCard;
