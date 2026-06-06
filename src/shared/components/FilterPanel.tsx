import React, { memo, useState, useCallback } from 'react'
import {
  Box,
  Button,
  Chip,
  Collapse,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Divider,
} from '@mui/material'
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react'
import type { FilterParam, FilterOperator, SelectOption } from '@/types'

interface FilterField {
  key:        string
  label:      string
  type:       'text' | 'select' | 'multi-select' | 'date' | 'number'
  options?:   SelectOption[]
  operators?: FilterOperator[]
}

interface FilterPanelProps {
  fields:    FilterField[]
  onFilter:  (filters: FilterParam[]) => void
  onReset:   () => void
  defaultOpen?: boolean
}

export const FilterPanel = memo<FilterPanelProps>(
  ({ fields, onFilter, onReset, defaultOpen = false }) => {
    const [isOpen,   setIsOpen]   = useState(defaultOpen)
    const [filters,  setFilters]  = useState<Record<string, string | string[]>>({})

    const activeCount = Object.values(filters).filter(
      (v) => v !== '' && v !== undefined && (Array.isArray(v) ? v.length > 0 : true),
    ).length

    const applyFilters = useCallback(() => {
      const params: FilterParam[] = Object.entries(filters)
        .filter(([, v]) => v !== '' && v !== undefined && (!Array.isArray(v) || v.length > 0))
        .map(([field, value]) => ({
          field,
          operator: Array.isArray(value) ? 'in' : 'eq' as FilterOperator,
          value:    value as string | string[],
        }))
      onFilter(params)
    }, [filters, onFilter])

    const resetFilters = useCallback(() => {
      setFilters({})
      onReset()
    }, [onReset])

    const setField = useCallback((key: string, value: string | string[]) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
    }, [])

    const removeFilter = useCallback((key: string) => {
      setFilters((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }, [])

    return (
      <Box
        sx={{
          border:       '1px solid',
          borderColor:  'divider',
          borderRadius: 2,
          bgcolor:      'background.paper',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
            cursor: 'pointer',
          }}
          onClick={() => setIsOpen((o) => !o)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Filter size={16} />
            <Typography variant="body2" fontWeight={600}>Filters</Typography>
            {activeCount > 0 && (
              <Chip
                label={activeCount}
                size="small"
                color="primary"
                sx={{ height: 18, '& .MuiChip-label': { px: 0.75, fontSize: '0.65rem' } }}
              />
            )}
          </Box>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Box>

        <Collapse in={isOpen}>
          <Divider />
          <Box
            sx={{
              p: 2,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            {fields.map((field) => {
              const currentValue = filters[field.key] ?? ''

              if (field.type === 'select' || field.type === 'multi-select') {
                return (
                  <FormControl key={field.key} size="small">
                    <InputLabel>{field.label}</InputLabel>
                    <Select
                      label={field.label}
                      value={currentValue}
                      multiple={field.type === 'multi-select'}
                      onChange={(e) => setField(field.key, e.target.value as string | string[])}
                    >
                      {field.options?.map((opt) => (
                        <MenuItem key={String(opt.value)} value={String(opt.value)}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )
              }

              return (
                <TextField
                  key={field.key}
                  size="small"
                  label={field.label}
                  type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                  value={currentValue}
                  onChange={(e) => setField(field.key, e.target.value)}
                  InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                />
              )
            })}
          </Box>

          {/* Active filter chips */}
          {activeCount > 0 && (
            <Box sx={{ px: 2, pb: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(filters)
                .filter(([, v]) => v !== '')
                .map(([key, value]) => {
                  const field = fields.find((f) => f.key === key)
                  return (
                    <Chip
                      key={key}
                      label={`${field?.label ?? key}: ${Array.isArray(value) ? value.join(', ') : value}`}
                      size="small"
                      onDelete={() => removeFilter(key)}
                      deleteIcon={<X size={12} />}
                    />
                  )
                })}
            </Box>
          )}

          <Divider />
          <Box sx={{ px: 2, py: 1.5, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button size="small" variant="text" onClick={resetFilters} disabled={activeCount === 0}>
              Reset
            </Button>
            <Button size="small" variant="contained" onClick={applyFilters}>
              Apply Filters
            </Button>
          </Box>
        </Collapse>
      </Box>
    )
  },
)

FilterPanel.displayName = 'FilterPanel'
