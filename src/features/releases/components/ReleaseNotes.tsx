import React, { useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Highlight } from '@tiptap/extension-highlight';
import {
  Box,
  Divider,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
  Code,
  Link as LinkIcon,
  Highlight as HighlightIcon,
} from '@mui/icons-material';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReleaseNotesProps {
  content: string;
  readOnly?: boolean;
  onSave?: (html: string) => void;
}

// ── Toolbar button ────────────────────────────────────────────────────────────

interface ToolbarButtonProps {
  title: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

function ToolbarButton({
  title,
  onClick,
  isActive = false,
  disabled = false,
  children,
}: ToolbarButtonProps) {
  return (
    <Tooltip title={title}>
      <span>
        <IconButton
          size="small"
          onClick={onClick}
          disabled={disabled}
          sx={{
            borderRadius: 1,
            bgcolor: isActive ? 'primary.main' : 'transparent',
            color: isActive ? 'primary.contrastText' : 'text.primary',
            '&:hover': {
              bgcolor: isActive ? 'primary.dark' : 'action.hover',
            },
          }}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ReleaseNotes({ content, readOnly = false, onSave }: ReleaseNotesProps) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({ openOnClick: readOnly, HTMLAttributes: { rel: 'noopener' } }),
      Highlight.configure({ multicolor: false }),
    ],
    content,
    editable: !readOnly,
    onBlur: ({ editor: e }) => {
      if (readOnly || !onSave) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        onSave(e.getHTML());
      }, 1500);
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enter URL:', prev ?? 'https://');
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      {/* Toolbar */}
      {!readOnly && (
        <>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.5,
              px: 1.5,
              py: 1,
              bgcolor: 'background.default',
            }}
          >
            {/* Heading buttons */}
            {([1, 2, 3] as const).map((level) => (
              <ToolbarButton
                key={level}
                title={`Heading ${level}`}
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level }).run()
                }
                isActive={editor.isActive('heading', { level })}
              >
                <Typography variant="caption" fontWeight={700} fontSize={11}>
                  H{level}
                </Typography>
              </ToolbarButton>
            ))}

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            <ToolbarButton
              title="Bold (Ctrl+B)"
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
            >
              <FormatBold fontSize="small" />
            </ToolbarButton>

            <ToolbarButton
              title="Italic (Ctrl+I)"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
            >
              <FormatItalic fontSize="small" />
            </ToolbarButton>

            <ToolbarButton
              title="Highlight"
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              isActive={editor.isActive('highlight')}
            >
              <HighlightIcon fontSize="small" />
            </ToolbarButton>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            <ToolbarButton
              title="Bullet List"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
            >
              <FormatListBulleted fontSize="small" />
            </ToolbarButton>

            <ToolbarButton
              title="Numbered List"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
            >
              <FormatListNumbered fontSize="small" />
            </ToolbarButton>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            <ToolbarButton
              title="Code Block"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              isActive={editor.isActive('codeBlock')}
            >
              <Code fontSize="small" />
            </ToolbarButton>

            <ToolbarButton
              title="Link"
              onClick={setLink}
              isActive={editor.isActive('link')}
            >
              <LinkIcon fontSize="small" />
            </ToolbarButton>
          </Box>
          <Divider />
        </>
      )}

      {/* Editor content */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          minHeight: 200,
          '& .ProseMirror': {
            outline: 'none',
            fontSize: '0.875rem',
            lineHeight: 1.7,
            '& h1': { fontSize: '1.5rem', fontWeight: 700, mt: 2, mb: 1 },
            '& h2': { fontSize: '1.25rem', fontWeight: 600, mt: 1.5, mb: 0.75 },
            '& h3': { fontSize: '1.1rem', fontWeight: 600, mt: 1, mb: 0.5 },
            '& ul, & ol': { pl: 2.5 },
            '& mark': { backgroundColor: 'rgba(255, 213, 0, 0.4)', borderRadius: 2, px: 0.5 },
            '& code': {
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              bgcolor: 'action.hover',
              px: 0.75,
              py: 0.25,
              borderRadius: 1,
            },
            '& pre': {
              bgcolor: 'grey.900',
              color: 'grey.100',
              p: 2,
              borderRadius: 1,
              overflowX: 'auto',
              '& code': { bgcolor: 'transparent', p: 0 },
            },
            '& p.is-editor-empty:first-child::before': {
              content: 'attr(data-placeholder)',
              float: 'left',
              color: 'text.disabled',
              pointerEvents: 'none',
              height: 0,
            },
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Paper>
  );
}

export default ReleaseNotes;
