import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  LinearProgress,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Alert,
} from '@mui/material';
import {
  CloudUpload,
  PictureAsPdf,
  Description,
  TableChart,
  Slideshow,
  Close,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'queued' | 'uploading' | 'processing' | 'done' | 'error';
  error?: string;
  documentId?: string;
}

interface UploadZoneProps {
  onFilesAdded: (files: File[]) => void;
  uploadQueue: UploadFile[];
  onRemove: (id: string) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

const FILE_ICONS: Record<string, React.ReactNode> = {
  'application/pdf': <PictureAsPdf color="error" />,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': <Description color="primary" />,
  'application/msword': <Description color="primary" />,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': <Slideshow color="warning" />,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': <TableChart color="success" />,
  'text/plain': <Description color="action" />,
};

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/plain': ['.txt'],
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const statusColor = (status: UploadFile['status']) => {
  switch (status) {
    case 'done': return 'success';
    case 'error': return 'error';
    case 'uploading':
    case 'processing': return 'primary';
    default: return 'default';
  }
};

const UploadZone: React.FC<UploadZoneProps> = ({
  onFilesAdded,
  uploadQueue,
  onRemove,
  maxFiles = 20,
  maxSizeMB = 50,
}) => {
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([]);

  const onDrop = useCallback(
    (accepted: File[], rejected: { file: File; errors: { code: string; message: string }[] }[]) => {
      setRejectedFiles([]);
      if (rejected.length > 0) {
        setRejectedFiles(rejected.map((r) => `${r.file.name}: ${r.errors[0].message}`));
      }
      if (accepted.length > 0) {
        onFilesAdded(accepted);
      }
    },
    [onFilesAdded]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: maxSizeMB * 1024 * 1024,
    maxFiles,
  });

  return (
    <Box>
      <motion.div
        animate={{
          scale: isDragActive ? 1.02 : 1,
          transition: { duration: 0.15 },
        }}
      >
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed',
            borderColor: isDragReject
              ? 'error.main'
              : isDragActive
              ? 'primary.main'
              : 'divider',
            borderRadius: 3,
            p: { xs: 4, md: 6 },
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: isDragActive ? 'primary.main' + '0d' : 'background.default',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'primary.main' + '08',
            },
          }}
        >
          <input {...getInputProps()} />
          <motion.div
            animate={{ y: isDragActive ? -8 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <CloudUpload
              sx={{
                fontSize: 56,
                color: isDragActive ? 'primary.main' : 'text.disabled',
                mb: 2,
                transition: 'color 0.2s',
              }}
            />
          </motion.div>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {isDragActive ? 'Drop files here' : 'Drag & drop documents'}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            or click to browse your files
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['.pdf', '.docx', '.doc', '.pptx', '.xlsx', '.txt'].map((ext) => (
              <Chip key={ext} label={ext} size="small" variant="outlined" />
            ))}
          </Box>
          <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
            Max {maxFiles} files • Max {maxSizeMB} MB each
          </Typography>
        </Box>
      </motion.div>

      {rejectedFiles.length > 0 && (
        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }} onClose={() => setRejectedFiles([])}>
          {rejectedFiles.map((msg, i) => (
            <div key={i}>{msg}</div>
          ))}
        </Alert>
      )}

      {uploadQueue.length > 0 && (
        <Paper
          variant="outlined"
          sx={{ mt: 2, borderRadius: 2, overflow: 'hidden' }}
        >
          <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover' }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary">
              UPLOAD QUEUE ({uploadQueue.length} files)
            </Typography>
          </Box>
          <List dense disablePadding>
            <AnimatePresence>
              {uploadQueue.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <ListItem
                    secondaryAction={
                      item.status === 'done' ? (
                        <CheckCircle color="success" fontSize="small" />
                      ) : item.status === 'error' ? (
                        <ErrorIcon color="error" fontSize="small" />
                      ) : (
                        <IconButton size="small" onClick={() => onRemove(item.id)}>
                          <Close fontSize="small" />
                        </IconButton>
                      )
                    }
                    sx={{ py: 1.5 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {FILE_ICONS[item.file.type] || <Description />}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                            {item.file.name}
                          </Typography>
                          <Chip
                            label={item.status}
                            size="small"
                            color={statusColor(item.status) as 'success' | 'error' | 'primary' | 'default'}
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {formatSize(item.file.size)}
                          </Typography>
                          {(item.status === 'uploading' || item.status === 'processing') && (
                            <LinearProgress
                              variant="determinate"
                              value={item.progress}
                              sx={{ mt: 0.5, borderRadius: 1, height: 4 }}
                            />
                          )}
                          {item.error && (
                            <Typography variant="caption" color="error" display="block">
                              {item.error}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default UploadZone;
