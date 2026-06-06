import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Typography, Chip, CircularProgress, Tooltip } from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  HourglassEmpty,
  RadioButtonUnchecked,
  AutoAwesome,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

export type WorkflowNodeStatus = 'pending' | 'active' | 'approved' | 'failed' | 'skipped';

export interface WorkflowNodeData {
  label: string;
  stage: string;
  status: WorkflowNodeStatus;
  description?: string;
  artifactCount?: number;
  confidence?: number;
  processingTime?: number;
  onClick?: () => void;
}

const statusConfig: Record<
  WorkflowNodeStatus,
  { color: string; bgColor: string; borderColor: string; icon: React.ReactNode }
> = {
  pending: {
    color: '#94a3b8',
    bgColor: '#f8fafc',
    borderColor: '#e2e8f0',
    icon: <RadioButtonUnchecked sx={{ fontSize: 16, color: '#94a3b8' }} />,
  },
  active: {
    color: '#3b82f6',
    bgColor: '#eff6ff',
    borderColor: '#3b82f6',
    icon: <CircularProgress size={16} thickness={5} />,
  },
  approved: {
    color: '#10b981',
    bgColor: '#f0fdf4',
    borderColor: '#10b981',
    icon: <CheckCircle sx={{ fontSize: 16, color: '#10b981' }} />,
  },
  failed: {
    color: '#ef4444',
    bgColor: '#fef2f2',
    borderColor: '#ef4444',
    icon: <ErrorIcon sx={{ fontSize: 16, color: '#ef4444' }} />,
  },
  skipped: {
    color: '#94a3b8',
    bgColor: '#f8fafc',
    borderColor: '#e2e8f0',
    icon: <RadioButtonUnchecked sx={{ fontSize: 16, color: '#94a3b8' }} />,
  },
};

const WorkflowNode: React.FC<NodeProps<WorkflowNodeData>> = ({ data, selected }) => {
  const cfg = statusConfig[data.status];

  return (
    <motion.div
      animate={{
        scale: data.status === 'active' ? [1, 1.02, 1] : 1,
        transition: data.status === 'active'
          ? { repeat: Infinity, duration: 2, ease: 'easeInOut' }
          : { duration: 0.2 },
      }}
    >
      <Tooltip
        title={
          data.description ? (
            <Box>
              <Typography variant="caption">{data.description}</Typography>
              {data.confidence && (
                <Typography variant="caption" display="block">
                  AI Confidence: {data.confidence}%
                </Typography>
              )}
              {data.processingTime && (
                <Typography variant="caption" display="block">
                  Processing: {data.processingTime}s
                </Typography>
              )}
            </Box>
          ) : ''
        }
        arrow
        placement="top"
      >
        <Box
          onClick={data.onClick}
          sx={{
            minWidth: 160,
            maxWidth: 200,
            border: `2px solid ${selected ? '#6366f1' : cfg.borderColor}`,
            borderRadius: 2,
            bgcolor: cfg.bgColor,
            p: 1.5,
            cursor: data.onClick ? 'pointer' : 'default',
            boxShadow: selected
              ? `0 0 0 3px #6366f133`
              : data.status === 'active'
              ? `0 0 0 3px ${cfg.borderColor}33`
              : '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'all 0.15s ease',
            '&:hover': data.onClick ? {
              boxShadow: `0 4px 12px rgba(0,0,0,0.15)`,
              transform: 'translateY(-1px)',
            } : {},
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
            <Typography
              variant="caption"
              fontWeight={700}
              sx={{
                color: cfg.color,
                textTransform: 'uppercase',
                fontSize: '0.6rem',
                letterSpacing: 0.5,
              }}
            >
              {data.stage}
            </Typography>
            {cfg.icon}
          </Box>

          <Typography variant="body2" fontWeight={600} sx={{ color: '#1e293b', mb: 0.5, lineHeight: 1.3 }}>
            {data.label}
          </Typography>

          {(data.artifactCount !== undefined || data.confidence !== undefined) && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
              {data.artifactCount !== undefined && (
                <Chip
                  label={`${data.artifactCount} items`}
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: '0.6rem',
                    bgcolor: cfg.color + '1a',
                    color: cfg.color,
                    borderRadius: 1,
                  }}
                />
              )}
              {data.confidence !== undefined && data.status === 'approved' && (
                <Chip
                  icon={<AutoAwesome sx={{ fontSize: '8px !important' }} />}
                  label={`${data.confidence}%`}
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: '0.6rem',
                    bgcolor: '#f0fdf4',
                    color: '#10b981',
                    borderRadius: 1,
                  }}
                />
              )}
            </Box>
          )}
        </Box>
      </Tooltip>

      <Handle type="target" position={Position.Left} style={{ background: cfg.color, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: cfg.color, width: 8, height: 8 }} />
    </motion.div>
  );
};

export default WorkflowNode;
