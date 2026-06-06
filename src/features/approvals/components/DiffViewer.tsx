import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Toolbar,
  Chip,
  IconButton,
  Button,
  Tooltip,
  Divider,
  Menu,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  Check,
  Close,
  Comment,
  CompareArrows,
  SwapHoriz,
  Fullscreen,
  ContentCopy,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Monaco is loaded lazily to avoid SSR / bundle size issues
let Monaco: typeof import('@monaco-editor/react').DiffEditor | null = null;

interface DiffViewerProps {
  original: string;
  modified: string;
  language?: string;
  filename?: string;
  onApprove?: () => void;
  onReject?: () => void;
  onComment?: (line: number, text: string) => void;
  readOnly?: boolean;
}

const SimpleDiff: React.FC<{ original: string; modified: string }> = ({ original, modified }) => {
  const origLines = original.split('\n');
  const modLines = modified.split('\n');
  const maxLen = Math.max(origLines.length, modLines.length);

  return (
    <Box sx={{ display: 'flex', height: '100%', fontFamily: 'monospace', fontSize: '0.8rem' }}>
      <Box sx={{ flex: 1, overflow: 'auto', borderRight: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ bgcolor: 'action.hover', px: 2, py: 0.5, position: 'sticky', top: 0 }}>
          <Typography variant="caption" fontWeight={700}>Original (AI Output)</Typography>
        </Box>
        {origLines.map((line, i) => {
          const isDiff = line !== (modLines[i] || '');
          return (
            <Box
              key={i}
              sx={{
                px: 2,
                py: 0.125,
                bgcolor: isDiff ? '#fee2e2' : undefined,
                display: 'flex',
                gap: 2,
              }}
            >
              <Typography variant="caption" sx={{ color: 'text.disabled', minWidth: 30, userSelect: 'none' }}>
                {i + 1}
              </Typography>
              <Typography variant="caption" sx={{ whiteSpace: 'pre', color: isDiff ? '#991b1b' : undefined }}>
                {line || ' '}
              </Typography>
            </Box>
          );
        })}
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Box sx={{ bgcolor: 'action.hover', px: 2, py: 0.5, position: 'sticky', top: 0 }}>
          <Typography variant="caption" fontWeight={700}>Modified (Human Edits)</Typography>
        </Box>
        {modLines.map((line, i) => {
          const isDiff = line !== (origLines[i] || '');
          return (
            <Box
              key={i}
              sx={{
                px: 2,
                py: 0.125,
                bgcolor: isDiff ? '#dcfce7' : undefined,
                display: 'flex',
                gap: 2,
              }}
            >
              <Typography variant="caption" sx={{ color: 'text.disabled', minWidth: 30, userSelect: 'none' }}>
                {i + 1}
              </Typography>
              <Typography variant="caption" sx={{ whiteSpace: 'pre', color: isDiff ? '#166534' : undefined }}>
                {line || ' '}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

const MonacoDiffWrapper: React.FC<{
  original: string;
  modified: string;
  language: string;
  readOnly?: boolean;
  onMount?: (editor: unknown) => void;
}> = ({ original, modified, language, readOnly, onMount }) => {
  const [MonacoDiff, setMonacoDiff] = React.useState<typeof import('@monaco-editor/react').DiffEditor | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    import('@monaco-editor/react')
      .then((mod) => {
        setMonacoDiff(() => mod.DiffEditor);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!MonacoDiff) {
    return <SimpleDiff original={original} modified={modified} />;
  }

  return (
    <MonacoDiff
      original={original}
      modified={modified}
      language={language}
      options={{
        readOnly,
        renderSideBySide: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 13,
        lineNumbers: 'on',
        wordWrap: 'on',
      }}
      onMount={onMount}
      theme="vs-dark"
    />
  );
};

const DiffViewer: React.FC<DiffViewerProps> = ({
  original,
  modified,
  language = 'markdown',
  filename = 'document',
  onApprove,
  onReject,
  onComment,
  readOnly = false,
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'inline'>('split');
  const [copied, setCopied] = useState(false);

  const origLines = original.split('\n').length;
  const modLines = modified.split('\n').length;
  const additions = modified.split('\n').filter((l, i) => l !== (original.split('\n')[i] || '')).length;
  const deletions = original.split('\n').filter((l, i) => l !== (modified.split('\n')[i] || '')).length;

  const handleCopy = () => {
    navigator.clipboard.writeText(modified);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      {/* Toolbar */}
      <Toolbar
        variant="dense"
        sx={{ bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider', gap: 1, minHeight: 48, flexShrink: 0 }}
      >
        <Chip label={filename} size="small" sx={{ maxWidth: 200 }} />
        <Chip
          icon={<Check sx={{ fontSize: '12px !important', color: 'success.main' }} />}
          label={`+${additions}`}
          size="small"
          sx={{ height: 20, bgcolor: '#dcfce7', color: '#166534', fontSize: '0.7rem' }}
        />
        <Chip
          icon={<Close sx={{ fontSize: '12px !important', color: 'error.main' }} />}
          label={`-${deletions}`}
          size="small"
          sx={{ height: 20, bgcolor: '#fee2e2', color: '#991b1b', fontSize: '0.7rem' }}
        />

        <Box sx={{ flex: 1 }} />

        <Tooltip title="Toggle inline/split">
          <IconButton size="small" onClick={() => setViewMode(v => v === 'split' ? 'inline' : 'split')}>
            <SwapHoriz fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={copied ? 'Copied!' : 'Copy modified'}>
          <IconButton size="small" onClick={handleCopy}>
            <ContentCopy fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem />

        {!readOnly && (
          <>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<Close fontSize="small" />}
              onClick={onReject}
              sx={{ borderRadius: 2 }}
            >
              Reject
            </Button>
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<Check fontSize="small" />}
              onClick={onApprove}
              sx={{ borderRadius: 2 }}
            >
              Approve
            </Button>
          </>
        )}
      </Toolbar>

      {/* Diff Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <MonacoDiffWrapper
          original={original}
          modified={modified}
          language={language}
          readOnly={readOnly}
        />
      </Box>

      {/* Stats bar */}
      <Box
        sx={{
          px: 2,
          py: 0.75,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          gap: 2,
          bgcolor: 'action.hover',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Original: {origLines} lines
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Modified: {modLines} lines
        </Typography>
        <Typography variant="caption" color="success.main">
          +{additions} additions
        </Typography>
        <Typography variant="caption" color="error.main">
          -{deletions} deletions
        </Typography>
      </Box>
    </Box>
  );
};

export default DiffViewer;
