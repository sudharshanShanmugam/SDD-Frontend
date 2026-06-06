import React, { memo, type CSSProperties, type ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Box } from '@mui/material'
import { GripVertical } from 'lucide-react'

interface SortableItemProps {
  id:               string | number
  children:         ReactNode
  disabled?:        boolean
  showHandle?:      boolean
  handlePosition?:  'left' | 'right'
  className?:       string
  style?:           CSSProperties
}

export const SortableItem = memo<SortableItemProps>(
  ({
    id,
    children,
    disabled = false,
    showHandle = true,
    handlePosition = 'left',
    className,
    style,
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id, disabled })

    const itemStyle: CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity:   isDragging ? 0.5 : 1,
      ...style,
    }

    const handleEl = showHandle ? (
      <Box
        {...listeners}
        {...attributes}
        sx={{
          display:    'flex',
          alignItems: 'center',
          cursor:     disabled ? 'not-allowed' : 'grab',
          color:      'text.disabled',
          px:         0.5,
          '&:active': { cursor: 'grabbing' },
          '&:hover':  { color: 'text.secondary' },
          flexShrink: 0,
        }}
        aria-label="Drag handle"
      >
        <GripVertical size={16} />
      </Box>
    ) : null

    return (
      <Box
        ref={setNodeRef}
        style={itemStyle}
        className={className}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          position: 'relative',
          flexDirection: handlePosition === 'right' ? 'row-reverse' : 'row',
        }}
      >
        {handleEl}
        <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
      </Box>
    )
  },
)

SortableItem.displayName = 'SortableItem'
