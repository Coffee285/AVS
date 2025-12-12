/**
 * PageHeader Component
 *
 * Standardized page header with title, optional subtitle, and actions.
 * Provides consistent spacing and typography across all pages.
 *
 * Features:
 * - Title with proper typography hierarchy
 * - Optional subtitle
 * - Optional actions (buttons, dropdowns)
 * - Responsive layout
 * - Uses design system tokens
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Projects"
 *   subtitle="Manage your video projects"
 *   actions={<Button>New Project</Button>}
 * />
 * ```
 */

import { makeStyles, tokens } from '@fluentui/react-components';
import React from 'react';
import type { ReactNode } from 'react';

export interface PageHeaderProps {
  /** Page title */
  title: string;

  /** Optional subtitle or description */
  subtitle?: string;

  /** Optional action buttons or controls */
  actions?: ReactNode;

  /** Additional CSS classes */
  className?: string;
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)',
    marginBottom: 'var(--space-xl)',
    '@media (min-width: 768px)': {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)',
    flex: 1,
    minWidth: 0,
  },
  title: {
    margin: 0,
    fontSize: 'var(--text-title1)',
    fontWeight: 'var(--font-weight-semibold)',
    lineHeight: 'var(--line-height-tight)',
    color: tokens.colorNeutralForeground1,
  },
  subtitle: {
    margin: 0,
    fontSize: 'var(--text-body)',
    lineHeight: 'var(--line-height-normal)',
    color: tokens.colorNeutralForeground2,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    flexShrink: 0,
  },
});

/**
 * PageHeader component for consistent page headers
 */
export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  const styles = useStyles();

  return (
    <header className={`${styles.root} ${className || ''}`}>
      <div className={styles.content}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}

export default PageHeader;
