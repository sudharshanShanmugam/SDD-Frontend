import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { epicsApi } from '@/api';
import EpicCard, { Epic, EpicStatus } from './EpicCard';

const COLUMNS: { id: EpicStatus; label: string; color: string; description: string }[] = [
  { id: 'backlog',     label: 'Backlog',      color: '#94a3b8', description: 'Not yet started' },
  { id: 'in_progress', label: 'In Progress',  color: '#3b82f6', description: 'Actively being worked on' },
  { id: 'review',      label: 'In Review',    color: '#f59e0b', description: 'Awaiting sign-off' },
  { id: 'done',        label: 'Completed',    color: '#10b981', description: 'Delivered & closed' },
];


interface KanbanColumnProps {
  column: { id: EpicStatus; label: string; color: string; description: string };
  epics: Epic[];
  onEdit?: (epic: Epic) => void;
  onDelete?: (id: string) => void;
  onView?: (epic: Epic) => void;
  onAddEpic?: (status: EpicStatus) => void;
}

const SortableEpicCard: React.FC<{
  epic: Epic;
  onEdit?: (e: Epic) => void;
  onDelete?: (id: string) => void;
  onView?: (e: Epic) => void;
}> = ({ epic, onEdit, onDelete, onView }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: epic.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <EpicCard
        epic={epic}
        {...(onEdit   ? { onEdit }   : {})}
        {...(onDelete ? { onDelete } : {})}
        {...(onView   ? { onView }   : {})}
        isDragging={isDragging}
      />
    </div>
  );
};

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  epics,
  onEdit,
  onDelete,
  onView,
  onAddEpic,
}) => {
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <Box
      sx={{
        flex: '0 0 300px',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        height: '100%',   // inherit height from the row (no magic numbers)
        minHeight: 300,
      }}
    >
      {/* Column header */}
      <Box
        sx={{
          px: 2,
          py: 1.25,
          borderBottom: `3px solid ${column.color}`,
          bgcolor: column.color + '12',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Colored dot */}
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: column.color, flexShrink: 0 }} />
            <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.82rem', letterSpacing: 0.3 }}>
              {column.label}
            </Typography>
            {/* Count badge */}
            <Box
              sx={{
                px: 0.9, py: 0.1,
                borderRadius: 1,
                bgcolor: column.color + '28',
                minWidth: 22,
                textAlign: 'center',
              }}
            >
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: column.color, lineHeight: 1.6 }}>
                {epics.length}
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Add epic to this stage">
            <IconButton size="small" sx={{ p: 0.25 }} onClick={() => onAddEpic?.(column.id)}>
              <Add sx={{ fontSize: 16, color: 'text.disabled' }} />
            </IconButton>
          </Tooltip>
        </Box>
        {/* Stage description */}
        <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.disabled', pl: 2.25 }}>
          {column.description}
        </Typography>
      </Box>

      <SortableContext items={epics.map((e) => e.id)} strategy={verticalListSortingStrategy}>
        <Box
          ref={setNodeRef}
          sx={{
            flex: 1,
            p: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            overflowY: 'auto',
            // Custom scrollbar styling for cards list
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-track': { borderRadius: 2, bgcolor: 'action.hover' },
            '&::-webkit-scrollbar-thumb': { borderRadius: 2, bgcolor: 'divider' },
          }}
        >
          {epics.map((epic) => (
            <SortableEpicCard
              key={epic.id}
              epic={epic}
              {...(onEdit   ? { onEdit }   : {})}
              {...(onDelete ? { onDelete } : {})}
              {...(onView   ? { onView }   : {})}
            />
          ))}
          {epics.length === 0 && (
            <Box
              sx={{
                py: 5,
                textAlign: 'center',
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                opacity: 0.5,
              }}
            >
              <Typography variant="caption" color="text.disabled" display="block">
                No epics here
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', mt: 0.5 }}>
                Drag cards or click +
              </Typography>
            </Box>
          )}
        </Box>
      </SortableContext>
    </Box>
  );
};

interface EpicKanbanProps {
  onEpicEdit?: (epic: Epic) => void;
  onEpicView?: (epic: Epic) => void;
  onAddEpic?: (status: EpicStatus) => void;
}

const EpicKanban: React.FC<EpicKanbanProps> = ({ onEpicEdit, onEpicView, onAddEpic }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const [activeEpic, setActiveEpic] = useState<Epic | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['epics', projectId],
    queryFn: () => epicsApi.list(projectId!),
    enabled: !!projectId,
  });
  const epics: Epic[] = (data?.data ?? []) as unknown as Epic[];

  const patchMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Epic> }) =>
      epicsApi.patch(id, updates as never),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['epics', projectId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => epicsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['epics', projectId] }),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const getEpicsByStatus = (status: EpicStatus) => epics.filter((e) => e.status === status);

  const handleDragStart = ({ active }: DragStartEvent) => {
    const epic = epics.find((e) => e.id === active.id);
    setActiveEpic(epic || null);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveEpic(null);
    if (!over) return;

    const activeEpicId = active.id as string;
    const overStatus = COLUMNS.find((c) => c.id === over.id)?.id;
    const overEpic = epics.find((e) => e.id === over.id);
    const targetStatus = overStatus || overEpic?.status;

    if (!targetStatus) return;

    const draggedEpic = epics.find((e) => e.id === activeEpicId);
    if (draggedEpic && draggedEpic.status !== targetStatus) {
      patchMutation.mutate({ id: activeEpicId, updates: { status: targetStatus } });
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      // height: 100% so the DndContext wrapper fills the parent
    >
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          height: '100%',       // fill the parent wrapper
          overflowX: 'auto',    // scroll horizontally when columns overflow
          overflowY: 'hidden',  // no vertical scroll on the row itself
          pb: 1,
          px: 0.5,
          '&::-webkit-scrollbar': { height: 8 },
          '&::-webkit-scrollbar-track': { borderRadius: 4, bgcolor: 'action.hover' },
          '&::-webkit-scrollbar-thumb': { borderRadius: 4, bgcolor: 'primary.light' },
        }}
      >
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            epics={getEpicsByStatus(column.id)}
            {...(onEpicEdit ? { onEdit: onEpicEdit } : {})}
            onDelete={handleDelete}
            {...(onEpicView ? { onView: onEpicView } : {})}
            {...(onAddEpic  ? { onAddEpic } : {})}
          />
        ))}
      </Box>

      <DragOverlay>
        {activeEpic && <EpicCard epic={activeEpic} isDragging />}
      </DragOverlay>
    </DndContext>
  );
};

export default EpicKanban;
