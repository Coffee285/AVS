/**
 * EmptyState Component
 *
 * Consistent empty state UI for when there's no content to display.
 * Provides helpful messaging and optional call-to-action.
 *
 * Features:
 * - Icon or illustration support
 * - Title and description
 * - Optional action button
 * - Centered layout
 * - Uses design system tokens
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<FolderOpen24Regular />}
 *   title="No projects yet"
 *   description="Create your first project to get started"
 *   action={<Button>Create Project</Button>}
 * />
 * ```
 */

import { makeStyles, tokens } from '@fluentui/react-components';
import React from 'react';
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  /** Icon or illustration */
  icon?: ReactNode;

  /** Empty state title */
  title: string;

  /** Optional description text */
  description?: string;

  /** Optional call-to-action button */
  action?: ReactNode;

  /** Additional CSS classes */
  className?: string;
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: 'var(--space-3xl)',
    minHeight: '300px',
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 'var(--space-lg)',
    fontSize: '48px',
    color: tokens.colorNeutralForeground3,
    opacity: 0.6,
  },
  content: {
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)',
  },
  title: {
    margin: 0,
    fontSize: 'var(--text-title2)',
    fontWeight: 'var(--font-weight-semibold)',
    lineHeight: 'var(--line-height-tight)',
    color: tokens.colorNeutralForeground1,
  },
  description: {
    margin: 0,
    fontSize: 'var(--text-body)',
    lineHeight: 'var(--line-height-normal)',
    color: tokens.colorNeutralForeground2,
  },
  action: {
    marginTop: 'var(--space-lg)',
  },
});

/**
 * EmptyState component for no-content scenarios
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  const styles = useStyles();

  return (
    <div className={`${styles.root} ${className || ''}`}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

export default EmptyState;
