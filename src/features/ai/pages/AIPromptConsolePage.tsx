import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Button,
  IconButton,
  Divider,
  Paper,
  TextField,
  InputAdornment,
  Alert,
  Tooltip,
} from '@mui/material';
import { Add, Search, ContentCopy, Delete, Edit, AutoAwesome } from '@mui/icons-material';
import { motion } from 'framer-motion';
import PromptEditor, { PromptTemplate } from '../components/PromptEditor';

const defaultTemplates: PromptTemplate[] = [
  {
    id: 'req-extract-v2',
    name: 'Requirement Extraction',
    type: 'system',
    content: `You are an expert software requirements analyst.

Extract ALL requirements from the provided document text.
Output ONLY valid JSON array.

Document: {{document_section}}`,
    variables: ['document_section'],
    model: 'gpt-4o',
    temperature: 0.1,
    maxTokens: 4096,
    stage: 'requirements',
    version: 2,
  },
  {
    id: 'epic-gen-v1',
    name: 'Epic Generation',
    type: 'system',
    content: `You are a senior product manager. Group the provided requirements into coherent epics.

Requirements: {{requirements}}
Context: {{project_context}}`,
    variables: ['requirements', 'project_context'],
    model: 'gpt-4o',
    temperature: 0.3,
    maxTokens: 8192,
    stage: 'epics',
    version: 1,
  },
  {
    id: 'story-gen-v3',
    name: 'Story Generation',
    type: 'system',
    content: `You are an agile expert. Break down each epic into atomic user stories following INVEST criteria.

Epic: {{epic}}
Requirements: {{requirements}}`,
    variables: ['epic', 'requirements'],
    model: 'gpt-4o',
    temperature: 0.2,
    maxTokens: 16384,
    stage: 'stories',
    version: 3,
  },
  {
    id: 'test-gen-v1',
    name: 'Test Case Generation',
    type: 'system',
    content: `You are a QA engineer. Generate comprehensive test cases including Playwright E2E tests.

Story: {{story}}
Acceptance criteria: {{acceptance_criteria}}`,
    variables: ['story', 'acceptance_criteria'],
    model: 'gpt-4o',
    temperature: 0.1,
    maxTokens: 8192,
    stage: 'qa',
    version: 1,
  },
];

const stageColors: Record<string, string> = {
  requirements: '#6366f1',
  epics: '#3b82f6',
  stories: '#10b981',
  sprints: '#f59e0b',
  tasks: '#8b5cf6',
  qa: '#ef4444',
  release: '#06b6d4',
};

const AIPromptConsolePage: React.FC = () => {
  const [templates, setTemplates] = useState<PromptTemplate[]>(defaultTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate>(defaultTemplates[0]);
  const [search, setSearch] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = templates.filter((t) =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.stage.includes(search.toLowerCase())
  );

  const handleSave = async (updated: PromptTemplate) => {
    setTemplates((prev) => prev.map((t) => (t.id === updated.id ? { ...updated, version: updated.version + 1 } : t)));
    setSelectedTemplate({ ...updated, version: updated.version + 1 });
    setSuccess('Template saved successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleTest = async (template: PromptTemplate, testInput: string): Promise<string> => {
    // Simulate AI test call
    await new Promise((r) => setTimeout(r, 1500));
    return `[\n  {\n    "id": "REQ-001",\n    "title": "Simulated requirement from test input",\n    "type": "functional",\n    "priority": "high",\n    "confidence": 0.94\n  }\n]`;
  };

  const handleDuplicate = (template: PromptTemplate) => {
    const copy: PromptTemplate = {
      ...template,
      id: `${template.id}-copy-${Date.now()}`,
      name: `${template.name} (Copy)`,
      version: 1,
    };
    setTemplates((prev) => [...prev, copy]);
    setSelectedTemplate(copy);
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: 280,
          flexShrink: 0,
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Prompt Templates
            </Typography>
            <Tooltip title="New template">
              <IconButton size="small" onClick={() => {}}>
                <Add fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <TextField
            placeholder="Search..."
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            }}
          />
        </Box>

        <List disablePadding sx={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map((template) => (
            <ListItem key={template.id} disablePadding divider>
              <ListItemButton
                selected={selectedTemplate.id === template.id}
                onClick={() => setSelectedTemplate(template)}
                sx={{ py: 1.5 }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 160 }}>
                        {template.name}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        v{template.version}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                      <Chip
                        label={template.stage}
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: '0.6rem',
                          bgcolor: (stageColors[template.stage] || '#94a3b8') + '1a',
                          color: stageColors[template.stage] || '#94a3b8',
                        }}
                      />
                      <Chip label={template.model} size="small" sx={{ height: 16, fontSize: '0.6rem' }} />
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Main Editor */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesome color="secondary" />
            <Typography variant="h6" fontWeight={700}>
              {selectedTemplate.name}
            </Typography>
            <Chip label={`v${selectedTemplate.version}`} size="small" color="primary" />
            <Chip
              label={selectedTemplate.stage}
              size="small"
              sx={{
                bgcolor: (stageColors[selectedTemplate.stage] || '#94a3b8') + '1a',
                color: stageColors[selectedTemplate.stage] || '#94a3b8',
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<ContentCopy />}
              onClick={() => handleDuplicate(selectedTemplate)}
              sx={{ borderRadius: 2 }}
            >
              Duplicate
            </Button>
          </Box>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

          <PromptEditor
            template={selectedTemplate}
            onSave={handleSave}
            onTest={handleTest}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default AIPromptConsolePage;
