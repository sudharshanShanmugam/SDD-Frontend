import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Paper,
  Avatar,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  BugReport,
  Bolt,
  Build,
  Assignment,
  FiberManualRecord,
} from '@mui/icons-material';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import type { StorySummary, StoryStatus, Priority } from '@/types';

// ─── Column definition ────────────────────────────────────────────────────

type KanbanColumnId = 'backlog' | 'ready' | 'in_progress' | 'in_review' | 'done';

const COLUMNS: Array<{ id: KanbanColumnId; label: string; color: string; storyStatus: StoryStatus }> = [
  { id: 'backlog', label: 'Backlog', color: '#94a3b8', storyStatus: 'backlog' },
  { id: 'ready', label: 'Todo', color: '#3b82f6', storyStatus: 'ready' },
  { id: 'in_progress', label: 'In Progress', color: '#f59e0b', storyStatus: 'in_progress' },
  { id: 'in_review', label: 'In Review', color: '#8b5cf6', storyStatus: 'in_review' },
  { id: 'done', label: 'Done', color: '#10b981', storyStatus: 'done' },
];

// ─── Priority config ──────────────────────────────────────────────────────

const PRIORITY_DOT: Record<Priority, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#3b82f6',
  low: '#94a3b8',
};

const TYPE_ICON: Record<StorySummary['type'], React.ReactNode> = {
  user_story: <Assignment sx={{ fontSize: 13 }} />,
  bug: <BugReport sx={{ fontSize: 13 }} />,
  spike: <Bolt sx={{ fontSize: 13 }} />,
  chore: <Build sx={{ fontSize: 13 }} />,
  task: <FiberManualRecord sx={{ fontSize: 11 }} />,
};

// ─── Story mini-card ──────────────────────────────────────────────────────

interface StoryMiniCardProps {
  story: StorySummary;
  isOverlay?: boolean;
}

const StoryMiniCard: React.FC<StoryMiniCardProps> = ({ story, isOverlay = false }) => (
  <Paper
    elevation={isOverlay ? 10 : 1}
    sx={{
      p: 1.5,
      borderRadius: 2,
      border: '1px solid',
      borderColor: isOverlay ? 'primary.main' : 'divider',
      bgcolor: 'background.paper',
      cursor: isOverlay ? 'grabbing' : 'grab',
      display: 'flex',
      flexDirection: 'column',
      gap: 0.75,
      userSelect: 'none',
      transition: 'box-shadow 0.15s',
    }}
  >
    {/* Identifier + type */}
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Box sx={{ color: 'text.disabled', display: 'flex' }}>{TYPE_ICON[story.type]}</Box>
      <Typography
        variant="caption"
        sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 600, fontSize: '0.7rem' }}
      >
        {story.identifier}
      </Typography>
      <Box
        sx={{
          ml: 'auto',
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: PRIORITY_DOT[story.priority],
          flexShrink: 0,
        }}
      />
    </Box>

    {/* Title */}
    <Typography
      variant="body2"
      sx={{
        fontSize: '0.8rem',
        lineHeight: 1.35,
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      }}
    >
      {story.title}
    </Typography>

    {/* Footer */}
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      {story.assignee ? (
        <Tooltip title={story.assignee.displayName ?? story.assignee.email}>
          <Avatar
            src={story.assignee.avatar ?? undefined}
            sx={{ width: 20, height: 20, fontSize: '0.65rem' }}
          >
            {(story.assignee.displayName ?? story.assignee.email)?.[0]?.toUpperCase()}
          </Avatar>
        </Tooltip>
      ) : (
        <Box sx={{ width: 20 }} />
      )}
      {story.storyPoints != null && (
        <Chip
          label={story.storyPoints}
          size="small"
          sx={{
            height: 18,
            minWidth: 22,
            fontSize: '0.68rem',
            fontWeight: 700,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          }}
        />
      )}
    </Box>
  </Paper>
);

// ─── Sortable story card ──────────────────────────────────────────────────

const SortableStoryCard: React.FC<{ story: StorySummary }> = ({ story }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: story.id, data: { story } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <StoryMiniCard story={story} />
    </div>
  );
};

// ─── Kanban column ────────────────────────────────────────────────────────

interface KanbanColumnProps {
  column: (typeof COLUMNS)[number];
  stories: StorySummary[];
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, stories }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const totalPoints = stories.reduce((sum, s) => sum + (s.storyPoints ?? 0), 0);

  return (
    <Box
      sx={{
        flex: '0 0 240px',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isOver ? column.color + '08' : 'background.default',
        borderRadius: 2,
        border: '1px solid',
        borderColor: isOver ? column.color + '80' : 'divider',
        overflow: 'hidden',
        minHeight: 400,
        maxHeight: 'calc(100vh - 220px)',
        transition: 'border-color 0.15s, background-color 0.15s',
      }}
    >
      {/* Column header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `3px solid ${column.color}`,
          bgcolor: column.color + '12',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {column.label}
          </Typography>
          <Chip
            label={stories.length}
            size="small"
            sx={{
              height: 18,
              minWidth: 24,
              fontSize: '0.68rem',
              bgcolor: column.color + '22',
              color: column.color,
              fontWeight: 700,
            }}
          />
        </Box>
        {totalPoints > 0 && (
          <Typography variant="caption" color="text.disabled" fontWeight={600}>
            {totalPoints} pts
          </Typography>
        )}
      </Box>

      {/* Cards */}
      <SortableContext items={stories.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <Box
          ref={setNodeRef}
          sx={{
            flex: 1,
            p: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': { borderRadius: 2, bgcolor: 'divider' },
          }}
        >
          <AnimatePresence>
            {stories.map((story) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                <SortableStoryCard story={story} />
              </motion.div>
            ))}
          </AnimatePresence>

          {stories.length === 0 && (
            <Box
              sx={{
                py: 4,
                textAlign: 'center',
                color: 'text.disabled',
                border: '2px dashed',
                borderColor: isOver ? column.color + '80' : 'divider',
                borderRadius: 2,
                transition: 'border-color 0.15s',
              }}
            >
              <Typography variant="caption">Drop stories here</Typography>
            </Box>
          )}
        </Box>
      </SortableContext>
    </Box>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────

export interface SprintKanbanProps {
  stories: StorySummary[];
  onStoryMove: (storyId: string, newStatus: StoryStatus) => void;
}

// ─── Component ────────────────────────────────────────────────────────────

const SprintKanban: React.FC<SprintKanbanProps> = ({ stories, onStoryMove }) => {
  // Guard against undefined/null in case the API response arrives before stories are populated
  const safeStories: StorySummary[] = stories ?? [];
  const [localStories, setLocalStories] = useState<StorySummary[]>(safeStories);
  const [activeStory, setActiveStory] = useState<StorySummary | null>(null);

  // Sync when prop changes
  React.useEffect(() => {
    setLocalStories(stories ?? []);
  }, [stories]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const getByStatus = (status: StoryStatus) =>
    localStories.filter((s) => s.status === status);

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveStory(localStories.find((s) => s.id === active.id) ?? null);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;

    const overCol = COLUMNS.find((c) => c.id === over.id);
    const overStory = localStories.find((s) => s.id === over.id);
    const newStatus = overCol?.storyStatus ?? overStory?.status;

    if (!newStatus) return;
    const activeStoryLocal = localStories.find((s) => s.id === active.id);
    if (!activeStoryLocal || activeStoryLocal.status === newStatus) return;

    setLocalStories((prev) =>
      prev.map((s) => (s.id === active.id ? { ...s, status: newStatus } : s)),
    );
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveStory(null);
    if (!over) return;

    const overCol = COLUMNS.find((c) => c.id === over.id);
    const overStory = localStories.find((s) => s.id === over.id);
    const newStatus = overCol?.storyStatus ?? overStory?.status;

    if (!newStatus) return;
    onStoryMove(active.id as string, newStatus);
  };

  const dragOverlayStory = activeStory
    ? { ...activeStory }
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 2,
          height: '100%',
          '&::-webkit-scrollbar': { height: 6 },
          '&::-webkit-scrollbar-thumb': { borderRadius: 3, bgcolor: 'primary.main' },
        }}
      >
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            stories={getByStatus(col.storyStatus)}
          />
        ))}
      </Box>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
        {dragOverlayStory && <StoryMiniCard story={dragOverlayStory} isOverlay />}
      </DragOverlay>
    </DndContext>
  );
};

export default SprintKanban;
