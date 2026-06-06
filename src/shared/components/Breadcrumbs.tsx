import React, { memo } from 'react'
import {
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  Typography,
} from '@mui/material'
import { ChevronRight, Home } from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'
import type { BreadcrumbItem } from '@/types'

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  showHome?: boolean
  maxItems?: number
}

export const AppBreadcrumbs = memo<BreadcrumbsProps>(
  ({ items, showHome = true, maxItems = 4 }) => {
    const allItems: BreadcrumbItem[] = showHome
      ? [{ label: 'Home', href: '/dashboard' }, ...items]
      : items

    return (
      <MuiBreadcrumbs
        separator={<ChevronRight size={14} />}
        maxItems={maxItems}
        aria-label="breadcrumb"
        sx={{ fontSize: '0.8125rem' }}
      >
        {allItems.map((item, idx) => {
          const isLast   = idx === allItems.length - 1
          const isHome   = idx === 0 && showHome
          const label    = isHome ? <Home size={14} /> : item.label

          return isLast ? (
            <Typography
              key={idx}
              variant="caption"
              color="text.primary"
              fontWeight={500}
              component="span"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 'inherit' }}
            >
              {label}
            </Typography>
          ) : item.href ? (
            <Link
              key={idx}
              component={RouterLink}
              to={item.href}
              variant="caption"
              color="text.secondary"
              underline="hover"
              fontWeight={500}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 'inherit' }}
            >
              {label}
            </Link>
          ) : (
            <Typography
              key={idx}
              variant="caption"
              color="text.secondary"
              component="span"
              fontWeight={500}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 'inherit' }}
            >
              {label}
            </Typography>
          )
        })}
      </MuiBreadcrumbs>
    )
  },
)

AppBreadcrumbs.displayName = 'AppBreadcrumbs'
