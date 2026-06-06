import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Description,
  AccountTree,
  Assignment,
  PlaylistAdd,
  Task,
  BugReport,
  RocketLaunch,
  CheckCircle,
  RadioButtonUnchecked,
  PlayCircle,
} from '@mui/icons-material';

export type SDLCStage =
  | 'requirements'
  | 'epics'
  | 'stories'
  | 'sprints'
  | 'tasks'
  | 'qa'
  | 'release';

const stages: Array<{ key: SDLCStage; label: string; icon: React.ReactNode; color: string }> = [
  { key: 'requirements', label: 'Requirements', icon: <Description sx={{ fontSize: 16 }} />, color: '#6366f1' },
  { key: 'epics',        label: 'Epics',        icon: <AccountTree sx={{ fontSize: 16 }} />, color: '#8b5cf6' },
  { key: 'stories',      label: 'Stories',      icon: <Assignment sx={{ fontSize: 16 }} />,  color: '#3b82f6' },
  { key: 'sprints',      label: 'Sprints',      icon: <PlaylistAdd sx={{ fontSize: 16 }} />, color: '#10b981' },
  { key: 'tasks',        label: 'Tasks',        icon: <Task sx={{ fontSize: 16 }} />,        color: '#f59e0b' },
  { key: 'qa',           label: 'QA',           icon: <BugReport sx={{ fontSize: 16 }} />,   color: '#ec4899' },
  { key: 'release',      label: 'Release',      icon: <RocketLaunch sx={{ fontSize: 16 }} />, color: '#14b8a6' },
];

const stageIndex = (stage: SDLCStage) => stages.findIndex((s) => s.key === stage);

interface WorkflowProgressProps {
  currentStage: SDLCStage | null;
  completedStages?: SDLCStage[];
  stageCounts?: Partial<Record<SDLCStage, number>>;
}

const WorkflowProgress: React.FC<WorkflowProgressProps> = ({
  currentStage,
  completedStages = [],
  stageCounts = {},
}) => {
  const activeIndex = currentStage ? stageIndex(currentStage) : -1;

  return (
    <Box>
      {/* Summary chip */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {activeIndex >= 0
            ? `Stage ${activeIndex + 1} of ${stages.length}`
            : 'Not started'}
        </Typography>
        {activeIndex >= 0 && (
          <Chip
            label={`${Math.round(((activeIndex) / stages.length) * 100)}% complete`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 22 }}
          />
        )}
      </Box>

      {/* Vertical stage list */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {stages.map((stage, index) => {
          const isCompleted = completedStages.includes(stage.key) || index < activeIndex;
          const isActive    = stage.key === currentStage;
          const isPending   = index > activeIndex;
          const count       = stageCounts[stage.key];
          const isLast      = index === stages.length - 1;

          return (
            <Box key={stage.key} sx={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
              {/* Left: connector line + icon */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 36, flexShrink: 0 }}>
                {/* Icon circle */}
                <Tooltip title={stage.label} placement="left">
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      bgcolor: isCompleted
                        ? 'success.main'
                        : isActive
                        ? stage.color
                        : 'action.hover',
                      color: isCompleted || isActive ? 'white' : 'text.disabled',
                      boxShadow: isActive ? `0 0 0 4px ${stage.color}28` : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircle sx={{ fontSize: 16 }} />
                    ) : isActive ? (
                      stage.icon
                    ) : (
                      <Box sx={{ color: 'text.disabled', display: 'flex', alignItems: 'center' }}>
                        {stage.icon}
                      </Box>
                    )}
                  </Box>
                </Tooltip>

                {/* Connecting line */}
                {!isLast && (
                  <Box
                    sx={{
                      width: 2,
                      flex: 1,
                      minHeight: 8,
                      bgcolor: isCompleted ? 'success.light' : 'divider',
                      my: 0.25,
                    }}
                  />
                )}
              </Box>

              {/* Right: label + count */}
              <Box
                sx={{
                  flex: 1,
                  pt: 0.5,
                  pb: isLast ? 0 : 1.25,
                  pl: 1.25,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    fontWeight={isActive ? 700 : 500}
                    color={isActive ? stage.color : isPending ? 'text.disabled' : 'text.primary'}
                    sx={{ lineHeight: 1.3, fontSize: '0.82rem' }}
                  >
                    {stage.label}
                  </Typography>
                  {isActive && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      In progress
                    </Typography>
                  )}
                  {isCompleted && (
                    <Typography variant="caption" sx={{ color: 'success.main', fontSize: '0.7rem' }}>
                      Completed
                    </Typography>
                  )}
                </Box>

                {count !== undefined && (
                  <Chip
                    label={count}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      bgcolor: `${stage.color}18`,
                      color: stage.color,
                      flexShrink: 0,
                      mt: 0.25,
                    }}
                  />
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default WorkflowProgress;
