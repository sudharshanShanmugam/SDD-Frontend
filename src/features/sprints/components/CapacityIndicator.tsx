import React from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Tooltip,
  Avatar,
  AvatarGroup,
  Chip,
  Grid,
  Divider,
} from '@mui/material';
import { Person, Warning, CheckCircle, Speed } from '@mui/icons-material';
import { motion } from 'framer-motion';

export interface TeamMemberCapacity {
  id: string;
  name: string;
  avatar?: string;
  availableHours: number;
  allocatedHours: number;
  role: string;
}

export interface SprintCapacity {
  totalAvailable: number;
  totalAllocated: number;
  totalPoints: number;
  completedPoints: number;
  velocity: number; // avg points per sprint
  members: TeamMemberCapacity[];
}

interface CapacityBarProps {
  value: number; // 0–100
  color: string;
  label?: string;
}

const CapacityBar: React.FC<CapacityBarProps> = ({ value, color, label }) => (
  <Box>
    {label && (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="caption" fontWeight={600} sx={{ color }}>
          {value.toFixed(0)}%
        </Typography>
      </Box>
    )}
    <Box sx={{ position: 'relative' }}>
      <LinearProgress
        variant="determinate"
        value={Math.min(value, 100)}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: color + '22',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
        }}
      />
      {value > 100 && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: '100%',
            transform: 'translateX(-100%)',
            width: `${((value - 100) / value) * 100}%`,
            height: 8,
            bgcolor: '#ef444466',
            borderRadius: '0 4px 4px 0',
          }}
        />
      )}
    </Box>
  </Box>
);

const defaultCapacity: SprintCapacity = {
  totalAvailable: 0,
  totalAllocated: 0,
  totalPoints: 0,
  completedPoints: 0,
  velocity: 0,
  members: [],
};

interface CapacityIndicatorProps {
  capacity?: SprintCapacity;
  compact?: boolean;
}

const CapacityIndicator: React.FC<CapacityIndicatorProps> = ({
  capacity = defaultCapacity,
  compact = false,
}) => {
  const utilizationPct = (capacity.totalAllocated / capacity.totalAvailable) * 100;
  const progressPct = capacity.totalPoints > 0 ? (capacity.completedPoints / capacity.totalPoints) * 100 : 0;
  const velocityDiff = capacity.totalPoints - capacity.velocity;

  const getCapacityStatus = () => {
    if (utilizationPct > 95) return { color: '#ef4444', label: 'Over capacity', icon: <Warning fontSize="small" /> };
    if (utilizationPct > 85) return { color: '#f59e0b', label: 'Near capacity', icon: <Warning fontSize="small" /> };
    return { color: '#10b981', label: 'Healthy', icon: <CheckCircle fontSize="small" /> };
  };

  const status = getCapacityStatus();

  if (compact) {
    return (
      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="caption" fontWeight={600} color="text.secondary">TEAM CAPACITY</Typography>
          <Chip
            label={status.label}
            size="small"
            icon={status.icon}
            sx={{ height: 20, fontSize: '0.6rem', bgcolor: status.color + '22', color: status.color }}
          />
        </Box>
        <CapacityBar value={utilizationPct} color={status.color} />
        <Typography variant="caption" color="text.secondary">
          {capacity.totalAllocated}h / {capacity.totalAvailable}h allocated
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Overview Cards */}
      <Grid container spacing={1.5}>
        {[
          {
            label: 'Capacity',
            value: `${utilizationPct.toFixed(0)}%`,
            sub: `${capacity.totalAllocated} / ${capacity.totalAvailable}h`,
            color: status.color,
            icon: <Speed />,
          },
          {
            label: 'Sprint Progress',
            value: `${progressPct.toFixed(0)}%`,
            sub: `${capacity.completedPoints} / ${capacity.totalPoints} pts`,
            color: '#6366f1',
            icon: <CheckCircle />,
          },
          {
            label: 'Velocity',
            value: `${capacity.totalPoints} pts`,
            sub: velocityDiff > 0 ? `+${velocityDiff} above avg` : `${velocityDiff} below avg`,
            color: velocityDiff >= 0 ? '#10b981' : '#f59e0b',
            icon: <Speed />,
          },
          {
            label: 'Team Size',
            value: `${capacity.members.length}`,
            sub: 'active members',
            color: '#3b82f6',
            icon: <Person />,
          },
        ].map((stat) => (
          <Grid item xs={6} sm={3} key={stat.label}>
            <motion.div whileHover={{ y: -2 }}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Box sx={{ color: stat.color, mb: 0.5 }}>{stat.icon}</Box>
                <Typography variant="h6" fontWeight={700} sx={{ color: stat.color }}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">{stat.label}</Typography>
                <Typography variant="caption" color="text.disabled">{stat.sub}</Typography>
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Overall Capacity Bar */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={600}>Team Capacity Utilization</Typography>
          <Chip
            icon={status.icon}
            label={status.label}
            size="small"
            sx={{ bgcolor: status.color + '22', color: status.color, fontWeight: 600 }}
          />
        </Box>
        <CapacityBar value={utilizationPct} color={status.color} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75 }}>
          <Typography variant="caption" color="text.secondary">
            {capacity.totalAllocated}h allocated
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {capacity.totalAvailable - capacity.totalAllocated}h remaining
          </Typography>
        </Box>
      </Paper>

      {/* Per-member breakdown */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={600}>Individual Allocation</Typography>
          <AvatarGroup max={6} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.65rem' } }}>
            {capacity.members.map((m) => (
              <Avatar key={m.id} sx={{ bgcolor: '#6366f1' }}>
                {m.name.charAt(0)}
              </Avatar>
            ))}
          </AvatarGroup>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {capacity.members.map((member, idx) => {
            const pct = (member.allocatedHours / member.availableHours) * 100;
            const memberColor = pct > 95 ? '#ef4444' : pct > 85 ? '#f59e0b' : '#10b981';

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1fr 80px', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: memberColor + '44', color: memberColor, fontSize: '0.7rem', fontWeight: 700 }}>
                      {member.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" fontWeight={600} noWrap>{member.name.split(' ')[0]}</Typography>
                      <Typography variant="caption" color="text.disabled" display="block" noWrap sx={{ fontSize: '0.6rem' }}>
                        {member.role}
                      </Typography>
                    </Box>
                  </Box>
                  <Tooltip title={`${member.allocatedHours}h / ${member.availableHours}h`}>
                    <Box>
                      <CapacityBar value={pct} color={memberColor} />
                    </Box>
                  </Tooltip>
                  <Typography variant="caption" fontWeight={600} sx={{ color: memberColor, textAlign: 'right' }}>
                    {member.allocatedHours}h
                  </Typography>
                </Box>
              </motion.div>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
};

export default CapacityIndicator;
