import { useRef, useState } from 'react'
import {
  Box,
  Chip,
  CircularProgress,
  Drawer,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { Close, ContentCopy } from '@mui/icons-material'
import type { TestGenerationResult, QATestScenario, QAGherkinCase } from '@/api/stories'

// ── helpers ───────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Tooltip title={copied ? 'Copied!' : 'Copy'}>
      <IconButton
        size="small"
        onClick={() => {
          navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }}
      >
        <ContentCopy sx={{ fontSize: 13 }} />
      </IconButton>
    </Tooltip>
  )
}

function SectionHeading({ label, count }: { label: string; count?: number }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
      <Typography
        variant="overline"
        sx={{ color: 'text.disabled', fontSize: '0.65rem', letterSpacing: 1.5 }}
      >
        {label}
      </Typography>
      {count !== undefined && (
        <Chip label={count} size="small" sx={{ height: 16, fontSize: '0.6rem' }} />
      )}
    </Stack>
  )
}

// ── Feature banner ────────────────────────────────────────────────────────────

function FeatureBanner({
  feature_status,
  complexity_level,
  overall_risk,
  detected_module,
}: {
  feature_status?: string
  complexity_level?: string
  overall_risk?: string
  detected_module?: string
}) {
  const statusChip = () => {
    if (feature_status === 'existing')
      return <Chip label="✓ Existing" size="small" sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }} />
    if (feature_status === 'partial')
      return <Chip label="⚠ Partial" size="small" sx={{ bgcolor: '#ffedd5', color: '#c2410c', fontWeight: 700 }} />
    return <Chip label="✦ New" size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700 }} />
  }

  const complexityChip = () => {
    const cl = (complexity_level ?? '').toUpperCase()
    if (cl === 'SIMPLE')
      return <Chip label="SIMPLE" size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700 }} />
    if (cl === 'COMPLEX')
      return <Chip label="COMPLEX" size="small" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 700 }} />
    return <Chip label="MODERATE" size="small" sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }} />
  }

  const riskChip = () => {
    const r = (overall_risk ?? '').toUpperCase()
    if (r === 'P1')
      return <Chip label="P1" size="small" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 700 }} />
    if (r === 'P2')
      return <Chip label="P2" size="small" sx={{ bgcolor: '#ffedd5', color: '#c2410c', fontWeight: 700 }} />
    if (r === 'P3')
      return <Chip label="P3" size="small" variant="outlined" sx={{ borderColor: '#ca8a04', color: '#a16207', fontWeight: 700 }} />
    return <Chip label="P4" size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700 }} />
  }

  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ py: 1.5 }}>
      {!!feature_status && statusChip()}
      {!!complexity_level && complexityChip()}
      {!!overall_risk && riskChip()}
      {!!detected_module && (
        <Chip label={detected_module} size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569' }} />
      )}
    </Stack>
  )
}

// ── TOC ───────────────────────────────────────────────────────────────────────

const TOC_ITEMS = [
  'Feature', 'Modules', 'Event Flow', 'Risk', 'Warnings',
  'Scenarios', 'Gherkin', 'Regression', 'Coverage', 'API',
]

function TableOfContents({ refs }: { refs: Record<string, React.RefObject<HTMLDivElement | null>> }) {
  return (
    <Box
      sx={{
        overflowX: 'auto', display: 'flex', gap: 0.75, pb: 1, flexShrink: 0,
        '&::-webkit-scrollbar': { height: 4 },
      }}
    >
      {TOC_ITEMS.map((label) => (
        <Chip
          key={label}
          label={label}
          size="small"
          clickable
          onClick={() => {
            const key = label.toLowerCase().replace(/\s+/g, '_')
            refs[key]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
          sx={{ fontSize: '0.65rem', height: 22, flexShrink: 0 }}
        />
      ))}
    </Box>
  )
}

// ── Section 1: Feature Understanding ─────────────────────────────────────────

function FeatureUnderstanding({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/).filter(Boolean)
  return (
    <Box>
      <SectionHeading label="Feature Understanding" />
      <Stack spacing={1}>
        {paragraphs.map((p, i) => (
          <Typography key={i} variant="body2" sx={{ lineHeight: 1.7 }}>
            {p}
          </Typography>
        ))}
      </Stack>
    </Box>
  )
}

// ── Section 2: Impacted Modules ───────────────────────────────────────────────

function ImpactedModules({
  items,
}: {
  items: Array<{ id: string; name: string; impact_type: string; criticality: number; description?: string }>
}) {
  return (
    <Box>
      <SectionHeading label="Impacted Modules" count={items.length} />
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {items.map((m) => (
          <Box key={m.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.25 }}>
            <Chip
              label={m.name}
              size="small"
              sx={{
                bgcolor: m.impact_type === 'DIRECT' ? '#ede9fe' : '#dbeafe',
                color: m.impact_type === 'DIRECT' ? '#7c3aed' : '#1d4ed8',
                fontWeight: 600,
              }}
            />
            <Typography variant="caption" sx={{ color: '#ca8a04', fontSize: '0.6rem', pl: 0.5 }}>
              {'★'.repeat(Math.min(m.criticality, 5))}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

// ── Section 3: Event Flow ─────────────────────────────────────────────────────

const LAYER_COLORS: Record<string, string> = {
  UI: '#ede9fe',
  API: '#dbeafe',
  DB: '#dcfce7',
  Event: '#fef9c3',
  Consumer: '#fce7f3',
  Notification: '#e0f2fe',
}

function EventFlow({
  items,
}: {
  items: Array<{ step: number; layer: string; component: string; action: string; data?: string; validation_point: string }>
}) {
  return (
    <Box>
      <SectionHeading label="Event Flow" count={items.length} />
      <Stack spacing={1}>
        {items.map((item) => (
          <Box
            key={item.step}
            sx={{
              display: 'flex', gap: 1.5, alignItems: 'flex-start',
              border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 1.25,
              bgcolor: LAYER_COLORS[item.layer] ?? '#f8fafc',
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, minWidth: 22, color: 'text.disabled' }}
            >
              {item.step}
            </Typography>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
                <Chip label={item.layer} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />
                <Typography variant="caption" fontWeight={700}>{item.component}</Typography>
              </Stack>
              <Typography variant="caption" sx={{ display: 'block' }}>{item.action}</Typography>
              {!!item.data && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
                  {item.data}
                </Typography>
              )}
              <Typography variant="caption" sx={{ display: 'block', color: '#15803d', mt: 0.25 }}>
                ✓ {item.validation_point}
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

// ── Section 4: Risk Areas ─────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  P1: '#b91c1c',
  P2: '#c2410c',
  P3: '#a16207',
  P4: '#15803d',
}

function RiskAreas({
  items,
}: {
  items: Array<{ feature: string; module: string; risk_score: number; priority: string; reasons: string[]; past_bug_count: number }>
}) {
  return (
    <Box>
      <SectionHeading label="Risk Areas" count={items.length} />
      <Stack spacing={1.5}>
        {items.map((r, i) => {
          const color = PRIORITY_COLORS[r.priority] ?? '#6b7280'
          return (
            <Box key={i} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 1.5 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                <Chip
                  label={r.priority}
                  size="small"
                  sx={{ bgcolor: color + '20', color, fontWeight: 700, height: 20 }}
                />
                <Typography variant="body2" fontWeight={700}>{r.feature}</Typography>
                <Typography variant="caption" color="text.secondary">· {r.module}</Typography>
              </Stack>
              <Stack spacing={0.25} sx={{ mb: 0.75 }}>
                {r.reasons.map((reason, ri) => (
                  <Typography key={ri} variant="caption" color="text.secondary">• {reason}</Typography>
                ))}
              </Stack>
              <Typography variant="caption" sx={{ color, fontWeight: 600 }}>
                Risk score: {Math.round(r.risk_score * 100)}%
              </Typography>
            </Box>
          )
        })}
      </Stack>
    </Box>
  )
}

// ── Section 5: Warnings ───────────────────────────────────────────────────────

function HeadsUpWarnings({
  items,
}: {
  items: Array<{ warning: string; recommendation: string; severity?: string }>
}) {
  return (
    <Box>
      <SectionHeading label="Warnings" count={items.length} />
      <Stack spacing={1}>
        {items.map((w, i) => (
          <Box
            key={i}
            sx={{
              bgcolor: '#fffbeb', border: '1px solid #a16207',
              borderRadius: 1.5, p: 1.5,
            }}
          >
            <Stack direction="row" spacing={0.75} alignItems="flex-start">
              <Typography sx={{ fontSize: '1rem', lineHeight: 1.2 }}>⚠</Typography>
              <Box>
                <Typography variant="body2" fontWeight={700} sx={{ color: '#92400e' }}>
                  {w.warning}
                </Typography>
                <Typography variant="caption" sx={{ color: '#78350f', display: 'block', mt: 0.25 }}>
                  {w.recommendation}
                </Typography>
              </Box>
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

// ── Section 6: Test Scenarios ─────────────────────────────────────────────────

const RISK_FILTER_LABELS = ['All', 'High', 'Medium', 'Low'] as const
type RiskFilter = typeof RISK_FILTER_LABELS[number]

function TestScenarios({ items }: { items: QATestScenario[] }) {
  const [filter, setFilter] = useState<RiskFilter>('All')

  const filtered = filter === 'All'
    ? items
    : items.filter((s) => s.risk_level?.toLowerCase() === filter.toLowerCase())

  return (
    <Box>
      <SectionHeading label="Test Scenarios" count={items.length} />
      <Stack direction="row" spacing={0.75} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.75 }}>
        {RISK_FILTER_LABELS.map((f) => (
          <Chip
            key={f}
            label={f}
            size="small"
            clickable
            variant={filter === f ? 'filled' : 'outlined'}
            onClick={() => setFilter(f)}
            sx={{ fontSize: '0.65rem', height: 22 }}
          />
        ))}
      </Stack>
      <Stack spacing={1.5}>
        {filtered.map((s) => (
          <Box key={s.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 1.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
              <Typography variant="caption" fontWeight={700} sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
                {s.id}
              </Typography>
              <Chip label={s.type} size="small" sx={{ height: 17, fontSize: '0.6rem' }} />
              <Chip label={s.scenario_type} size="small" sx={{ height: 17, fontSize: '0.6rem' }} />
            </Stack>
            <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>{s.title}</Typography>
            {!!s.description && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                {s.description}
              </Typography>
            )}
            {s.steps.length > 0 && (
              <Stack spacing={0.25} sx={{ mb: 0.75 }}>
                {s.steps.map((step, si) => (
                  <Typography key={si} variant="caption" color="text.secondary">
                    {step}
                  </Typography>
                ))}
              </Stack>
            )}
            {!!s.expected_result && (
              <Typography variant="caption" sx={{ color: '#15803d' }}>
                ✓ {s.expected_result}
              </Typography>
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

// ── Section 7: Gherkin ────────────────────────────────────────────────────────

const GHERKIN_COLORS: Record<string, string> = {
  '@': '#818cf8',
  'Feature:': '#f472b6',
  'Scenario:': '#f472b6',
  'Given': '#34d399',
  'When': '#60a5fa',
  'Then': '#fb923c',
  'And': '#94a3b8',
}

function GherkinLine({ line }: { line: string }) {
  const trimmed = line.trimStart()
  const keyword = Object.keys(GHERKIN_COLORS).find((k) =>
    trimmed.startsWith(k === '@' ? '@' : k + ' ') || trimmed === k
  )
  const color = keyword ? GHERKIN_COLORS[keyword] : '#e2e8f0'
  return <span style={{ color, display: 'block' }}>{line}</span>
}

function GherkinTestCases({ items }: { items: QAGherkinCase[] }) {
  return (
    <Box>
      <SectionHeading label="Gherkin Test Cases" count={items.length} />
      <Stack spacing={2}>
        {items.map((tc, i) => {
          const lines: string[] = [
            ...(tc.tags ?? []).map((t) => t.startsWith('@') ? t : `@${t}`),
            `Feature: ${tc.feature}`,
            `  Scenario: ${tc.scenario_title}`,
            ...(tc.given ?? []).map((s, si) => `    ${si === 0 ? 'Given' : 'And'} ${s}`),
            ...(tc.when ?? []).map((s, si) => `    ${si === 0 ? 'When' : 'And'} ${s}`),
            ...(tc.then ?? []).map((s, si) => `    ${si === 0 ? 'Then' : 'And'} ${s}`),
          ]
          const content = lines.join('\n')
          return (
            <Box key={i} sx={{ position: 'relative' }}>
              <Box sx={{ position: 'absolute', top: 6, right: 6, zIndex: 1 }}>
                <CopyButton text={content} />
              </Box>
              <Box
                component="pre"
                sx={{
                  bgcolor: '#1e1e2e', borderRadius: 1.5, p: 2,
                  overflowX: 'auto', fontSize: '0.78rem', lineHeight: 1.65,
                  fontFamily: 'monospace', m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}
              >
                {lines.map((line, li) => (
                  <GherkinLine key={li} line={line} />
                ))}
              </Box>
            </Box>
          )
        })}
      </Stack>
    </Box>
  )
}

// ── Section 8: Regression Suite ───────────────────────────────────────────────

function RegressionSuite({
  items,
}: {
  items: Array<{ test_case_name: string; priority: string; module: string; reason: string }>
}) {
  return (
    <Box>
      <SectionHeading label="Regression Suite" count={items.length} />
      <Stack spacing={1}>
        {items.map((item, i) => (
          <Box key={i} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 1.25 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <Chip
                label={item.priority}
                size="small"
                sx={{
                  height: 18, fontSize: '0.6rem', fontWeight: 700,
                  bgcolor: item.priority === 'MUST-RUN' ? '#ef4444' : '#3b82f6',
                  color: '#fff',
                }}
              />
              <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>{item.test_case_name}</Typography>
              <Chip label={item.module} size="small" sx={{ height: 18, fontSize: '0.6rem' }} />
            </Stack>
            <Typography variant="caption" color="text.secondary">{item.reason}</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

// ── Section 9: Coverage Gaps ──────────────────────────────────────────────────

function MissingCoverage({
  items,
}: {
  items: Array<{ area: string; description: string; recommendation?: string }>
}) {
  return (
    <Box>
      <SectionHeading label="Coverage Gaps" count={items.length} />
      <Stack spacing={1}>
        {items.map((item, i) => (
          <Box key={i} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 1.25 }}>
            <Typography variant="body2" fontWeight={700} sx={{ mb: 0.25 }}>{item.area}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
              {item.description}
            </Typography>
            {!!item.recommendation && (
              <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                {item.recommendation}
              </Typography>
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

// ── Section 10: API & Event Validation ───────────────────────────────────────

const METHOD_COLORS: Record<string, string> = {
  GET: '#3b82f6',
  POST: '#22c55e',
  PUT: '#f97316',
  DELETE: '#ef4444',
  PATCH: '#8b5cf6',
}

function ApiEventValidation({
  items,
}: {
  items: Array<{ endpoint: string; method: string; validations: string[]; event_triggers: string[]; db_impacts: string[] }>
}) {
  return (
    <Box>
      <SectionHeading label="API & Event Validation" count={items.length} />
      <Stack spacing={1.5}>
        {items.map((item, i) => {
          const methodColor = METHOD_COLORS[item.method?.toUpperCase() ?? ''] ?? '#6b7280'
          return (
            <Box key={i} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 1.5 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Chip
                  label={item.method}
                  size="small"
                  sx={{ bgcolor: methodColor, color: '#fff', fontWeight: 700, height: 20, fontSize: '0.65rem' }}
                />
                <Typography variant="caption" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                  {item.endpoint}
                </Typography>
              </Stack>
              {item.validations.length > 0 && (
                <Box sx={{ mb: 0.75 }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">Validations</Typography>
                  {item.validations.map((v, vi) => (
                    <Typography key={vi} variant="caption" sx={{ display: 'block', pl: 1 }}>• {v}</Typography>
                  ))}
                </Box>
              )}
              {item.event_triggers.length > 0 && (
                <Box sx={{ mb: 0.75 }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">Event Triggers</Typography>
                  {item.event_triggers.map((e, ei) => (
                    <Typography key={ei} variant="caption" sx={{ display: 'block', pl: 1 }}>• {e}</Typography>
                  ))}
                </Box>
              )}
              {item.db_impacts.length > 0 && (
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">DB Impacts</Typography>
                  {item.db_impacts.map((d, di) => (
                    <Typography key={di} variant="caption" sx={{ display: 'block', pl: 1 }}>• {d}</Typography>
                  ))}
                </Box>
              )}
            </Box>
          )
        })}
      </Stack>
    </Box>
  )
}

// ── Main Drawer ───────────────────────────────────────────────────────────────

interface TestGenerationDrawerProps {
  open: boolean
  loading: boolean
  result: TestGenerationResult | null
  error: string | null
  onClose: () => void
}

export function TestGenerationDrawer({
  open,
  loading,
  result,
  error,
  onClose,
}: TestGenerationDrawerProps) {
  const featureRef = useRef<HTMLDivElement>(null)
  const modulesRef = useRef<HTMLDivElement>(null)
  const eventFlowRef = useRef<HTMLDivElement>(null)
  const riskRef = useRef<HTMLDivElement>(null)
  const warningsRef = useRef<HTMLDivElement>(null)
  const scenariosRef = useRef<HTMLDivElement>(null)
  const gherkinRef = useRef<HTMLDivElement>(null)
  const regressionRef = useRef<HTMLDivElement>(null)
  const coverageRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<HTMLDivElement>(null)

  const sectionRefs: Record<string, React.RefObject<HTMLDivElement | null>> = {
    feature: featureRef,
    modules: modulesRef,
    event_flow: eventFlowRef,
    risk: riskRef,
    warnings: warningsRef,
    scenarios: scenariosRef,
    gherkin: gherkinRef,
    regression: regressionRef,
    coverage: coverageRef,
    api: apiRef,
  }

  const b3 = result?.brain3
  const hasContent = !!(b3 && (
    b3.feature_understanding || b3.feature_name ||
    (b3.impacted_modules?.length ?? 0) > 0 ||
    (b3.test_scenarios?.length ?? 0) > 0 ||
    (b3.gherkin_test_cases?.length ?? 0) > 0 ||
    (b3.risk_areas?.length ?? 0) > 0
  ))

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100vw', md: 820 }, display: 'flex', flexDirection: 'column' },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3, py: 2, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', borderBottom: '1px solid',
          borderColor: 'divider', flexShrink: 0,
        }}
      >
        <Stack>
          <Typography variant="subtitle1" fontWeight={700}>QA Intelligence Report</Typography>
          {result && (
            <Typography variant="caption" color="text.secondary">
              {result.story.identifier} · {result.story.title}
            </Typography>
          )}
        </Stack>
        <IconButton size="small" onClick={onClose}>
          <Close fontSize="small" />
        </IconButton>
      </Box>

      {/* Loading */}
      {loading && (
        <Box
          sx={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 2, p: 4,
          }}
        >
          <CircularProgress size={48} />
          <Typography variant="body1" fontWeight={600}>Generating QA Intelligence Report…</Typography>
        </Box>
      )}

      {/* Error */}
      {!loading && error && (
        <Box sx={{ p: 3 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {/* Result body — always render when not loading, not error, and result is set */}
      {!loading && !error && result && (
        <>
          {/* No content / error fallback */}
          {(!b3 || (!hasContent && !b3.error)) && (
            <Box sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary">
                No report data. The LLM may still be processing — try again in a moment.
              </Typography>
            </Box>
          )}

          {/* LLM error */}
          {!!b3?.error && !hasContent && (
            <Box sx={{ p: 3 }}>
              <Typography color="error.main" variant="body2" sx={{ mb: !!b3.raw ? 1.5 : 0 }}>
                {b3.error}
              </Typography>
              {!!b3.raw && (
                <Box component="pre" sx={{
                  bgcolor: 'grey.900', color: 'grey.100', borderRadius: 1.5, p: 2,
                  fontSize: '0.75rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word', maxHeight: 400, overflowY: 'auto',
                }}>
                  {String(b3.raw)}
                </Box>
              )}
            </Box>
          )}

          {/* Feature banner + TOC */}
          {hasContent && b3 && (
            <Box sx={{ px: 3, pt: 2, pb: 1, flexShrink: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
              <FeatureBanner
                {...(b3.feature_status !== undefined ? { feature_status: b3.feature_status } : {})}
                {...(b3.complexity_level !== undefined ? { complexity_level: b3.complexity_level } : {})}
                {...(b3.overall_risk !== undefined ? { overall_risk: b3.overall_risk } : {})}
                {...(b3.detected_module !== undefined ? { detected_module: b3.detected_module } : {})}
              />
              <TableOfContents refs={sectionRefs} />
            </Box>
          )}

          {/* Scrollable sections */}
          {hasContent && b3 && (
          <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
            <Stack spacing={4}>
              {/* Feature Understanding */}
              {!!b3.feature_understanding && (
                <div ref={featureRef}>
                  <FeatureUnderstanding text={b3.feature_understanding} />
                </div>
              )}

              {/* Impacted Modules */}
              {(b3.impacted_modules ?? []).length > 0 && (
                <div ref={modulesRef}>
                  <ImpactedModules items={b3.impacted_modules!} />
                </div>
              )}

              {/* Event Flow */}
              {(b3.event_flow ?? []).length > 0 && (
                <div ref={eventFlowRef}>
                  <EventFlow items={b3.event_flow!} />
                </div>
              )}

              {/* Risk Areas */}
              {(b3.risk_areas ?? []).length > 0 && (
                <div ref={riskRef}>
                  <RiskAreas items={b3.risk_areas!} />
                </div>
              )}

              {/* Warnings */}
              {(b3.heads_up_warnings ?? []).length > 0 && (
                <div ref={warningsRef}>
                  <HeadsUpWarnings items={b3.heads_up_warnings!} />
                </div>
              )}

              {/* Test Scenarios */}
              {(b3.test_scenarios ?? []).length > 0 && (
                <div ref={scenariosRef}>
                  <TestScenarios items={b3.test_scenarios!} />
                </div>
              )}

              {/* Gherkin */}
              {(b3.gherkin_test_cases ?? []).length > 0 && (
                <div ref={gherkinRef}>
                  <GherkinTestCases items={b3.gherkin_test_cases!} />
                </div>
              )}

              {/* Regression Suite */}
              {(b3.regression_suite ?? []).length > 0 && (
                <div ref={regressionRef}>
                  <RegressionSuite items={b3.regression_suite!} />
                </div>
              )}

              {/* Coverage Gaps */}
              {(b3.missing_coverage ?? []).length > 0 && (
                <div ref={coverageRef}>
                  <MissingCoverage items={b3.missing_coverage!} />
                </div>
              )}

              {/* API & Event Validation */}
              {(b3.api_event_validation ?? []).length > 0 && (
                <div ref={apiRef}>
                  <ApiEventValidation items={b3.api_event_validation!} />
                </div>
              )}
            </Stack>
          </Box>
          )}
        </>
      )}
    </Drawer>
  )
}
