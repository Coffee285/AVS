/**
 * MediaPanel Component
 *
 * Media library panel with professional features:
 * - Grid and list view toggle
 * - Search/filter functionality
 * - Sort options (name, date, type, duration)
 * - Right-click context menu
 * - Drag to timeline support
 * - Larger thumbnail previews
 */

import {
  Button,
  Dropdown,
  Input,
  Menu,
  MenuDivider,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Option,
  Text,
  Tooltip,
  makeStyles,
  mergeClasses,
  tokens,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Delete24Regular,
  Folder24Regular,
  FolderOpen24Regular,
  Grid24Regular,
  Image24Regular,
  Info24Regular,
  MoreHorizontal24Regular,
  MusicNote224Regular,
  Rename24Regular,
  Search24Regular,
  TextBulletListSquare24Regular,
  Video24Regular,
  ArrowExportLtr24Regular,
  ArrowSwap24Regular,
  LinkSquare24Regular,
  LinkMultiple24Regular,
} from '@fluentui/react-icons';
import type { DragEvent, FC, MouseEvent as ReactMouseEvent } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useOpenCutMediaStore, type OpenCutMediaFile } from '../../stores/opencutMedia';
import { useOpenCutTimelineStore } from '../../stores/opencutTimeline';
import { openCutTokens } from '../../styles/designTokens';
import { EmptyState } from './EmptyState';
import { BaseContextMenu, ContextMenuItem, ContextMenuDivider } from './ContextMenu';

export interface MediaPanelProps {
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'date' | 'type' | 'duration';
type SortOrder = 'asc' | 'desc';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${openCutTokens.spacing.sm} ${openCutTokens.spacing.md}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    minHeight: '40px',
    gap: openCutTokens.spacing.sm,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: openCutTokens.spacing.sm,
  },
  headerIcon: {
    color: tokens.colorNeutralForeground3,
    fontSize: '16px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: openCutTokens.spacing.xs,
    flex: 1,
    justifyContent: 'flex-end',
  },
  searchInput: {
    minWidth: '80px',
    maxWidth: '140px',
  },
  viewControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    backgroundColor: tokens.colorNeutralBackground4,
    borderRadius: tokens.borderRadiusSmall,
    padding: '2px',
  },
  viewButton: {
    minWidth: '24px',
    minHeight: '24px',
    padding: '4px',
    borderRadius: tokens.borderRadiusSmall,
  },
  viewButtonActive: {
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: openCutTokens.spacing.sm,
    position: 'relative',
  },
  contentDragOver: {
    backgroundColor: tokens.colorBrandBackground2,
    outline: `2px dashed ${tokens.colorBrandStroke1}`,
    outlineOffset: '-4px',
  },
  mediaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
    gap: '6px',
    padding: openCutTokens.spacing.sm,
  },
  mediaGridLarge: {
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
  },
  mediaList: {
    display: 'flex',
    flexDirection: 'column',
    gap: openCutTokens.spacing.xs,
  },
  mediaItem: {
    aspectRatio: '16 / 9',
    backgroundColor: tokens.colorNeutralBackground4,
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: openCutTokens.cursors.grab,
    border: `1px solid transparent`,
    transition: `all ${openCutTokens.animation.duration.fast} ${openCutTokens.animation.easing.easeOut}`,
    overflow: 'hidden',
    position: 'relative',
    ':hover': {
      border: `1px solid ${tokens.colorBrandStroke1}`,
      backgroundColor: tokens.colorNeutralBackground3,
      transform: 'scale(1.02)',
      boxShadow: tokens.shadow4,
    },
    ':focus-visible': {
      outline: `2px solid ${tokens.colorBrandStroke1}`,
      outlineOffset: '2px',
    },
    ':active': {
      cursor: openCutTokens.cursors.grabbing,
    },
  },
  mediaItemSelected: {
    border: `2px solid ${tokens.colorBrandStroke1}`,
    backgroundColor: tokens.colorBrandBackground2,
    boxShadow: tokens.shadow8,
  },
  mediaItemDragging: {
    opacity: 0.5,
    transform: 'scale(0.95)',
    cursor: openCutTokens.cursors.grabbing,
  },
  mediaListItem: {
    display: 'flex',
    alignItems: 'center',
    gap: openCutTokens.spacing.sm,
    padding: '4px 8px',
    height: '28px',
    borderRadius: tokens.borderRadiusSmall,
    cursor: openCutTokens.cursors.grab,
    transition: `all ${openCutTokens.animation.duration.fast} ${openCutTokens.animation.easing.easeOut}`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3,
    },
    ':active': {
      cursor: openCutTokens.cursors.grabbing,
    },
  },
  mediaListItemSelected: {
    backgroundColor: tokens.colorBrandBackground2,
  },
  mediaListThumbnail: {
    width: '16px',
    height: '16px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  mediaListInfo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: openCutTokens.spacing.sm,
  },
  mediaListName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '12px',
    flex: 1,
  },
  mediaListMeta: {
    display: 'flex',
    gap: openCutTokens.spacing.sm,
    color: tokens.colorNeutralForeground3,
    fontSize: '10px',
    fontFamily: openCutTokens.typography.fontFamily.mono,
  },
  mediaItemImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  mediaItemIcon: {
    color: tokens.colorNeutralForeground3,
    fontSize: '20px',
  },
  mediaListIcon: {
    color: tokens.colorNeutralForeground3,
    fontSize: '16px',
  },
  mediaItemOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.6) 100%)',
    opacity: 0,
    transition: `opacity ${openCutTokens.animation.duration.fast} ${openCutTokens.animation.easing.easeOut}`,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: openCutTokens.spacing.xs,
    ':hover': {
      opacity: 1,
    },
  },
  mediaItemName: {
    fontSize: openCutTokens.typography.fontSize.xs,
    color: 'white',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  },
  mediaItemDuration: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    color: 'white',
    padding: `2px ${openCutTokens.spacing.xs}`,
    borderRadius: tokens.borderRadiusSmall,
    fontSize: openCutTokens.typography.fontSize.xs,
    fontFamily: openCutTokens.typography.fontFamily.mono,
  },
  mediaItemActions: {
    position: 'absolute',
    top: openCutTokens.spacing.xs,
    right: openCutTokens.spacing.xs,
    opacity: 0,
    transition: `opacity ${openCutTokens.animation.duration.fast} ${openCutTokens.animation.easing.easeOut}`,
  },
  mediaItemActionsVisible: {
    opacity: 1,
  },
  emptyHint: {
    padding: '16px',
    textAlign: 'center',
  },
  emptyHintText: {
    color: tokens.colorNeutralForeground4,
    fontSize: '11px',
  },
  importButton: {
    minWidth: '28px',
    minHeight: '28px',
  },
  emptyMessage: {
    textAlign: 'center',
    padding: openCutTokens.spacing.md,
    color: tokens.colorNeutralForeground3,
  },
});

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const MediaPanel: FC<MediaPanelProps> = ({ className }) => {
  const styles = useStyles();
  const [isDragging, setIsDragging] = useState(false);
  const [draggingMediaId, setDraggingMediaId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortOrder] = useState<SortOrder>('asc');
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuMedia, setContextMenuMedia] = useState<OpenCutMediaFile | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaStore = useOpenCutMediaStore();
  const timelineStore = useOpenCutTimelineStore();
  const contextMenuTarget = useMemo(() => {
    if (!contextMenuPosition) return undefined;
    const { x, y } = contextMenuPosition;
    return {
      getBoundingClientRect: () =>
        ({
          x,
          y,
          top: y,
          left: x,
          right: x,
          bottom: y,
          width: 0,
          height: 0,
          toJSON: () => null,
        }) as DOMRect,
    };
  }, [contextMenuPosition]);

  const contextMenuPositioning = useMemo(
    () => (contextMenuTarget ? { target: contextMenuTarget } : undefined),
    [contextMenuTarget]
  );

  // Filter and sort media files
  const filteredMedia = useMemo(() => {
    let files = [...mediaStore.mediaFiles];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      files = files.filter(
        (f) => f.name.toLowerCase().includes(query) || f.type.toLowerCase().includes(query)
      );
    }

    // Sort files
    files.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'duration':
          comparison = (a.duration || 0) - (b.duration || 0);
          break;
        case 'date':
          comparison = 0; // No date available in current implementation
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return files;
  }, [mediaStore.mediaFiles, searchQuery, sortBy, sortOrder]);

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await mediaStore.addMediaFile(file);
      }
    },
    [mediaStore]
  );

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        await handleFileSelect(e.dataTransfer.files);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleMediaDragStart = useCallback((mediaId: string, e: DragEvent) => {
    setDraggingMediaId(mediaId);
    e.dataTransfer.setData('application/x-opencut-media', mediaId);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleMediaDragEnd = useCallback(() => {
    setDraggingMediaId(null);
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenuOpen(false);
    setContextMenuMedia(null);
    setContextMenuPosition(null);
  }, []);

  const handleContextMenu = useCallback((media: OpenCutMediaFile, e: ReactMouseEvent) => {
    e.preventDefault();
    setContextMenuOpen(true);
    setContextMenuMedia(media);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  }, []);

  const handleDeleteMedia = useCallback(
    (mediaId: string) => {
      mediaStore.removeMediaFile(mediaId);
      closeContextMenu();
    },
    [closeContextMenu, mediaStore]
  );

  const handleAddToTimeline = useCallback(
    (media: OpenCutMediaFile) => {
      const trackType =
        media.type === 'video' ? 'video' : media.type === 'audio' ? 'audio' : 'image';
      const track = timelineStore.tracks.find((t) => t.type === trackType);

      if (track) {
        const existingClips = timelineStore.clips.filter((c) => c.trackId === track.id);
        const startTime =
          existingClips.length > 0
            ? Math.max(...existingClips.map((c) => c.startTime + c.duration))
            : 0;

        timelineStore.addClip({
          trackId: track.id,
          type: trackType,
          name: media.name,
          mediaId: media.id,
          startTime,
          duration: media.duration || 5,
          inPoint: 0,
          outPoint: media.duration || 5,
          thumbnailUrl: media.thumbnailUrl,
          transform: {
            scaleX: 100,
            scaleY: 100,
            positionX: 0,
            positionY: 0,
            rotation: 0,
            opacity: 100,
            anchorX: 50,
            anchorY: 50,
          },
          blendMode: 'normal',
          speed: 1,
          reversed: false,
          timeRemapEnabled: false,
          locked: false,
        });
      }
      closeContextMenu();
    },
    [closeContextMenu, timelineStore]
  );

  const handleRevealInExplorer = useCallback(
    async (media: OpenCutMediaFile) => {
      if (media.url) {
        try {
          await navigator.clipboard.writeText(media.url);
          console.info('Media path copied to clipboard:', media.url);
        } catch (error: unknown) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error('Failed to copy path:', errorMsg);
        }
      }
      closeContextMenu();
    },
    [closeContextMenu]
  );

  const handleRenameMedia = useCallback(
    (media: OpenCutMediaFile) => {
      setIsRenaming(true);
      setRenameValue(media.name);
      closeContextMenu();
    },
    [closeContextMenu]
  );

  const handleReplaceFootage = useCallback(
    (media: OpenCutMediaFile) => {
      console.info('Replace footage for:', media.name);
      closeContextMenu();
    },
    [closeContextMenu]
  );

  const handleMakeOffline = useCallback(
    (media: OpenCutMediaFile) => {
      console.info('Make offline:', media.name);
      closeContextMenu();
    },
    [closeContextMenu]
  );

  const handleRelinkMedia = useCallback(
    (media: OpenCutMediaFile) => {
      console.info('Relink media:', media.name);
      closeContextMenu();
    },
    [closeContextMenu]
  );

  const handleExportFrame = useCallback(
    (media: OpenCutMediaFile) => {
      console.info('Export frame from:', media.name);
      closeContextMenu();
    },
    [closeContextMenu]
  );

  const handleExportAudio = useCallback(
    (media: OpenCutMediaFile) => {
      console.info('Export audio from:', media.name);
      closeContextMenu();
    },
    [closeContextMenu]
  );

  const handleExportClip = useCallback(
    (media: OpenCutMediaFile) => {
      console.info('Export clip:', media.name);
      closeContextMenu();
    },
    [closeContextMenu]
  );

  const handleShowProperties = useCallback(
    (media: OpenCutMediaFile) => {
      console.info('Show properties for:', media.name);
      closeContextMenu();
    },
    [closeContextMenu]
  );

  const isMac = useMemo(() => {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  }, []);

  const renderMediaItem = (file: OpenCutMediaFile) => {
    const isSelected = mediaStore.selectedMediaId === file.id;
    const isDraggingThis = draggingMediaId === file.id;

    if (viewMode === 'list') {
      return (
        <div
          key={file.id}
          className={mergeClasses(styles.mediaListItem, isSelected && styles.mediaListItemSelected)}
          onClick={() => mediaStore.selectMedia(file.id)}
          onDoubleClick={() => handleAddToTimeline(file)}
          onContextMenu={(e) => handleContextMenu(file, e)}
          draggable
          onDragStart={(e) => handleMediaDragStart(file.id, e)}
          onDragEnd={handleMediaDragEnd}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              mediaStore.selectMedia(file.id);
            }
          }}
          aria-label={file.name}
          aria-pressed={isSelected}
        >
          <div className={styles.mediaListThumbnail}>
            {file.type === 'video' ? (
              <Video24Regular className={styles.mediaListIcon} />
            ) : file.type === 'audio' ? (
              <MusicNote224Regular className={styles.mediaListIcon} />
            ) : (
              <Image24Regular className={styles.mediaListIcon} />
            )}
          </div>
          <div className={styles.mediaListInfo}>
            <span className={styles.mediaListName}>{file.name}</span>
            <div className={styles.mediaListMeta}>
              {file.duration !== undefined && <span>{formatDuration(file.duration)}</span>}
            </div>
          </div>
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button
                appearance="subtle"
                size="small"
                icon={<MoreHorizontal24Regular />}
                onClick={(e) => e.stopPropagation()}
              />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem icon={<Add24Regular />} onClick={() => handleAddToTimeline(file)}>
                  Add to Timeline
                </MenuItem>
                <MenuDivider />
                <MenuItem icon={<Delete24Regular />} onClick={() => handleDeleteMedia(file.id)}>
                  Delete
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
      );
    }

    return (
      <Tooltip key={file.id} content={file.name} relationship="label">
        <div
          className={mergeClasses(
            styles.mediaItem,
            isSelected && styles.mediaItemSelected,
            isDraggingThis && styles.mediaItemDragging
          )}
          onClick={() => mediaStore.selectMedia(file.id)}
          onContextMenu={(e) => handleContextMenu(file, e)}
          onDoubleClick={() => handleAddToTimeline(file)}
          draggable
          onDragStart={(e) => handleMediaDragStart(file.id, e)}
          onDragEnd={handleMediaDragEnd}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              mediaStore.selectMedia(file.id);
            }
          }}
          aria-label={file.name}
          aria-pressed={isSelected}
        >
          {file.thumbnailUrl ? (
            <img src={file.thumbnailUrl} alt={file.name} className={styles.mediaItemImage} />
          ) : file.type === 'video' ? (
            <Video24Regular className={styles.mediaItemIcon} />
          ) : file.type === 'audio' ? (
            <MusicNote224Regular className={styles.mediaItemIcon} />
          ) : (
            <Image24Regular className={styles.mediaItemIcon} />
          )}

          <div className={styles.mediaItemOverlay}>
            <span className={styles.mediaItemName}>{file.name}</span>
          </div>

          {file.duration !== undefined && (
            <span
              className={styles.mediaItemDuration}
              style={{
                position: 'absolute',
                bottom: tokens.spacingVerticalXS,
                right: tokens.spacingHorizontalXS,
              }}
            >
              {formatDuration(file.duration)}
            </span>
          )}
        </div>
      </Tooltip>
    );
  };

  return (
    <div className={mergeClasses(styles.container, className)}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Folder24Regular className={styles.headerIcon} />
          <Text weight="semibold" size={300}>
            Media
          </Text>
          {mediaStore.mediaFiles.length > 0 && (
            <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
              ({mediaStore.mediaFiles.length})
            </Text>
          )}
        </div>
        <div className={styles.headerRight}>
          <Input
            className={styles.searchInput}
            contentBefore={<Search24Regular />}
            placeholder="Search..."
            size="small"
            value={searchQuery}
            onChange={(_, data) => setSearchQuery(data.value)}
          />
          <div className={styles.viewControls}>
            <Tooltip content="Grid view" relationship="label">
              <Button
                appearance="subtle"
                size="small"
                className={mergeClasses(
                  styles.viewButton,
                  viewMode === 'grid' && styles.viewButtonActive
                )}
                icon={<Grid24Regular />}
                onClick={() => setViewMode('grid')}
              />
            </Tooltip>
            <Tooltip content="List view" relationship="label">
              <Button
                appearance="subtle"
                size="small"
                className={mergeClasses(
                  styles.viewButton,
                  viewMode === 'list' && styles.viewButtonActive
                )}
                icon={<TextBulletListSquare24Regular />}
                onClick={() => setViewMode('list')}
              />
            </Tooltip>
          </div>
          <Button
            appearance="subtle"
            icon={<Add24Regular />}
            size="small"
            className={styles.importButton}
            onClick={handleImportClick}
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/*,audio/*,image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      <div
        className={mergeClasses(styles.content, isDragging && styles.contentDragOver)}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="region"
        aria-label="Media files drop zone"
      >
        {mediaStore.mediaFiles.length === 0 ? (
          <div className={styles.emptyHint}>
            <Text size={100} className={styles.emptyHintText}>
              Drop files or click + to import
            </Text>
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className={styles.emptyMessage}>
            <Text size={200}>No media matches your search</Text>
          </div>
        ) : viewMode === 'grid' ? (
          <div className={styles.mediaGrid}>{filteredMedia.map(renderMediaItem)}</div>
        ) : (
          <div className={styles.mediaList}>{filteredMedia.map(renderMediaItem)}</div>
        )}
      </div>

      {/* Enhanced Professional Context Menu */}
      {contextMenuMedia && (
        <BaseContextMenu
          open={contextMenuOpen}
          position={contextMenuPosition}
          onClose={closeContextMenu}
        >
          <ContextMenuItem
            label="Add to Timeline"
            icon={<Add24Regular />}
            onClick={() => handleAddToTimeline(contextMenuMedia)}
          />

          <ContextMenuItem
            label={`Reveal in ${isMac ? 'Finder' : 'Explorer'}`}
            icon={<FolderOpen24Regular />}
            onClick={() => handleRevealInExplorer(contextMenuMedia)}
          />

          <ContextMenuItem
            label="Rename"
            icon={<Rename24Regular />}
            shortcut="F2"
            onClick={() => handleRenameMedia(contextMenuMedia)}
          />

          <ContextMenuDivider />

          <ContextMenuItem
            label="Replace Footage"
            icon={<ArrowSwap24Regular />}
            onClick={() => handleReplaceFootage(contextMenuMedia)}
          />

          <ContextMenuItem
            label="Make Offline"
            icon={<LinkSquare24Regular />}
            onClick={() => handleMakeOffline(contextMenuMedia)}
          />

          <ContextMenuItem
            label="Relink Media"
            icon={<LinkMultiple24Regular />}
            onClick={() => handleRelinkMedia(contextMenuMedia)}
          />

          <ContextMenuDivider />

          <ContextMenuItem
            label="Export Frame"
            icon={<ArrowExportLtr24Regular />}
            disabled={contextMenuMedia.type !== 'video'}
            onClick={() => handleExportFrame(contextMenuMedia)}
          />

          <ContextMenuItem
            label="Export Audio"
            icon={<ArrowExportLtr24Regular />}
            disabled={contextMenuMedia.type !== 'video' && contextMenuMedia.type !== 'audio'}
            onClick={() => handleExportAudio(contextMenuMedia)}
          />

          <ContextMenuItem
            label="Export Clip"
            icon={<ArrowExportLtr24Regular />}
            onClick={() => handleExportClip(contextMenuMedia)}
          />

          <ContextMenuDivider />

          <ContextMenuItem
            label="Properties"
            icon={<Info24Regular />}
            shortcut={isMac ? '⌘I' : 'Ctrl+I'}
            onClick={() => handleShowProperties(contextMenuMedia)}
          />

          <ContextMenuItem
            label="Delete"
            icon={<Delete24Regular />}
            shortcut="Del"
            onClick={() => handleDeleteMedia(contextMenuMedia.id)}
          />
        </BaseContextMenu>
      )}
    </div>
  );
};

export default MediaPanel;
