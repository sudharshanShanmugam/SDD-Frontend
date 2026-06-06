import React, { memo, type ReactNode } from 'react'
import { Box, Breadcrumbs, Link, Typography, Skeleton, Stack } from '@mui/material'
import { ChevronRight } from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { BreadcrumbItem } from '@/types'

interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
  /** Chip/badge displayed inline after the title */
  badge?: ReactNode
  isLoading?: boolean
  /** @deprecated use isLoading */
  loading?: boolean
  icon?: ReactNode
}

export const PageHeader = memo<PageHeaderProps>(
  ({ title, subtitle, breadcrumbs, actions, badge, isLoading = false, loading = false, icon }) => {
    const showLoading = isLoading || loading

    if (showLoading) {
      return (
        <Box
          sx={{
            px: { xs: 2, sm: 3, md: 4 },
            pt: { xs: 2, sm: 3 },
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Skeleton width={200} height={20} sx={{ mb: 1 }} />
          <Skeleton width={400} height={36} />
        </Box>
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
      <Box
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 2, sm: 3 },
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs
            separator={<ChevronRight size={14} />}
            sx={{ mb: 1 }}
            aria-label="breadcrumb"
          >
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1
              return isLast ? (
                <Typography
                  key={idx}
                  variant="caption"
                  color="text.primary"
                  fontWeight={500}
                >
                  {crumb.label}
                </Typography>
              ) : crumb.href ? (
                <Link
                  key={idx}
                  component={RouterLink}
                  to={crumb.href}
                  variant="caption"
                  color="text.secondary"
                  underline="hover"
                  sx={{ fontWeight: 500 }}
                >
                  {crumb.label}
                </Link>
              ) : (
                <Typography key={idx} variant="caption" color="text.secondary" fontWeight={500}>
                  {crumb.label}
                </Typography>
              )
            })}
          </Breadcrumbs>
        )}

        {/* Title Row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            {icon && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  color: 'primary.main',
                  flexShrink: 0,
                }}
              >
                {icon}
              </Box>
            )}
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  noWrap
                  sx={{ lineHeight: 1.3 }}
                >
                  {title}
                </Typography>
                {badge}
              </Stack>
              {subtitle && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.25 }}
                  noWrap
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>

          {actions && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
              {actions}
            </Box>
          )}
        </Box>
      </Box>
      </motion.div>
    )
  },
)

PageHeader.displayName = 'PageHeader'
