import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material'
import { FileText, Hash, Layers, Search, ZapIcon, CheckSquare, GitBranch } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '@/store'
import { searchApi, type SearchResult } from '@/api/search'
import { useDebounce } from '@/hooks/useDebounce'

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  project:     <GitBranch size={16} />,
  document:    <FileText size={16} />,
  requirement: <Hash size={16} />,
  epic:        <Layers size={16} />,
  story:       <ZapIcon size={16} />,
  task:        <CheckSquare size={16} />,
}

export const GlobalSearchDialog = memo(() => {
  const navigate          = useNavigate()
  const isOpen            = useUIStore((s) => s.globalSearchOpen)
  const setOpen           = useUIStore((s) => s.setGlobalSearchOpen)

  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebounce(query, 250)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setResults([])
    }
  }, [isOpen])

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      return
    }
    let cancelled = false
    setIsLoading(true)
    searchApi
      .global(debouncedQuery, { limit: 10 })
      .then((res) => {
        if (!cancelled) setResults(res.results)
      })
      .catch(() => {
        if (!cancelled) setResults([])
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [debouncedQuery])

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setOpen(false)
      navigate(result.url)
    },
    [navigate, setOpen],
  )

  return (
    <Dialog
      open={isOpen}
      onClose={() => setOpen(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          mt: '80px',
          verticalAlign: 'top',
          maxHeight: 'calc(100vh - 160px)',
        },
      }}
      slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)' } } }}
    >
      <DialogContent sx={{ p: 0 }}>
        <TextField
          inputRef={inputRef}
          fullWidth
          placeholder="Search anything..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {isLoading
                  ? <CircularProgress size={16} />
                  : <Search size={18} />
                }
              </InputAdornment>
            ),
            sx: {
              borderRadius: 0,
              '& fieldset': { border: 'none' },
              borderBottom: '1px solid',
              borderColor: 'divider',
              px: 2,
            },
          }}
          sx={{ '& .MuiInputBase-input': { py: 1.75, fontSize: '1rem' } }}
        />

        {results.length > 0 ? (
          <List dense sx={{ py: 1 }}>
            {results.map((result) => (
              <React.Fragment key={result.id}>
                <ListItemButton
                  onClick={() => handleSelect(result)}
                  sx={{ px: 2, py: 1 }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: 'primary.main' }}>
                    {ENTITY_ICONS[result.type] ?? <Search size={16} />}
                  </ListItemIcon>
                  <ListItemText
                    primary={result.title}
                    secondary={result.projectName ?? result.description}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                    secondaryTypographyProps={{ variant: 'caption', noWrap: true }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      px: 1,
                      py: 0.25,
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                      textTransform: 'capitalize',
                      color: 'text.secondary',
                      fontWeight: 500,
                    }}
                  >
                    {result.type}
                  </Typography>
                </ListItemButton>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        ) : query && !isLoading ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No results for &ldquo;{query}&rdquo;
            </Typography>
          </Box>
        ) : (
          <Box sx={{ py: 4, px: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quick shortcuts
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
})

GlobalSearchDialog.displayName = 'GlobalSearchDialog'
