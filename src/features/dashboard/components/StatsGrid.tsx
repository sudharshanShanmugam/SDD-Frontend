import React from 'react';
import { Grid, Paper, Typography, Box, Skeleton, Chip } from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Description,
  CheckCircle,
  BugReport,
  Speed,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface StatItem {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: string;
}

interface StatsGridProps {
  stats?: StatItem[];
  loading?: boolean;
}


const StatCard: React.FC<{ stat: StatItem; index: number; loading: boolean }> = ({
  stat,
  index,
  loading,
}) => {
  const isPositive = (stat.change ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
    >
      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: stat.color,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            {loading ? (
              <>
                <Skeleton width={80} height={16} />
                <Skeleton width={60} height={40} sx={{ mt: 1 }} />
              </>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {stat.label}
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {stat.value}
                </Typography>
              </>
            )}
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${stat.color}1a`,
              color: stat.color,
            }}
          >
            {stat.icon}
          </Box>
        </Box>

        {!loading && stat.change !== undefined && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isPositive ? (
              <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
            ) : (
              <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
            )}
            <Chip
              label={`${isPositive ? '+' : ''}${stat.change}%`}
              size="small"
              color={isPositive ? 'success' : 'error'}
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
            <Typography variant="caption" color="text.secondary">
              {stat.changeLabel}
            </Typography>
          </Box>
        )}
      </Paper>
    </motion.div>
  );
};

const StatsGrid: React.FC<StatsGridProps> = ({ stats = [], loading = false }) => {
  return (
    <Grid container spacing={3}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} lg={3} key={stat.label}>
          <StatCard stat={stat} index={index} loading={loading} />
        </Grid>
      ))}
    </Grid>
  );
};

export default StatsGrid;
