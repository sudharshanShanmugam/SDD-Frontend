import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  Divider,
  Button,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Badge,
} from '@mui/material';
import { Search, FilterList, Add, DragIndicator, ArrowForward } from '@mui/icons-material';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDraggable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';

export interface BacklogStory {
  id: string;
  title: string;
  type: 'feature' | 'bug' | 'chore' | 'spike';
  priority: 'critical' | 'high' | 'medium' | 'low';
  storyPoints: number;
  labels: string[];
}

const TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  feature: { bg: '#ede9fe', text: '#7c3aed', label: 'Feature' },
  bug: { bg: '#fee2e2', text: '#dc2626', label: 'Bug' },
  chore: { bg: '#f0fdf4', text: '#16a34a', label: 'Chore' },
  spike: { bg: '#fff7ed', text: '#ea580c', label: 'Spike' },
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

interface DraggableStoryCardProps {
  story: BacklogStory;
  onAddToSprint?: (story: BacklogStory) => void;
}

const DraggableStoryCard: React.FC<DraggableStoryCardProps> = ({ story, onAddToSprint }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: story.id, data: story });
  const typeConf = TYPE_COLORS[story.type];

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: isDragging ? 0.4 : 1, x: 0 }}
      exit={{ opacity: 0, height: 0 }}
      style={{ cursor: 'grab' }}
    >
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          mb: 1,
          borderRadius: 1.5,
          borderLeft: `3px solid ${PRIORITY_COLORS[story.priority]}`,
          transition: 'box-shadow 0.15s',
          '&:hover': { boxShadow: 2, '& .add-btn': { opacity: 1 } },
          '& .add-btn': { opacity: 0, transition: 'opacity 0.15s' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Box {...listeners} {...attributes} sx={{ cursor: 'grab', color: 'text.disabled', mt: 0.25, flexShrink: 0 }}>
            <DragIndicator fontSize="small" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={500} sx={{ mb: 0.75, lineHeight: 1.4 }}>
              {story.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
              <Chip
                label={typeConf.label}
                size="small"
                sx={{ height: 18, fontSize: '0.6rem', bgcolor: typeConf.bg, color: typeConf.text, fontWeight: 600 }}
              />
              {story.labels.slice(0, 2).map((lbl) => (
                <Chip key={lbl} label={lbl} size="small" sx={{ height: 16, fontSize: '0.55rem' }} />
              ))}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            <Chip
              label={`${story.storyPoints} pts`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
            />
            {onAddToSprint && (
              <Tooltip title="Add to Sprint">
                <IconButton
                  size="small"
                  className="add-btn"
                  onClick={() => onAddToSprint(story)}
                  sx={{ p: 0.5 }}
                >
                  <ArrowForward fontSize="small" color="primary" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
};

interface BacklogPanelProps {
  stories?: BacklogStory[];
  onAddToSprint?: (story: BacklogStory) => void;
  onDragEnd?: (event: DragEndEvent) => void;
}

const BacklogPanel: React.FC<BacklogPanelProps> = ({
  stories = [],
  onAddToSprint,
  onDragEnd,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const filtered = useMemo(() => {
    return stories.filter((s) => {
      const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || s.type === typeFilter;
      const matchPriority = priorityFilter === 'all' || s.priority === priorityFilter;
      return matchSearch && matchType && matchPriority;
    });
  }, [stories, search, typeFilter, priorityFilter]);

  const totalPoints = filtered.reduce((sum, s) => sum + s.storyPoints, 0);
  const activeStory = activeId ? stories.find((s) => s.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    onDragEnd?.(event);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Product Backlog
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label={`${filtered.length} items`} size="small" />
            <Chip label={`${totalPoints} pts`} size="small" color="primary" variant="outlined" />
          </Box>
        </Box>

        <TextField
          size="small"
          placeholder="Search backlog..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1 }}
        />

        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <InputLabel>Type</InputLabel>
            <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)}>
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="feature">Feature</MenuItem>
              <MenuItem value="bug">Bug</MenuItem>
              <MenuItem value="chore">Chore</MenuItem>
              <MenuItem value="spike">Spike</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ flex: 1 }}>
            <InputLabel>Priority</InputLabel>
            <Select value={priorityFilter} label="Priority" onChange={(e) => setPriorityFilter(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Story List */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <AnimatePresence>
            {filtered.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                <FilterList sx={{ fontSize: 36, mb: 1, opacity: 0.4 }} />
                <Typography variant="body2">No stories match your filters</Typography>
              </Box>
            ) : (
              filtered.map((story) => (
                <DraggableStoryCard
                  key={story.id}
                  story={story}
                  onAddToSprint={onAddToSprint}
                />
              ))
            )}
          </AnimatePresence>

          <DragOverlay>
            {activeStory && (
              <Paper
                elevation={8}
                sx={{ p: 1.5, borderRadius: 1.5, minWidth: 220, borderLeft: `3px solid ${PRIORITY_COLORS[activeStory.priority]}` }}
              >
                <Typography variant="body2" fontWeight={500}>{activeStory.title}</Typography>
                <Chip
                  label={`${activeStory.storyPoints} pts`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ mt: 0.5, height: 18, fontSize: '0.6rem' }}
                />
              </Paper>
            )}
          </DragOverlay>
        </DndContext>
      </Box>

      {/* Footer */}
      <Divider />
      <Box sx={{ p: 1.5 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Add />}
          size="small"
          sx={{ borderRadius: 1.5 }}
        >
          Add Story to Backlog
        </Button>
      </Box>
    </Box>
  );
};

export default BacklogPanel;
