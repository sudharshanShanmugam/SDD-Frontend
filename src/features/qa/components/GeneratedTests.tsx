import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Chip,
  Button,
  Paper,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import { ContentCopy, Download, AutoAwesome, Check } from '@mui/icons-material';

interface GeneratedTestsProps {
  storyId?: string;
  testCaseId?: string;
  onGenerateMore?: () => Promise<void>;
}

const CODE_BY_TAB: Record<string, string> = {
  playwright: '',
  cypress: '',
  jest: '',
};

const LANGUAGES: Array<{ id: string; label: string; lang: string }> = [
  { id: 'playwright', label: 'Playwright', lang: 'typescript' },
  { id: 'cypress', label: 'Cypress', lang: 'javascript' },
  { id: 'jest', label: 'Jest/RTL', lang: 'typescript' },
];

// Lazy Monaco loader
const CodeDisplay: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [MonacoEditor, setMonacoEditor] = useState<typeof import('@monaco-editor/react').default | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('@monaco-editor/react')
      .then((mod) => { setMonacoEditor(() => mod.default); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <CircularProgress size={24} />
    </Box>
  );

  if (!MonacoEditor) {
    return (
      <Box
        component="pre"
        sx={{
          p: 2, m: 0, overflow: 'auto', fontFamily: 'monospace', fontSize: '0.8rem',
          bgcolor: '#1e1e1e', color: '#d4d4d4', borderRadius: 1, maxHeight: 400,
        }}
      >
        {code}
      </Box>
    );
  }

  return (
    <MonacoEditor
      value={code}
      language={language}
      theme="vs-dark"
      height={400}
      options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false }}
    />
  );
};

const GeneratedTests: React.FC<GeneratedTestsProps> = ({ onGenerateMore }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const currentLang = LANGUAGES[activeTab];
  const code = CODE_BY_TAB[currentLang.id];

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tests.${currentLang.lang === 'typescript' ? 'ts' : 'js'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try { await onGenerateMore?.(); } finally { setGenerating(false); }
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
          py: 1.5,
          bgcolor: 'action.hover',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome color="secondary" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={600}>
            Generated Test Code
          </Typography>
          <Chip label="AI-Generated" size="small" color="secondary" sx={{ height: 18, fontSize: '0.65rem' }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={copied ? 'Copied!' : 'Copy code'}>
            <IconButton size="small" onClick={handleCopy}>
              {copied ? <Check fontSize="small" color="success" /> : <ContentCopy fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Download">
            <IconButton size="small" onClick={handleDownload}>
              <Download fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button
            size="small"
            startIcon={generating ? <CircularProgress size={14} color="inherit" /> : <AutoAwesome fontSize="small" />}
            onClick={handleGenerate}
            disabled={generating}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Generate More
          </Button>
        </Box>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#1e1e1e' }}
        TabIndicatorProps={{ style: { backgroundColor: '#6366f1' } }}
      >
        {LANGUAGES.map((l) => (
          <Tab key={l.id} label={l.label} sx={{ color: 'rgba(255,255,255,0.7)', '&.Mui-selected': { color: 'white' }, minHeight: 40 }} />
        ))}
      </Tabs>

      <CodeDisplay code={code} language={currentLang.lang} />
    </Paper>
  );
};

export default GeneratedTests;
