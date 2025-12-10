/**
 * Keyboard Shortcuts Overlay
 *
 * Displays all available keyboard shortcuts organized by category.
 * Users can search for specific shortcuts and view them in a clean,
 * organized layout.
 *
 * Triggered by pressing '?' or Cmd/Ctrl + '/'
 */

import {
  makeStyles,
  tokens,
  Text,
  Button,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  Input,
  Label,
  Divider,
} from '@fluentui/react-components';
import { Dismiss24Regular, Search24Regular } from '@fluentui/react-icons';
import { useState, useMemo, useCallback } from 'react';
import type { FC } from 'react';
import {
  KEYBOARD_SHORTCUTS,
  CATEGORY_NAMES,
  formatShortcutKeys,
  type KeyboardShortcut,
  type ShortcutCategory,
} from '../../constants/keyboardShortcuts';
import { openCutTokens } from '../../styles/designTokens';

export interface KeyboardShortcutsOverlayProps {
  open: boolean;
  onClose: () => void;
}

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: '900px',
    width: '90vw',
    maxHeight: '85vh',
  },
  dialogTitle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingVerticalL,
  },
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    overflow: 'auto',
  },
  searchContainer: {
    marginBottom: tokens.spacingVerticalM,
  },
  categoriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: tokens.spacingVerticalXL,
    marginTop: tokens.spacingVerticalM,
  },
  categorySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  categoryTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: 600,
    color: tokens.colorBrandForeground1,
    marginBottom: tokens.spacingVerticalXS,
  },
  shortcutsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  shortcutRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground3,
    transition: 'background-color 0.15s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
  },
  shortcutDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
    flex: 1,
  },
  shortcutKeys: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  key: {
    padding: `2px ${tokens.spacingHorizontalXS}`,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    fontSize: tokens.fontSizeBase200,
    fontFamily: 'monospace',
    color: tokens.colorNeutralForeground2,
    minWidth: '24px',
    textAlign: 'center',
    boxShadow: `0 2px 0 ${tokens.colorNeutralStroke2}`,
  },
  keySeparator: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  emptyState: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3,
  },
  footer: {
    marginTop: tokens.spacingVerticalL,
    paddingTop: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    textAlign: 'center',
  },
  footerText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  closeButton: {
    minWidth: 'auto',
  },
});

/**
 * Render a keyboard shortcut key badge
 */
const KeyBadge: FC<{ keyName: string; className?: string }> = ({ keyName, className }) => {
  return <span className={className}>{keyName}</span>;
};

/**
 * Render a shortcut row with description and keys
 */
const ShortcutRow: FC<{ shortcut: KeyboardShortcut; styles: ReturnType<typeof useStyles> }> = ({
  shortcut,
  styles,
}) => {
  return (
    <div className={styles.shortcutRow}>
      <Text className={styles.shortcutDescription}>{shortcut.description}</Text>
      <div className={styles.shortcutKeys}>
        {shortcut.keys.map((key, index) => (
          <span key={index}>
            <KeyBadge keyName={formatShortcutKeys([key])} className={styles.key} />
            {index < shortcut.keys.length - 1 && (
              <span className={styles.keySeparator}> + </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
};

/**
 * Render a category section with its shortcuts
 */
const CategorySection: FC<{
  category: ShortcutCategory;
  shortcuts: KeyboardShortcut[];
  styles: ReturnType<typeof useStyles>;
}> = ({ category, shortcuts, styles }) => {
  if (shortcuts.length === 0) return null;

  return (
    <div className={styles.categorySection}>
      <Text className={styles.categoryTitle}>{CATEGORY_NAMES[category]}</Text>
      <div className={styles.shortcutsList}>
        {shortcuts.map((shortcut) => (
          <ShortcutRow key={shortcut.id} shortcut={shortcut} styles={styles} />
        ))}
      </div>
    </div>
  );
};

/**
 * Main Keyboard Shortcuts Overlay Component
 */
export const KeyboardShortcutsOverlay: FC<KeyboardShortcutsOverlayProps> = ({ open, onClose }) => {
  const styles = useStyles();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter shortcuts based on search query
  const filteredShortcuts = useMemo(() => {
    if (!searchQuery.trim()) {
      return KEYBOARD_SHORTCUTS;
    }

    const query = searchQuery.toLowerCase();
    return KEYBOARD_SHORTCUTS.filter(
      (shortcut) =>
        shortcut.description.toLowerCase().includes(query) ||
        shortcut.keys.some((key) => key.toLowerCase().includes(query)) ||
        CATEGORY_NAMES[shortcut.category].toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Group filtered shortcuts by category
  const shortcutsByCategory = useMemo(() => {
    const grouped: Record<ShortcutCategory, KeyboardShortcut[]> = {
      playback: [],
      timeline: [],
      clips: [],
      selection: [],
      view: [],
      file: [],
    };

    filteredShortcuts.forEach((shortcut) => {
      grouped[shortcut.category].push(shortcut);
    });

    return grouped;
  }, [filteredShortcuts]);

  // Handle search input change
  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(event.target.value);
    },
    []
  );

  // Handle dialog open change (for Escape key and click outside)
  const handleOpenChange = useCallback(
    (_event: unknown, data: { open: boolean }) => {
      if (!data.open) {
        onClose();
      }
    },
    [onClose]
  );

  // Order of categories to display
  const categoryOrder: ShortcutCategory[] = [
    'playback',
    'clips',
    'timeline',
    'selection',
    'view',
    'file',
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody>
          <div className={styles.dialogTitle}>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <Button
              appearance="subtle"
              icon={<Dismiss24Regular />}
              onClick={onClose}
              className={styles.closeButton}
              aria-label="Close"
            />
          </div>
          <DialogContent className={styles.dialogContent}>
            {/* Search input */}
            <div className={styles.searchContainer}>
              <Label htmlFor="shortcut-search">Search shortcuts</Label>
              <Input
                id="shortcut-search"
                placeholder="Search by name, key, or category..."
                value={searchQuery}
                onChange={handleSearchChange}
                contentBefore={<Search24Regular />}
                autoFocus
              />
            </div>

            {/* Shortcuts grouped by category */}
            {filteredShortcuts.length === 0 ? (
              <div className={styles.emptyState}>
                <Text>No shortcuts found matching "{searchQuery}"</Text>
              </div>
            ) : (
              <div className={styles.categoriesGrid}>
                {categoryOrder.map((category) => (
                  <CategorySection
                    key={category}
                    category={category}
                    shortcuts={shortcutsByCategory[category]}
                    styles={styles}
                  />
                ))}
              </div>
            )}

            {/* Footer */}
            <div className={styles.footer}>
              <Text className={styles.footerText}>
                Press <KeyBadge keyName="?" className={styles.key} /> or{' '}
                <KeyBadge keyName={formatShortcutKeys(['⌘'])} className={styles.key} />{' '}
                <KeyBadge keyName="/" className={styles.key} /> to show this dialog
              </Text>
            </div>
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default KeyboardShortcutsOverlay;
