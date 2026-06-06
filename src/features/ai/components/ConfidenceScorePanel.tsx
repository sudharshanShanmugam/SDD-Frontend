import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Divider,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { AutoAwesome, Info } from '@mui/icons-material';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

export interface ConfidenceBreakdown {
  overall: number;
  dimensions: Array<{ name: string; score: number; description: string }>;
  model: string;
  tokensUsed: number;
  processingTime: number;
  flags?: Array<{ type: 'warning' | 'info'; message: string }>;
}

interface ConfidenceScorePanelProps {
  data?: ConfidenceBreakdown;
  loading?: boolean;
}

const ScoreBadge: React.FC<{ score: number; size?: 'sm' | 'lg' }> = ({ score, size = 'sm' }) => {
  const color = score >= 90 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444';
  const isLg = size === 'lg';
  return (
    <Box
      sx={{
        width: isLg ? 72 : 40,
        height: isLg ? 72 : 40,
        borderRadius: '50%',
        border: `${isLg ? 4 : 3}px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: color + '1a',
        flexShrink: 0,
      }}
    >
      <Typography
        variant={isLg ? 'h5' : 'caption'}
        fontWeight={700}
        sx={{ color }}
      >
        {score}
      </Typography>
    </Box>
  );
};

const ConfidenceScorePanel: React.FC<ConfidenceScorePanelProps> = ({
  data,
  loading = false,
}) => {
  if (!data) return null;

  const radarData = data.dimensions.map((d) => ({
    subject: d.name,
    score: d.score,
  }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Overall Score */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesome color="secondary" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={600}>
                AI Confidence Score
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Model: {data.model} • {data.tokensUsed.toLocaleString()} tokens • {data.processingTime}s
            </Typography>
          </Box>
          {loading ? <CircularProgress size={32} /> : <ScoreBadge score={data.overall} size="lg" />}
        </Box>

        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Dimension Breakdown */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
          DIMENSION BREAKDOWN
        </Typography>
        {data.dimensions.map((dim, index) => {
          const color = dim.score >= 90 ? '#10b981' : dim.score >= 70 ? '#f59e0b' : '#ef4444';
          return (
            <Box key={dim.name} sx={{ mb: index < data.dimensions.length - 1 ? 1.25 : 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2">{dim.name}</Typography>
                  <Tooltip title={dim.description} arrow>
                    <Info sx={{ fontSize: 14, color: 'text.disabled', cursor: 'help' }} />
                  </Tooltip>
                </Box>
                <Typography variant="caption" fontWeight={700} sx={{ color }}>
                  {dim.score}%
                </Typography>
              </Box>
              <Box sx={{ height: 6, borderRadius: 1, bgcolor: 'action.hover', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${dim.score}%` }}
                  transition={{ duration: 0.7, delay: index * 0.05 }}
                  style={{ height: '100%', backgroundColor: color, borderRadius: 4 }}
                />
              </Box>
            </Box>
          );
        })}
      </Paper>

      {/* Flags */}
      {data.flags && data.flags.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            FLAGS
          </Typography>
          {data.flags.map((flag, i) => (
            <Chip
              key={i}
              icon={<Info sx={{ fontSize: '14px !important' }} />}
              label={flag.message}
              size="small"
              color={flag.type === 'warning' ? 'warning' : 'info'}
              sx={{ mb: 0.5, height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal', py: 0.5 } }}
            />
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default ConfidenceScorePanel;
