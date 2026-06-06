import React, { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Box, type SxProps, type Theme } from '@mui/material'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface MarkdownViewerProps {
  content: string
  sx?: SxProps<Theme>
  compact?: boolean
}

export const MarkdownViewer = memo<MarkdownViewerProps>(
  ({ content, sx, compact = false }) => {
    return (
      <Box
        sx={{
          // Prose-like styles
          '& h1': { fontSize: compact ? '1.375rem' : '1.5rem', fontWeight: 700, mt: 2, mb: 1 },
          '& h2': { fontSize: compact ? '1.125rem' : '1.25rem', fontWeight: 700, mt: 2, mb: 1 },
          '& h3': { fontSize: compact ? '1rem'     : '1.125rem', fontWeight: 600, mt: 1.5, mb: 0.75 },
          '& p':  { lineHeight: 1.7, mb: 1.5, fontSize: compact ? '0.875rem' : '1rem' },
          '& ul, & ol': { pl: 2.5, mb: 1.5 },
          '& li': { lineHeight: 1.7, mb: 0.5, fontSize: compact ? '0.875rem' : '1rem' },
          '& blockquote': {
            borderLeft: '3px solid',
            borderColor: 'primary.main',
            pl: 2,
            ml: 0,
            color: 'text.secondary',
            fontStyle: 'italic',
          },
          '& code': {
            bgcolor:      'action.hover',
            borderRadius: 0.75,
            px:           0.5,
            py:           0.25,
            fontSize:     '0.875em',
            fontFamily:   '"JetBrains Mono", monospace',
          },
          '& pre': {
            p: 0,
            mb: 2,
            '& code': { bgcolor: 'transparent', p: 0, borderRadius: 0 },
          },
          '& table': {
            width:          '100%',
            borderCollapse: 'collapse',
            mb:             2,
          },
          '& th': {
            bgcolor:     'background.subtle',
            px:          1.5,
            py:          1,
            textAlign:   'left',
            fontWeight:  600,
            fontSize:    '0.75rem',
            borderBottom: '2px solid',
            borderColor: 'divider',
          },
          '& td': {
            px:          1.5,
            py:          1,
            borderBottom: '1px solid',
            borderColor: 'divider',
            fontSize:    '0.875rem',
          },
          '& a': {
            color:          'primary.main',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          },
          '& hr': { borderColor: 'divider', my: 2 },
          '& img': { maxWidth: '100%', borderRadius: 1 },
          ...sx,
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode }) {
              const match = /language-(\w+)/.exec(className ?? '')
              const language = match?.[1] ?? 'text'

              if (!inline && match) {
                return (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={language}
                    PreTag="div"
                    customStyle={{
                      borderRadius: 8,
                      fontSize: '0.875rem',
                      margin: 0,
                    }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                )
              }
              return <code className={className} {...props}>{children}</code>
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </Box>
    )
  },
)

MarkdownViewer.displayName = 'MarkdownViewer'
