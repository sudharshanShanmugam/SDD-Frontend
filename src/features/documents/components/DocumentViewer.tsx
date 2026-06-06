import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Toolbar,
  Tooltip,
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  NavigateBefore,
  NavigateNext,
  Download,
  Fullscreen,
  RotateRight,
} from '@mui/icons-material';

export interface DocumentViewerProps {
  documentUrl: string;
  mimeType: string;
  fileName: string;
  pageCount?: number;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentUrl,
  mimeType,
  fileName,
  pageCount = 1,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPdf = mimeType === 'application/pdf';
  const isDocx = mimeType.includes('wordprocessingml');

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50));
  const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(pageCount, p + 1));

  const viewerUrl = isPdf
    ? `${documentUrl}#page=${currentPage}&zoom=${zoom}`
    : isDocx
    ? `https://docs.google.com/gview?url=${encodeURIComponent(documentUrl)}&embedded=true`
    : documentUrl;

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
        sx={{
          bgcolor: 'action.hover',
          borderBottom: '1px solid',
          borderColor: 'divider',
          gap: 0.5,
          minHeight: 48,
        }}
      >
        <Chip label={fileName} size="small" sx={{ maxWidth: 200 }} />
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {isPdf && (
          <>
            <Tooltip title="Previous page">
              <span>
                <IconButton size="small" onClick={handlePrevPage} disabled={currentPage <= 1}>
                  <NavigateBefore fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Typography variant="caption" sx={{ minWidth: 60, textAlign: 'center' }}>
              {currentPage} / {pageCount}
            </Typography>
            <Tooltip title="Next page">
              <span>
                <IconButton
                  size="small"
                  onClick={handleNextPage}
                  disabled={currentPage >= pageCount}
                >
                  <NavigateNext fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          </>
        )}

        <Tooltip title="Zoom out">
          <span>
            <IconButton size="small" onClick={handleZoomOut} disabled={zoom <= 50}>
              <ZoomOut fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'center' }}>
          {zoom}%
        </Typography>
        <Tooltip title="Zoom in">
          <span>
            <IconButton size="small" onClick={handleZoomIn} disabled={zoom >= 200}>
              <ZoomIn fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Box sx={{ flex: 1 }} />

        <Tooltip title="Download">
          <IconButton size="small" component="a" href={documentUrl} download={fileName}>
            <Download fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Fullscreen">
          <IconButton
            size="small"
            onClick={() => window.open(documentUrl, '_blank')}
          >
            <Fullscreen fontSize="small" />
          </IconButton>
        </Tooltip>
      </Toolbar>

      {/* Viewer Body */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden', bgcolor: '#525659' }}>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.paper',
              zIndex: 1,
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={40} sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Loading document...
              </Typography>
            </Box>
          </Box>
        )}

        {error ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : (
          <iframe
            src={viewerUrl}
            title={fileName}
            width="100%"
            height="100%"
            style={{
              border: 'none',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              minHeight: '100%',
            }}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError('Failed to load document. Try downloading it instead.');
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default DocumentViewer;
