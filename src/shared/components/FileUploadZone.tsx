import React, { memo, useCallback, useState } from 'react'
import { Box, Button, LinearProgress, Typography, IconButton } from '@mui/material'
import { Upload, X, FileIcon } from 'lucide-react'
import { useDropzone, type Accept } from 'react-dropzone'

interface UploadedFile {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void
  accept?: Accept
  maxFiles?: number
  maxSizeMB?: number
  multiple?: boolean
  disabled?: boolean
  label?: string
  hint?: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const FileUploadZone = memo<FileUploadZoneProps>(
  ({
    onFilesSelected,
    accept,
    maxFiles = 10,
    maxSizeMB = 50,
    multiple = true,
    disabled = false,
    label = 'Drop files here or click to upload',
    hint,
  }) => {
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

    const onDrop = useCallback(
      (acceptedFiles: File[]) => {
        const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
          id:       Math.random().toString(36).slice(2),
          file,
          progress: 0,
          status:   'pending' as const,
        }))
        setUploadedFiles((prev) => [...prev, ...newFiles])
        onFilesSelected(acceptedFiles)
      },
      [onFilesSelected],
    )

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
      onDrop,
      accept,
      maxFiles,
      maxSize: maxSizeMB * 1024 * 1024,
      multiple,
      disabled,
    })

    const removeFile = useCallback((id: string) => {
      setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
    }, [])

    return (
      <Box>
        <Box
          {...getRootProps()}
          sx={{
            border:       '2px dashed',
            borderColor:  isDragReject ? 'error.main'
              : isDragActive ? 'primary.main'
              : 'divider',
            borderRadius: 2,
            p:            3,
            textAlign:    'center',
            cursor:       disabled ? 'not-allowed' : 'pointer',
            bgcolor:      isDragActive ? 'primary.50' : 'background.subtle',
            transition:   'all 150ms ease',
            '&:hover':    disabled ? {} : {
              borderColor: 'primary.main',
              bgcolor:     'primary.50',
            },
          }}
        >
          <input {...getInputProps()} />
          <Box sx={{ mb: 1.5, color: isDragActive ? 'primary.main' : 'text.secondary' }}>
            <Upload size={32} />
          </Box>
          <Typography variant="body2" fontWeight={500}>
            {isDragReject ? 'File type not allowed' : isDragActive ? 'Drop files here' : label}
          </Typography>
          {hint && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {hint}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Max {maxFiles} files, up to {maxSizeMB}MB each
          </Typography>
          <Button
            size="small"
            variant="outlined"
            sx={{ mt: 1.5 }}
            disabled={disabled}
            onClick={(e) => e.stopPropagation()}
          >
            Browse files
          </Button>
        </Box>

        {/* File List */}
        {uploadedFiles.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {uploadedFiles.map((uf) => (
              <Box
                key={uf.id}
                sx={{
                  display:     'flex',
                  alignItems:  'center',
                  gap:         1.5,
                  p:           1.5,
                  borderRadius: 1.5,
                  border:      '1px solid',
                  borderColor: uf.status === 'error' ? 'error.light' : 'divider',
                  bgcolor:     'background.paper',
                }}
              >
                <FileIcon size={20} color="#64748B" />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={500} noWrap>
                    {uf.file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatBytes(uf.file.size)}
                  </Typography>
                  {uf.status === 'uploading' && (
                    <LinearProgress
                      variant="determinate"
                      value={uf.progress}
                      sx={{ mt: 0.5, height: 3, borderRadius: 1 }}
                    />
                  )}
                  {uf.status === 'error' && (
                    <Typography variant="caption" color="error">
                      {uf.error ?? 'Upload failed'}
                    </Typography>
                  )}
                </Box>
                <IconButton size="small" onClick={() => removeFile(uf.id)}>
                  <X size={14} />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    )
  },
)

FileUploadZone.displayName = 'FileUploadZone'
