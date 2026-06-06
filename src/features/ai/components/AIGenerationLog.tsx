import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  List,
  ListItem,
  Divider,
  TextField,
  InputAdornment,
  Collapse,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Search, ExpandMore, ExpandLess, AutoAwesome, ContentCopy } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';

export interface GenerationLogEntry {
  id: string;
  type: 'requirement_extraction' | 'epic_generation' | 'story_generation' | 'test_generation' | 'task_decomposition';
  prompt: string;
  output: string;
  model: string;
  tokensUsed: number;
  promptTokens: number;
  completionTokens: number;
  processingTime: number;
  confidence: number;
  status: 'success' | 'failed' | 'partial';
  itemsGenerated?: number;
  timestamp: string;
}

const typeLabels: Record<GenerationLogEntry['type'], string> = {
  requirement_extraction: 'Req Extraction',
  epic_generation: 'Epic Gen',
  story_generation: 'Story Gen',
  test_generation: 'Test Gen',
  task_decomposition: 'Task Decomp',
};

const LogItem: React.FC<{ entry: GenerationLogEntry }> = ({ entry }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState<'prompt' | 'output' | null>(null);

  const handleCopy = (text: string, type: 'prompt' | 'output') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <ListItem disablePadding sx={{ display: 'block', px: 1.5, py: 1 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            cursor: 'pointer',
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <AutoAwesome sx={{ fontSize: 16, color: 'secondary.main' }} />
            <Chip label={typeLabels[entry.type]} size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
            <Chip label={entry.model} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
            <Chip
              label={entry.status}
              size="small"
              color={entry.status === 'success' ? 'success' : entry.status === 'failed' ? 'error' : 'warning'}
              sx={{ height: 20, fontSize: '0.65rem' }}
            />
            {entry.itemsGenerated !== undefined && entry.itemsGenerated > 0 && (
              <Typography variant="caption" color="text.secondary">
                {entry.itemsGenerated} items
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <Typography variant="caption" color="text.disabled">
              {entry.tokensUsed.toLocaleString()} tokens
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {entry.processingTime.toFixed(1)}s
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
            </Typography>
            <IconButton size="small">
              {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </IconButton>
          </Box>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary">PROMPT</Typography>
                <Tooltip title={copied === 'prompt' ? 'Copied!' : 'Copy prompt'}>
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleCopy(entry.prompt, 'prompt'); }}>
                    <ContentCopy sx={{ fontSize: 12 }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box
                sx={{
                  bgcolor: '#f8fafc',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  maxHeight: 120,
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {entry.prompt}
              </Box>
            </Box>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary">OUTPUT</Typography>
                <Tooltip title={copied === 'output' ? 'Copied!' : 'Copy output'}>
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleCopy(entry.output, 'output'); }}>
                    <ContentCopy sx={{ fontSize: 12 }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box
                sx={{
                  bgcolor: '#1e1e1e',
                  borderRadius: 1,
                  p: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: '#d4d4d4',
                  maxHeight: 150,
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {entry.output}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.disabled">Prompt tokens: {entry.promptTokens.toLocaleString()}</Typography>
              <Typography variant="caption" color="text.disabled">Completion tokens: {entry.completionTokens.toLocaleString()}</Typography>
              <Typography variant="caption" color={entry.confidence >= 0.9 ? 'success.main' : 'warning.main'}>
                Confidence: {Math.round(entry.confidence * 100)}%
              </Typography>
              <Typography variant="caption" color="text.disabled">
                {format(new Date(entry.timestamp), 'MMM d, HH:mm:ss')}
              </Typography>
            </Box>
          </Box>
        </Collapse>
      </ListItem>
    </motion.div>
  );
};

interface AIGenerationLogProps {
  entries?: GenerationLogEntry[];
}

const AIGenerationLog: React.FC<AIGenerationLogProps> = ({ entries = [] }) => {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() =>
    entries.filter((e) =>
      !search || e.type.includes(search.toLowerCase()) || e.model.includes(search.toLowerCase())
    ),
    [entries, search]
  );

  const totalTokens = entries.reduce((a, e) => a + e.tokensUsed, 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2" fontWeight={600}>
          Generation Log ({entries.length} runs)
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            icon={<AutoAwesome sx={{ fontSize: '12px !important' }} />}
            label={`${totalTokens.toLocaleString()} total tokens`}
            size="small"
            color="secondary"
            sx={{ height: 20, fontSize: '0.65rem' }}
          />
          <TextField
            placeholder="Filter logs..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 180 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            }}
          />
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <List disablePadding>
          <AnimatePresence>
            {filtered.map((entry, i) => (
              <React.Fragment key={entry.id}>
                <LogItem entry={entry} />
                {i < filtered.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No log entries match your filter</Typography>
            </Box>
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default AIGenerationLog;
