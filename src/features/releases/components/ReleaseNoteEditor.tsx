import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Divider,
  Tooltip,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  Code,
  Title,
  Undo,
  Redo,
  Preview,
  Edit,
  Download,
  Add,
  Delete,
} from '@mui/icons-material';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { motion } from 'framer-motion';

export type ReleaseNoteSection = 'features' | 'bugfixes' | 'improvements' | 'breaking' | 'deprecations';

const SECTION_CONFIG: Record<ReleaseNoteSection, { label: string; color: string; emoji: string }> = {
  features: { label: 'New Features', color: '#10b981', emoji: '✨' },
  bugfixes: { label: 'Bug Fixes', color: '#ef4444', emoji: '🐛' },
  improvements: { label: 'Improvements', color: '#6366f1', emoji: '⚡' },
  breaking: { label: 'Breaking Changes', color: '#f59e0b', emoji: '⚠️' },
  deprecations: { label: 'Deprecations', color: '#94a3b8', emoji: '🗑️' },
};

interface ReleaseNoteEntry {
  id: string;
  section: ReleaseNoteSection;
  title: string;
  storyId?: string;
  prNumber?: string;
}

interface TipTapToolbarProps {
  editor: ReturnType<typeof useEditor>;
}

const TipTapToolbar: React.FC<TipTapToolbarProps> = ({ editor }) => {
  if (!editor) return null;

  const tools = [
    { icon: <FormatBold fontSize="small" />, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold'), title: 'Bold' },
    { icon: <FormatItalic fontSize="small" />, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), title: 'Italic' },
    { icon: <FormatUnderlined fontSize="small" />, action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline'), title: 'Underline' },
    { icon: <Code fontSize="small" />, action: () => editor.chain().focus().toggleCode().run(), active: editor.isActive('code'), title: 'Inline code' },
  ];

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 1, borderBottom: '1px solid', borderColor: 'divider', flexWrap: 'wrap' }}>
      {tools.map((t) => (
        <Tooltip key={t.title} title={t.title}>
          <IconButton
            size="small"
            onClick={t.action}
            sx={{
              bgcolor: t.active ? 'action.selected' : 'transparent',
              borderRadius: 1,
              p: 0.75,
            }}
          >
            {t.icon}
          </IconButton>
        </Tooltip>
      ))}
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
      <Tooltip title="Heading 2">
        <IconButton size="small" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} sx={{ borderRadius: 1, p: 0.75, bgcolor: editor.isActive('heading', { level: 2 }) ? 'action.selected' : 'transparent' }}>
          <Title fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Bullet list">
        <IconButton size="small" onClick={() => editor.chain().focus().toggleBulletList().run()} sx={{ borderRadius: 1, p: 0.75, bgcolor: editor.isActive('bulletList') ? 'action.selected' : 'transparent' }}>
          <FormatListBulleted fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Ordered list">
        <IconButton size="small" onClick={() => editor.chain().focus().toggleOrderedList().run()} sx={{ borderRadius: 1, p: 0.75, bgcolor: editor.isActive('orderedList') ? 'action.selected' : 'transparent' }}>
          <FormatListNumbered fontSize="small" />
        </IconButton>
      </Tooltip>
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
      <Tooltip title="Undo">
        <IconButton size="small" onClick={() => editor.chain().focus().undo().run()} sx={{ borderRadius: 1, p: 0.75 }}>
          <Undo fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Redo">
        <IconButton size="small" onClick={() => editor.chain().focus().redo().run()} sx={{ borderRadius: 1, p: 0.75 }}>
          <Redo fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

interface ReleaseNoteEditorProps {
  version?: string;
  initialEntries?: ReleaseNoteEntry[];
  onSave?: (content: string, entries: ReleaseNoteEntry[]) => void;
}

const ReleaseNoteEditor: React.FC<ReleaseNoteEditorProps> = ({
  version = 'v2.4.0',
  initialEntries = [],
  onSave,
}) => {
  const [entries, setEntries] = useState<ReleaseNoteEntry[]>(initialEntries);
  const [viewMode, setViewMode] = useState<'structured' | 'freeform'>('structured');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<ReleaseNoteEntry>>({ section: 'features' });

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: `<h2>Release Notes — ${version}</h2><p>Document the key changes in this release...</p>`,
    editorProps: {
      attributes: {
        style: 'min-height: 200px; outline: none; font-size: 14px; line-height: 1.6;',
      },
    },
  });

  const generateMarkdown = useCallback(() => {
    const sections = Object.entries(SECTION_CONFIG) as [ReleaseNoteSection, typeof SECTION_CONFIG[ReleaseNoteSection]][];
    let md = `# Release Notes — ${version}\n\n`;

    for (const [key, conf] of sections) {
      const sectionEntries = entries.filter((e) => e.section === key);
      if (sectionEntries.length === 0) continue;
      md += `## ${conf.emoji} ${conf.label}\n\n`;
      for (const entry of sectionEntries) {
        md += `- ${entry.title}`;
        if (entry.storyId) md += ` ([${entry.storyId}](#))`;
        if (entry.prNumber) md += ` [#${entry.prNumber}](#)`;
        md += '\n';
      }
      md += '\n';
    }
    return md;
  }, [entries, version]);

  const handleAddEntry = () => {
    if (!newEntry.title || !newEntry.section) return;
    setEntries((prev) => [
      ...prev,
      { id: `e-${Date.now()}`, section: newEntry.section as ReleaseNoteSection, title: newEntry.title!, storyId: newEntry.storyId, prNumber: newEntry.prNumber },
    ]);
    setNewEntry({ section: 'features' });
    setAddDialogOpen(false);
  };

  const handleRemoveEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSave = () => {
    const content = viewMode === 'freeform' ? (editor?.getHTML() ?? '') : generateMarkdown();
    onSave?.(content, entries);
  };

  const handleDownload = () => {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `release-notes-${version}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Release Notes Editor</Typography>
          <Typography variant="body2" color="text.secondary">Version {version}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, v) => v && setViewMode(v)}
            size="small"
          >
            <ToggleButton value="structured" sx={{ px: 1.5, fontSize: '0.75rem' }}>
              <FormatListBulleted fontSize="small" sx={{ mr: 0.5 }} />
              Structured
            </ToggleButton>
            <ToggleButton value="freeform" sx={{ px: 1.5, fontSize: '0.75rem' }}>
              <Edit fontSize="small" sx={{ mr: 0.5 }} />
              Freeform
            </ToggleButton>
          </ToggleButtonGroup>
          <Button variant="outlined" startIcon={<Preview />} size="small" onClick={() => setPreviewOpen(true)} sx={{ borderRadius: 2 }}>
            Preview
          </Button>
          <Button variant="outlined" startIcon={<Download />} size="small" onClick={handleDownload} sx={{ borderRadius: 2 }}>
            Export
          </Button>
          <Button variant="contained" size="small" onClick={handleSave} sx={{ borderRadius: 2 }}>
            Save
          </Button>
        </Box>
      </Box>

      {viewMode === 'structured' ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {(Object.entries(SECTION_CONFIG) as [ReleaseNoteSection, typeof SECTION_CONFIG[ReleaseNoteSection]][]).map(([sectionKey, conf]) => {
            const sectionEntries = entries.filter((e) => e.section === sectionKey);
            return (
              <Paper key={sectionKey} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box
                  sx={{
                    px: 2,
                    py: 1.25,
                    bgcolor: conf.color + '11',
                    borderBottom: '1px solid',
                    borderColor: conf.color + '33',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">{conf.emoji}</Typography>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: conf.color }}>
                      {conf.label}
                    </Typography>
                    <Chip label={sectionEntries.length} size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: conf.color + '22', color: conf.color }} />
                  </Box>
                </Box>
                <Box sx={{ p: 1.5 }}>
                  {sectionEntries.length === 0 ? (
                    <Typography variant="caption" color="text.disabled" sx={{ px: 1 }}>
                      No entries in this section
                    </Typography>
                  ) : (
                    sectionEntries.map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            py: 0.75,
                            px: 1,
                            borderRadius: 1,
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                        >
                          <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: conf.color, flexShrink: 0 }} />
                          <Typography variant="body2" sx={{ flex: 1 }}>{entry.title}</Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                            {entry.storyId && (
                              <Chip label={entry.storyId} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />
                            )}
                            {entry.prNumber && (
                              <Chip label={`#${entry.prNumber}`} size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#f0f0f0' }} />
                            )}
                          </Box>
                          <IconButton size="small" onClick={() => handleRemoveEntry(entry.id)} sx={{ p: 0.25, opacity: 0.4, '&:hover': { opacity: 1, color: 'error.main' } }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </motion.div>
                    ))
                  )}
                </Box>
              </Paper>
            );
          })}

          <Button
            variant="dashed" // fallback to outlined
            startIcon={<Add />}
            onClick={() => setAddDialogOpen(true)}
            sx={{ borderRadius: 2, borderStyle: 'dashed', borderColor: 'divider', color: 'text.secondary' }}
          >
            Add Entry
          </Button>
        </Box>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TipTapToolbar editor={editor} />
          <Box
            sx={{
              p: 2,
              minHeight: 300,
              '& .ProseMirror': {
                outline: 'none',
                '& h1, & h2, & h3': { fontWeight: 700, mt: 2, mb: 1 },
                '& ul, & ol': { pl: 3 },
                '& code': { bgcolor: 'action.hover', px: 0.5, borderRadius: 0.5, fontFamily: 'monospace', fontSize: '0.85em' },
              },
            }}
          >
            <EditorContent editor={editor} />
          </Box>
        </Paper>
      )}

      {/* Add Entry Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Add Release Note Entry</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <FormControl fullWidth>
            <InputLabel>Section</InputLabel>
            <Select
              value={newEntry.section ?? 'features'}
              label="Section"
              onChange={(e) => setNewEntry((p) => ({ ...p, section: e.target.value as ReleaseNoteSection }))}
            >
              {(Object.entries(SECTION_CONFIG) as [ReleaseNoteSection, typeof SECTION_CONFIG[ReleaseNoteSection]][]).map(([k, c]) => (
                <MenuItem key={k} value={k}>
                  {c.emoji} {c.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Description"
            value={newEntry.title ?? ''}
            onChange={(e) => setNewEntry((p) => ({ ...p, title: e.target.value }))}
            fullWidth
            placeholder="Describe the change..."
            multiline
            rows={2}
          />
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              label="Story ID (optional)"
              value={newEntry.storyId ?? ''}
              onChange={(e) => setNewEntry((p) => ({ ...p, storyId: e.target.value }))}
              size="small"
              placeholder="US-042"
              fullWidth
            />
            <TextField
              label="PR Number (optional)"
              value={newEntry.prNumber ?? ''}
              onChange={(e) => setNewEntry((p) => ({ ...p, prNumber: e.target.value }))}
              size="small"
              placeholder="145"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleAddEntry} variant="contained" disabled={!newEntry.title} sx={{ borderRadius: 2 }}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>Preview — Release Notes {version}</DialogTitle>
        <DialogContent>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: '#fafafa' }}>
            <Box
              component="pre"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                m: 0,
                color: 'text.primary',
              }}
            >
              {generateMarkdown()}
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPreviewOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>Close</Button>
          <Button onClick={handleDownload} variant="contained" startIcon={<Download />} sx={{ borderRadius: 2 }}>
            Download Markdown
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReleaseNoteEditor;
