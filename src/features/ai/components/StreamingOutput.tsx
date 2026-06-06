import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { ContentCopy, Stop, Check, AutoAwesome } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface StreamingOutputProps {
  content: string;
  isStreaming: boolean;
  onStop?: () => void;
  tokenCount?: number;
  model?: string;
  title?: string;
  language?: string;
}

const StreamingOutput: React.FC<StreamingOutputProps> = ({
  content,
  isStreaming,
  onStop,
  tokenCount,
  model,
  title = 'AI Output',
  language = 'text',
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [content, autoScroll]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isCode = language !== 'text';

  return (
    <Paper
      variant="outlined"
      sx={{ borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: isCode ? '#1e1e1e' : 'action.hover',
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isStreaming ? (
            <CircularProgress size={14} sx={{ color: isCode ? 'white' : undefined }} />
          ) : (
            <AutoAwesome sx={{ fontSize: 16, color: '#f59e0b' }} />
          )}
          <Typography
            variant="caption"
            fontWeight={600}
            sx={{ color: isCode ? 'rgba(255,255,255,0.8)' : 'text.primary' }}
          >
            {title}
          </Typography>
          {model && (
            <Chip
              label={model}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.65rem',
                bgcolor: isCode ? 'rgba(255,255,255,0.1)' : 'action.hover',
                color: isCode ? 'rgba(255,255,255,0.7)' : 'text.secondary',
              }}
            />
          )}
          {isStreaming && (
            <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
              <Chip label="Streaming..." size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
            </motion.div>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {tokenCount !== undefined && (
            <Typography
              variant="caption"
              sx={{ color: isCode ? 'rgba(255,255,255,0.5)' : 'text.disabled' }}
            >
              {tokenCount.toLocaleString()} tokens
            </Typography>
          )}
          <Tooltip title={copied ? 'Copied!' : 'Copy'}>
            <IconButton size="small" onClick={handleCopy} sx={{ color: isCode ? 'rgba(255,255,255,0.7)' : undefined }}>
              {copied ? <Check sx={{ fontSize: 16 }} /> : <ContentCopy sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>
          {isStreaming && onStop && (
            <Tooltip title="Stop generation">
              <IconButton size="small" onClick={onStop} color="error">
                <Stop sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          maxHeight: 400,
          bgcolor: isCode ? '#1e1e1e' : 'background.paper',
          p: isCode ? 2 : 1.5,
          fontFamily: isCode ? 'monospace' : 'inherit',
          fontSize: isCode ? '0.8rem' : '0.875rem',
          lineHeight: 1.7,
          color: isCode ? '#d4d4d4' : 'text.primary',
          whiteSpace: isCode ? 'pre-wrap' : 'pre-wrap',
          wordBreak: 'break-word',
        }}
        onScroll={(e) => {
          const el = e.currentTarget;
          const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
          setAutoScroll(isAtBottom);
        }}
      >
        {content}
        {isStreaming && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.6 }}
            style={{
              display: 'inline-block',
              width: 2,
              height: '1em',
              backgroundColor: isCode ? '#d4d4d4' : '#6366f1',
              marginLeft: 2,
              verticalAlign: 'text-bottom',
            }}
          />
        )}
        <div ref={bottomRef} />
      </Box>
    </Paper>
  );
};

export default StreamingOutput;
