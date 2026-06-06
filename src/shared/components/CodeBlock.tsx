import React, { memo, useCallback, useState } from 'react'
import MonacoEditor from '@monaco-editor/react'
import { Box, IconButton, Tooltip, Typography } from '@mui/material'
import { Copy, Check } from 'lucide-react'
import { useUIStore } from '@/store'

interface CodeBlockProps {
  code:       string
  language?:  string
  filename?:  string
  readOnly?:  boolean
  height?:    number | string
  onChange?:  (value: string) => void
  showCopy?:  boolean
}

export const CodeBlock = memo<CodeBlockProps>(
  ({
    code,
    language = 'typescript',
    filename,
    readOnly = true,
    height = 300,
    onChange,
    showCopy = true,
  }) => {
    const themeMode  = useUIStore((s) => s.themeMode)
    const [copied,   setCopied] = useState(false)

    const handleCopy = useCallback(() => {
      void navigator.clipboard.writeText(code).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }, [code])

    const monacoTheme = themeMode === 'dark' ? 'vs-dark' : 'vs'

    return (
      <Box
        sx={{
          border:       '1px solid',
          borderColor:  'divider',
          borderRadius: 2,
          overflow:     'hidden',
        }}
      >
        {/* Header bar */}
        {(filename ?? showCopy) && (
          <Box
            sx={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              px: 2,
              py: 0.75,
              bgcolor:        'background.subtle',
              borderBottom:   '1px solid',
              borderColor:    'divider',
            }}
          >
            {filename && (
              <Typography variant="caption" fontWeight={500} color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                {filename}
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
              <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                {language}
              </Typography>
              {showCopy && (
                <Tooltip title={copied ? 'Copied!' : 'Copy code'}>
                  <IconButton size="small" onClick={handleCopy} sx={{ width: 24, height: 24 }}>
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        )}

        {/* Monaco Editor */}
        <MonacoEditor
          height={height}
          language={language}
          value={code}
          theme={monacoTheme}
          options={{
            readOnly,
            minimap:          { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers:      'on',
            wordWrap:         'on',
            fontSize:         13,
            fontFamily:       '"JetBrains Mono", "Fira Code", monospace',
            fontLigatures:    true,
            renderLineHighlight: readOnly ? 'none' : 'line',
            scrollbar:        { vertical: 'auto', horizontal: 'auto' },
            padding:          { top: 12, bottom: 12 },
          }}
          onChange={(value) => onChange?.(value ?? '')}
        />
      </Box>
    )
  },
)

CodeBlock.displayName = 'CodeBlock'
