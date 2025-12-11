/**
 * ContextMenuItem Component
 *
 * Reusable menu item component for professional NLE-style context menus.
 * Supports icons, keyboard shortcuts, disabled states, checkmarks, and submenus.
 */

import { ChevronRight16Regular } from '@fluentui/react-icons';
import type { FC, ReactNode } from 'react';
import { useCallback } from 'react';
import styles from './contextMenu.module.css';

export interface ContextMenuItemProps {
  /** Menu item label */
  label: string;
  /** Icon element (from Fluent UI icons) */
  icon?: ReactNode;
  /** Keyboard shortcut hint (e.g., "Cmd+C", "Del") */
  shortcut?: string;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Whether the item is checked (shows checkmark) */
  checked?: boolean;
  /** Whether this item has a submenu */
  hasSubmenu?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * Professional context menu item with icon, label, shortcut, and states.
 */
export const ContextMenuItem: FC<ContextMenuItemProps> = ({
  label,
  icon,
  shortcut,
  disabled = false,
  checked = false,
  hasSubmenu = false,
  onClick,
  className,
}) => {
  const handleClick = useCallback(() => {
    if (!disabled && onClick) {
      onClick();
    }
  }, [disabled, onClick]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && !disabled && onClick) {
        e.preventDefault();
        onClick();
      }
    },
    [disabled, onClick]
  );

  return (
    <div
      className={`${styles.menuItem} ${disabled ? styles.disabled : ''} ${checked ? styles.checked : ''} ${checked ? styles.hasCheckmark : ''} ${className || ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="menuitem"
      aria-disabled={disabled}
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
    >
      {checked && (
        <span className={styles.checkmark} aria-hidden="true">
          ✓
        </span>
      )}

      {icon && (
        <span className={styles.menuItemIcon} aria-hidden="true">
          {icon}
        </span>
      )}

      <span className={styles.menuItemLabel}>{label}</span>

      {shortcut && !hasSubmenu && <span className={styles.menuShortcut}>{shortcut}</span>}

      {hasSubmenu && (
        <span className={styles.subMenuIndicator} aria-hidden="true">
          <ChevronRight16Regular />
        </span>
      )}
    </div>
  );
};

/**
 * Context menu divider for visual separation between groups.
 */
export const ContextMenuDivider: FC = () => {
  return <div className={styles.menuDivider} role="separator" aria-hidden="true" />;
};
