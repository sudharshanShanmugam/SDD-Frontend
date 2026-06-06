import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Save, PlayArrow, Refresh, AutoAwesome } from '@mui/icons-material';

export interface PromptTemplate {
  id: string;
  name: string;
  type: 'system' | 'user' | 'few_shot';
  content: string;
  variables: string[];
  model: string;
  temperature: number;
  maxTokens: number;
  stage: string;
  version: number;
}

interface PromptEditorProps {
  template?: PromptTemplate;
  onSave?: (template: PromptTemplate) => Promise<void>;
  onTest?: (template: PromptTemplate, testInput: string) => Promise<string>;
  readOnly?: boolean;
}

const MonacoEditorWrapper: React.FC<{
  value: string;
  onChange?: (val: string) => void;
  language: string;
  height: number;
  readOnly?: boolean;
}> = ({ value, onChange, language, height, readOnly }) => {
  const [MonacoEditor, setMonacoEditor] = useState<typeof import('@monaco-editor/react').default | null>(null);

  useEffect(() => {
    import('@monaco-editor/react').then((mod) => setMonacoEditor(() => mod.default));
  }, []);

  if (!MonacoEditor) {
    return (
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden', height }}>
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            padding: 12,
            fontFamily: 'monospace',
            fontSize: 13,
            resize: 'none',
            outline: 'none',
            lineHeight: 1.6,
          }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
      <MonacoEditor
        height={height}
        language={language}
        value={value}
        onChange={(v) => onChange?.(v || '')}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          lineNumbers: 'on',
          theme: 'vs-dark',
        }}
      />
    </Box>
  );
};

const defaultTemplate: PromptTemplate = {
  id: 'req-extract-v2',
  name: 'Requirement Extraction v2',
  type: 'system',
  content: `You are an expert software requirements analyst with 15 years of experience.

Your task is to extract ALL requirements from the provided document text. For each requirement:
1. Assign a unique ID (REQ-XXX format)
2. Classify as: functional | non_functional | constraint | business
3. Set priority: critical | high | medium | low
4. Rate your confidence (0.0 - 1.0)
5. Identify the source location

Output ONLY valid JSON array, no explanations.

Context: {{context}}
Document section: {{document_section}}`,
  variables: ['context', 'document_section'],
  model: 'gpt-4o',
  temperature: 0.1,
  maxTokens: 4096,
  stage: 'requirements',
  version: 2,
};

const PromptEditor: React.FC<PromptEditorProps> = ({
  template = defaultTemplate,
  onSave,
  onTest,
  readOnly = false,
}) => {
  const [content, setContent] = useState(template.content);
  const [model, setModel] = useState(template.model);
  const [temperature, setTemperature] = useState(template.temperature);
  const [maxTokens, setMaxTokens] = useState(template.maxTokens);
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const variables = [...content.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
  const hasChanges = content !== template.content || model !== template.model;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave?.({ ...template, content, model, temperature, maxTokens });
      setSuccess('Template saved');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setError(null);
    try {
      const output = await onTest?.({ ...template, content, model, temperature, maxTokens }, testInput) || '// Test output will appear here';
      setTestOutput(output);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {success && <Alert severity="success">{success}</Alert>}
      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      {/* Metadata Bar */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip label={`v${template.version}`} size="small" color="primary" />
        <Chip label={template.stage} size="small" variant="outlined" />
        {variables.map((v) => (
          <Chip key={v} label={`{{${v}}}`} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#fef9c3', color: '#854d0e' }} />
        ))}
        {hasChanges && <Chip label="Unsaved changes" size="small" color="warning" />}
      </Box>

      {/* Settings Row */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Model</InputLabel>
          <Select value={model} label="Model" onChange={(e) => setModel(e.target.value)} disabled={readOnly}>
            {['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'].map((m) => (
              <MenuItem key={m} value={m}>{m}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Temperature"
          type="number"
          size="small"
          value={temperature}
          onChange={(e) => setTemperature(Number(e.target.value))}
          inputProps={{ min: 0, max: 2, step: 0.1 }}
          sx={{ width: 110 }}
          disabled={readOnly}
        />
        <TextField
          label="Max Tokens"
          type="number"
          size="small"
          value={maxTokens}
          onChange={(e) => setMaxTokens(Number(e.target.value))}
          inputProps={{ min: 100, max: 128000, step: 100 }}
          sx={{ width: 120 }}
          disabled={readOnly}
        />
        <Box sx={{ flex: 1 }} />
        {!readOnly && (
          <>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => setContent(template.content)}
              disabled={!hasChanges}
              sx={{ borderRadius: 2 }}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
              onClick={handleSave}
              disabled={saving || !hasChanges}
              sx={{ borderRadius: 2 }}
            >
              Save
            </Button>
          </>
        )}
      </Box>

      {/* Prompt Content */}
      <Box>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          PROMPT TEMPLATE
        </Typography>
        <MonacoEditorWrapper
          value={content}
          onChange={setContent}
          language="markdown"
          height={280}
          readOnly={readOnly}
        />
      </Box>

      <Divider />

      {/* Test Panel */}
      <Box>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Test Prompt
        </Typography>
        <TextField
          label="Test Input"
          multiline
          rows={3}
          fullWidth
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          placeholder="Paste a document section to test extraction..."
          sx={{ mb: 1.5 }}
        />
        <Button
          variant="outlined"
          startIcon={testing ? <CircularProgress size={16} color="inherit" /> : <PlayArrow />}
          onClick={handleTest}
          disabled={testing || !testInput.trim()}
          sx={{ borderRadius: 2, mb: 1.5 }}
        >
          Run Test
        </Button>
        {testOutput && (
          <MonacoEditorWrapper value={testOutput} language="json" height={200} readOnly />
        )}
      </Box>
    </Box>
  );
};

export default PromptEditor;
