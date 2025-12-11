/**
 * BaseContextMenu Component
 *
 * Professional context menu component with Fluent UI Menu integration.
 * Features keyboard navigation, sub-menu support, and proper positioning.
 *
 * This component provides the foundation for all OpenCut context menus,
 * ensuring consistent behavior and styling across the application.
 */

import {
  Menu,
  MenuList,
  MenuPopover,
  type MenuOpenChangeData,
  type PositioningImperativeRef,
} from '@fluentui/react-components';
import type { FC, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './contextMenu.module.css';

export interface BaseContextMenuProps {
  /** Whether the menu is open */
  open: boolean;
  /** Position of the menu */
  position: { x: number; y: number } | null;
  /** Menu content (MenuItems and MenuDividers) */
  children: ReactNode;
  /** Callback when menu should close */
  onClose: () => void;
  /** Additional CSS class */
  className?: string;
  /** Minimum width override */
  minWidth?: string;
  /** Maximum width override */
  maxWidth?: string;
}

/**
 * Professional context menu base component.
 * Handles positioning, keyboard navigation, and lifecycle.
 */
export const BaseContextMenu: FC<BaseContextMenuProps> = ({
  open,
  position,
  children,
  onClose,
  className,
  minWidth,
  maxWidth,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const positioningRef = useRef<PositioningImperativeRef>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsOpen(open && position !== null);
  }, [open, position]);

  const handleOpenChange = useCallback(
    (_event: unknown, data: MenuOpenChangeData) => {
      if (!data.open) {
        setIsOpen(false);
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!position || !isOpen) {
    return null;
  }

  const positioning = {
    position: 'fixed' as const,
    positionFixed: true,
    autoSize: 'height' as const,
    flipBoundary: document.body,
    overflowBoundary: document.body,
    offset: { crossAxis: 0, mainAxis: 0 },
  };

  const menuStyle = {
    ...(minWidth && { '--context-menu-min-width': minWidth }),
    ...(maxWidth && { '--context-menu-max-width': maxWidth }),
  } as React.CSSProperties;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 10000,
      }}
    >
      <Menu open={isOpen} onOpenChange={handleOpenChange}>
        <MenuPopover positioning={positioning} positioningRef={positioningRef}>
          <MenuList
            className={`${styles.contextMenu} ${className || ''}`}
            style={menuStyle}
            role="menu"
          >
            {children}
          </MenuList>
        </MenuPopover>
      </Menu>
    </div>
  );
};

/**
 * Hook for managing context menu state.
 * Provides showContextMenu and hideContextMenu helpers.
 */
export function useContextMenuState() {
  const [contextMenuState, setContextMenuState] = useState<{
    open: boolean;
    position: { x: number; y: number } | null;
    target?: unknown;
  }>({
    open: false,
    position: null,
    target: undefined,
  });

  const showContextMenu = useCallback((event: React.MouseEvent, target?: unknown) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenuState({
      open: true,
      position: { x: event.clientX, y: event.clientY },
      target,
    });
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenuState({
      open: false,
      position: null,
      target: undefined,
    });
  }, []);

  return {
    contextMenuState,
    showContextMenu,
    hideContextMenu,
  };
}
