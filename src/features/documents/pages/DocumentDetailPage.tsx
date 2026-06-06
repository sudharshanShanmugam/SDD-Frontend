import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { documentsApi } from '@/api';
import {
  Box,
  Grid,
  Typography,
  Tabs,
  Tab,
  Chip,
  Button,
  CircularProgress,
  Paper,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { AutoAwesome, GridView, TextSnippet, ArrowBack } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DocumentViewer from '../components/DocumentViewer';
import ChunkViewer, { DocumentChunk } from '../components/ChunkViewer';
import ProcessingStatus, { ProcessingStepStatus } from '../components/ProcessingStatus';

interface DocumentDetail {
  id: string;
  name: string;
  mimeType: string;
  url: string;
  pageCount: number;
  chunkCount: number;
  requirementCount: number;
  status: 'processing' | 'done' | 'error';
  createdAt: string;
  processingSteps: ProcessingStepStatus[];
}

const DocumentDetailPage: React.FC = () => {
  const { projectId, documentId } = useParams<{ projectId: string; documentId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedChunkId, setSelectedChunkId] = useState<string | undefined>();

  const { data: doc, isLoading: loading } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => documentsApi.get(documentId!),
    enabled: !!documentId,
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!doc) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Document not found.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ mb: 2 }}>
          <Breadcrumbs sx={{ mb: 1 }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate(`/projects/${projectId}/documents`)}
              underline="hover"
            >
              Documents
            </Link>
            <Typography variant="body2" color="text.primary">
              {doc.name}
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Button
                variant="text"
                startIcon={<ArrowBack />}
                onClick={() => navigate(-1)}
                size="small"
              />
              <Typography variant="h5" fontWeight={700}>
                {doc.name}
              </Typography>
              <Chip
                label={doc.status}
                size="small"
                color={doc.status === 'done' ? 'success' : doc.status === 'error' ? 'error' : 'primary'}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip icon={<GridView fontSize="small" />} label={`${doc.pageCount} pages`} size="small" variant="outlined" />
              <Chip icon={<TextSnippet fontSize="small" />} label={`${doc.chunkCount} chunks`} size="small" variant="outlined" />
              <Chip
                icon={<AutoAwesome fontSize="small" />}
                label={`${doc.requirementCount} requirements`}
                size="small"
                color="secondary"
              />
            </Box>
          </Box>
        </Box>
      </motion.div>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Document Viewer" />
          <Tab label="Chunks" />
          <Tab label="Processing Log" />
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 0 && (
          <Grid container spacing={2} sx={{ height: '100%' }}>
            <Grid item xs={12} md={8} sx={{ height: '100%' }}>
              <DocumentViewer
                documentUrl={doc.url}
                mimeType={doc.mimeType}
                fileName={doc.name}
                pageCount={doc.pageCount}
              />
            </Grid>
            <Grid item xs={12} md={4} sx={{ height: '100%', overflowY: 'auto' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <ProcessingStatus steps={doc.processingSteps} />
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Quick Stats
                  </Typography>
                  {[
                    { label: 'Functional Requirements', value: '—' },
                    { label: 'Non-Functional', value: '—' },
                    { label: 'Constraints', value: '—' },
                  ].map((stat) => (
                    <Box key={stat.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                      <Typography variant="body2" fontWeight={600}>{stat.value}</Typography>
                    </Box>
                  ))}
                  <Button
                    variant="contained"
                    fullWidth
                    size="small"
                    sx={{ mt: 2, borderRadius: 2 }}
                    startIcon={<AutoAwesome />}
                    onClick={() => navigate(`/project/${projectId}/requirements`)}
                  >
                    View All Requirements
                  </Button>
                </Paper>
              </Box>
            </Grid>
          </Grid>
        )}

        {activeTab === 1 && (
          <ChunkViewer
            chunks={[]}
            selectedChunkId={selectedChunkId}
            onChunkSelect={(chunk) => setSelectedChunkId(chunk.id)}
          />
        )}

        {activeTab === 2 && (
          <ProcessingStatus steps={doc.processingSteps} />
        )}
      </Box>
    </Box>
  );
};

export default DocumentDetailPage;
