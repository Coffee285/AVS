/**
 * Keyboard Shortcuts Definitions
 *
 * Centralized keyboard shortcut definitions for the keyboard shortcuts overlay.
 * These shortcuts are displayed to users for discovery and learning.
 */

export type ShortcutCategory = 'playback' | 'timeline' | 'clips' | 'selection' | 'view' | 'file';

export interface KeyboardShortcut {
  id: string;
  keys: string[];
  description: string;
  category: ShortcutCategory;
}

/**
 * Display-friendly keyboard shortcuts for the overlay.
 * Uses platform-agnostic symbols that will be rendered appropriately.
 * ⌘ = Cmd/Ctrl (will be replaced dynamically based on platform)
 */
export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // Playback
  {
    id: 'play-pause',
    keys: ['Space'],
    description: 'Play / Pause',
    category: 'playback',
  },
  {
    id: 'go-start',
    keys: ['Home'],
    description: 'Go to Start',
    category: 'playback',
  },
  {
    id: 'go-end',
    keys: ['End'],
    description: 'Go to End',
    category: 'playback',
  },
  {
    id: 'frame-back',
    keys: ['←'],
    description: 'Previous Frame',
    category: 'playback',
  },
  {
    id: 'frame-forward',
    keys: ['→'],
    description: 'Next Frame',
    category: 'playback',
  },
  {
    id: 'jump-back',
    keys: ['J'],
    description: 'Play Reverse / Speed Up',
    category: 'playback',
  },
  {
    id: 'pause-key',
    keys: ['K'],
    description: 'Pause',
    category: 'playback',
  },
  {
    id: 'jump-forward',
    keys: ['L'],
    description: 'Play Forward / Speed Up',
    category: 'playback',
  },
  {
    id: 'prev-edit',
    keys: ['↑'],
    description: 'Previous Edit Point',
    category: 'playback',
  },
  {
    id: 'next-edit',
    keys: ['↓'],
    description: 'Next Edit Point',
    category: 'playback',
  },

  // Clips
  {
    id: 'split',
    keys: ['S'],
    description: 'Split Clip at Playhead',
    category: 'clips',
  },
  {
    id: 'delete',
    keys: ['Backspace'],
    description: 'Delete Selected',
    category: 'clips',
  },
  {
    id: 'delete-alt',
    keys: ['Delete'],
    description: 'Delete Selected',
    category: 'clips',
  },
  {
    id: 'duplicate',
    keys: ['⌘', 'D'],
    description: 'Duplicate Selected',
    category: 'clips',
  },
  {
    id: 'cut',
    keys: ['⌘', 'X'],
    description: 'Cut',
    category: 'clips',
  },
  {
    id: 'copy',
    keys: ['⌘', 'C'],
    description: 'Copy',
    category: 'clips',
  },
  {
    id: 'paste',
    keys: ['⌘', 'V'],
    description: 'Paste',
    category: 'clips',
  },
  {
    id: 'ripple-delete',
    keys: ['Shift', 'Backspace'],
    description: 'Ripple Delete',
    category: 'clips',
  },
  {
    id: 'mark-in',
    keys: ['I'],
    description: 'Mark In Point',
    category: 'clips',
  },
  {
    id: 'mark-out',
    keys: ['O'],
    description: 'Mark Out Point',
    category: 'clips',
  },

  // Timeline
  {
    id: 'zoom-in',
    keys: ['⌘', '='],
    description: 'Zoom In',
    category: 'timeline',
  },
  {
    id: 'zoom-out',
    keys: ['⌘', '-'],
    description: 'Zoom Out',
    category: 'timeline',
  },
  {
    id: 'fit-timeline',
    keys: ['⌘', '0'],
    description: 'Fit to Window',
    category: 'timeline',
  },
  {
    id: 'add-marker',
    keys: ['M'],
    description: 'Add Marker',
    category: 'timeline',
  },
  {
    id: 'prev-marker',
    keys: [';'],
    description: 'Go to Previous Marker',
    category: 'timeline',
  },
  {
    id: 'next-marker',
    keys: ["'"],
    description: 'Go to Next Marker',
    category: 'timeline',
  },

  // Selection
  {
    id: 'select-all',
    keys: ['⌘', 'A'],
    description: 'Select All',
    category: 'selection',
  },
  {
    id: 'deselect',
    keys: ['Escape'],
    description: 'Deselect All',
    category: 'selection',
  },
  {
    id: 'select-at-playhead',
    keys: ['D'],
    description: 'Select Clip at Playhead',
    category: 'selection',
  },

  // View
  {
    id: 'toggle-left-panel',
    keys: ['⌘', 'Shift', '['],
    description: 'Toggle Left Panel',
    category: 'view',
  },
  {
    id: 'toggle-right-panel',
    keys: ['⌘', 'Shift', ']'],
    description: 'Toggle Right Panel',
    category: 'view',
  },
  {
    id: 'reset-layout',
    keys: ['⌘', 'Shift', '\\'],
    description: 'Reset Layout',
    category: 'view',
  },
  {
    id: 'keyboard-shortcuts',
    keys: ['?'],
    description: 'Show Keyboard Shortcuts',
    category: 'view',
  },
  {
    id: 'keyboard-shortcuts-alt',
    keys: ['⌘', '/'],
    description: 'Show Keyboard Shortcuts',
    category: 'view',
  },

  // File
  {
    id: 'save',
    keys: ['⌘', 'S'],
    description: 'Save Project',
    category: 'file',
  },
  {
    id: 'export',
    keys: ['⌘', 'E'],
    description: 'Export Video',
    category: 'file',
  },
  {
    id: 'undo',
    keys: ['⌘', 'Z'],
    description: 'Undo',
    category: 'file',
  },
  {
    id: 'redo',
    keys: ['⌘', 'Shift', 'Z'],
    description: 'Redo',
    category: 'file',
  },
];

/**
 * Get friendly category names for display
 */
export const CATEGORY_NAMES: Record<ShortcutCategory, string> = {
  playback: 'Playback',
  timeline: 'Timeline',
  clips: 'Clips',
  selection: 'Selection',
  view: 'View',
  file: 'File',
};

/**
 * Get shortcuts grouped by category
 */
export function getShortcutsByCategory(): Record<ShortcutCategory, KeyboardShortcut[]> {
  return KEYBOARD_SHORTCUTS.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<ShortcutCategory, KeyboardShortcut[]>
  );
}

/**
 * Replace ⌘ symbol with platform-appropriate modifier key
 */
export function getPlatformModifier(): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  return isMac ? '⌘' : 'Ctrl';
}

/**
 * Format shortcut keys for display
 */
export function formatShortcutKeys(keys: string[]): string {
  return keys.map((key) => (key === '⌘' ? getPlatformModifier() : key)).join(' + ');
}
