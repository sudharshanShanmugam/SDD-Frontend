import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Collapse,
  Tooltip,
  Divider,
  Badge,
} from '@mui/material';
import {
  Search,
  ExpandMore,
  ExpandLess,
  ContentCopy,
  AutoAwesome,
  DataObject,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

export interface DocumentChunk {
  id: string;
  chunkIndex: number;
  content: string;
  pageNumber?: number;
  tokenCount: number;
  embeddingId?: string;
  requirementCount?: number;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

interface ChunkViewerProps {
  chunks: DocumentChunk[];
  highlightTerms?: string[];
  onChunkSelect?: (chunk: DocumentChunk) => void;
  selectedChunkId?: string;
}

function highlightText(text: string, terms: string[]): React.ReactNode {
  if (!terms.length) return text;
  const pattern = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    pattern.test(part) ? (
      <mark key={i} style={{ backgroundColor: '#fef08a', borderRadius: 2 }}>
        {part}
      </mark>
    ) : (
      part
    )
  );
}

const ChunkItem: React.FC<{
  chunk: DocumentChunk;
  isSelected: boolean;
  onSelect: () => void;
  highlightTerms: string[];
  onCopy: (text: string) => void;
}> = ({ chunk, isSelected, onSelect, highlightTerms, onCopy }) => {
  const [expanded, setExpanded] = useState(false);
  const preview = chunk.content.slice(0, 200);
  const hasMore = chunk.content.length > 200;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 2,
          cursor: 'pointer',
          borderColor: isSelected ? 'primary.main' : 'divider',
          borderWidth: isSelected ? 2 : 1,
          bgcolor: isSelected ? 'primary.main' + '08' : 'background.paper',
          transition: 'all 0.15s ease',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'primary.main' + '05',
          },
        }}
        onClick={onSelect}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`#${chunk.chunkIndex + 1}`}
              size="small"
              color={isSelected ? 'primary' : 'default'}
              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
            />
            {chunk.pageNumber && (
              <Typography variant="caption" color="text.secondary">
                Page {chunk.pageNumber}
              </Typography>
            )}
            <Typography variant="caption" color="text.disabled">
              {chunk.tokenCount} tokens
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {chunk.requirementCount !== undefined && chunk.requirementCount > 0 && (
              <Tooltip title={`${chunk.requirementCount} requirements extracted`}>
                <Badge badgeContent={chunk.requirementCount} color="secondary" max={99}>
                  <AutoAwesome sx={{ fontSize: 16, color: 'secondary.main' }} />
                </Badge>
              </Tooltip>
            )}
            {chunk.confidence !== undefined && (
              <Chip
                label={`${Math.round(chunk.confidence * 100)}%`}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  bgcolor:
                    chunk.confidence >= 0.9
                      ? '#dcfce7'
                      : chunk.confidence >= 0.7
                      ? '#fef9c3'
                      : '#fee2e2',
                  color:
                    chunk.confidence >= 0.9
                      ? '#166534'
                      : chunk.confidence >= 0.7
                      ? '#854d0e'
                      : '#991b1b',
                }}
              />
            )}
            <Tooltip title="Copy chunk">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy(chunk.content);
                }}
              >
                <ContentCopy sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
            {hasMore && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
              >
                {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
              </IconButton>
            )}
          </Box>
        </Box>

        <Typography
          variant="body2"
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            lineHeight: 1.6,
            color: 'text.secondary',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {highlightText(expanded ? chunk.content : preview + (hasMore && !expanded ? '…' : ''), highlightTerms)}
        </Typography>

        {chunk.metadata && expanded && (
          <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <DataObject sx={{ fontSize: 14, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.disabled">
                Metadata
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>
              {JSON.stringify(chunk.metadata, null, 2)}
            </Typography>
          </Box>
        )}
      </Paper>
    </motion.div>
  );
};

const ChunkViewer: React.FC<ChunkViewerProps> = ({
  chunks = [],
  highlightTerms = [],
  onChunkSelect,
  selectedChunkId,
}) => {
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const terms = [...highlightTerms, ...(search ? [search] : [])];

  const filtered = search
    ? chunks.filter((c) => c.content.toLowerCase().includes(search.toLowerCase()))
    : chunks;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2" fontWeight={600}>
          Document Chunks ({filtered.length})
        </Typography>
        <TextField
          placeholder="Search chunks..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 220 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          pr: 0.5,
        }}
      >
        <AnimatePresence>
          {filtered.map((chunk) => (
            <ChunkItem
              key={chunk.id}
              chunk={chunk}
              isSelected={chunk.id === selectedChunkId}
              onSelect={() => onChunkSelect?.(chunk)}
              highlightTerms={terms}
              onCopy={handleCopy}
            />
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No chunks match your search
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ChunkViewer;
