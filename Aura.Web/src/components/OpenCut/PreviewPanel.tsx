/**
 * PreviewPanel Component
 *
 * Enhanced preview area with professional features:
 * - Safe area guides toggle (title safe, action safe)
 * - Zoom controls (fit, 100%, custom zoom)
 * - Quality selector for preview
 * - Timecode overlay option
 * - Loop playback toggle
 */

import {
  Button,
  Menu,
  MenuDivider,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Spinner,
  Text,
  Tooltip,
  makeStyles,
  mergeClasses,
  tokens,
  type MenuOpenChangeData,
} from '@fluentui/react-components';
import {
  ArrowExportLtr24Regular,
  ArrowRepeatAll24Regular,
  Copy24Regular,
  Grid24Regular,
  Image24Regular,
  Play24Regular,
  Pause24Regular,
  Settings24Regular,
  Timer24Regular,
  Video24Regular,
  ZoomFit24Regular,
  ZoomIn24Regular,
  ZoomOut24Regular,
  ChevronLeft24Regular,
  ChevronRight24Regular,
  FullScreenMaximize24Regular,
  CheckmarkCircle24Regular,
} from '@fluentui/react-icons';
import { BaseContextMenu, ContextMenuItem, ContextMenuDivider } from './ContextMenu';
import { motion } from 'framer-motion';
import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOpenCutMediaStore } from '../../stores/opencutMedia';
import { useOpenCutPlaybackStore } from '../../stores/opencutPlayback';
import { useOpenCutProjectStore } from '../../stores/opencutProject';
import { useOpenCutTimelineStore } from '../../stores/opencutTimeline';
import { openCutTokens } from '../../styles/designTokens';
import { CaptionPreview } from './Captions';
import { ExportDialog } from './Export';
import { PlaybackControls } from './PlaybackControls';

export interface PreviewPanelProps {
  className?: string;
  isLoading?: boolean;
}

type PreviewQuality = 'quarter' | 'half' | 'full';
type ZoomLevel = 'fit' | 'fill' | '50' | '100' | '200';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${openCutTokens.spacing.xs} ${openCutTokens.spacing.md}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    backgroundColor: tokens.colorNeutralBackground2,
    minHeight: openCutTokens.layout.toolbarHeight,
  },
  toolbarGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: openCutTokens.spacing.xs,
  },
  toolButton: {
    minWidth: openCutTokens.layout.controlButtonSizeCompact,
    minHeight: openCutTokens.layout.controlButtonSizeCompact,
  },
  toolButtonActive: {
    backgroundColor: tokens.colorNeutralBackground1Selected,
    color: tokens.colorBrandForeground1,
  },
  zoomText: {
    minWidth: '44px',
    textAlign: 'center',
    fontSize: openCutTokens.typography.fontSize.sm,
    color: tokens.colorNeutralForeground2,
    fontFamily: openCutTokens.typography.fontFamily.mono,
  },
  previewArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: openCutTokens.preview.containerPadding,
    backgroundColor: openCutTokens.preview.backgroundDark,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 0,
    minWidth: 0,
    boxShadow: openCutTokens.preview.innerShadow,
  },
  canvasWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 0,
    minWidth: 0,
  },
  canvas: {
    backgroundColor: openCutTokens.preview.canvasBackground,
    borderRadius: '2px',
    boxShadow: openCutTokens.preview.canvasShadow,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    transition: `width ${openCutTokens.preview.transitionDuration} ${openCutTokens.preview.transitionEasing}, height ${openCutTokens.preview.transitionDuration} ${openCutTokens.preview.transitionEasing}`,
  },
  canvasGlow: {
    position: 'absolute',
    inset: '-20px',
    background: 'radial-gradient(ellipse at center, rgba(0, 120, 212, 0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  safeAreaGuides: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 5,
  },
  safeAreaTitle: {
    position: 'absolute',
    top: '10%',
    left: '10%',
    right: '10%',
    bottom: '10%',
    border: '1px dashed rgba(255, 255, 255, 0.4)',
    borderRadius: openCutTokens.radius.xs,
  },
  safeAreaAction: {
    position: 'absolute',
    top: '5%',
    left: '5%',
    right: '5%',
    bottom: '5%',
    border: '1px dashed rgba(255, 255, 255, 0.25)',
    borderRadius: openCutTokens.radius.xs,
  },
  safeAreaLabel: {
    position: 'absolute',
    fontSize: openCutTokens.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    padding: `2px ${openCutTokens.spacing.xs}`,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: openCutTokens.radius.xs,
  },
  videoElement: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    borderRadius: openCutTokens.radius.lg,
  },
  videoElementFit: {
    objectFit: 'contain',
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
  },
  videoElement50: {
    objectFit: 'none',
    transform: 'scale(0.5)',
  },
  videoElement100: {
    objectFit: 'none',
  },
  videoElement200: {
    objectFit: 'none',
    transform: 'scale(2)',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '24px',
    zIndex: 1,
  },
  placeholderIcon: {
    width: openCutTokens.preview.emptyIconSize,
    height: openCutTokens.preview.emptyIconSize,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: openCutTokens.preview.emptyIconBackground,
    color: openCutTokens.preview.emptyIconColor,
  },
  placeholderText: {
    color: openCutTokens.preview.emptyTextColor,
    fontSize: openCutTokens.preview.emptyTextSize,
  },
  loadingOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: openCutTokens.radius.lg,
    gap: openCutTokens.spacing.md,
    zIndex: 2,
  },
  timecodeOverlay: {
    position: 'absolute',
    top: openCutTokens.spacing.md,
    left: openCutTokens.spacing.md,
    padding: `${openCutTokens.spacing.xxs} ${openCutTokens.spacing.sm}`,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    borderRadius: openCutTokens.radius.sm,
    fontSize: openCutTokens.typography.fontSize.sm,
    fontFamily: openCutTokens.typography.fontFamily.mono,
    zIndex: 3,
  },
  aspectRatioLabel: {
    position: 'absolute',
    bottom: openCutTokens.spacing.md,
    right: openCutTokens.spacing.md,
    padding: `${openCutTokens.spacing.xxs} ${openCutTokens.spacing.sm}`,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: 'rgba(255, 255, 255, 0.8)',
    borderRadius: openCutTokens.radius.sm,
    fontSize: openCutTokens.typography.fontSize.xs,
    fontFamily: openCutTokens.typography.fontFamily.mono,
    zIndex: 1,
  },
  qualityBadge: {
    position: 'absolute',
    top: openCutTokens.spacing.md,
    right: openCutTokens.spacing.md,
    padding: `${openCutTokens.spacing.xxs} ${openCutTokens.spacing.sm}`,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: 'rgba(255, 255, 255, 0.8)',
    borderRadius: openCutTokens.radius.sm,
    fontSize: openCutTokens.typography.fontSize.xs,
    zIndex: 1,
  },
});

function formatTimecode(seconds: number, fps: number = 30): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const f = Math.floor((seconds % 1) * fps);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
}

export const PreviewPanel: FC<PreviewPanelProps> = ({ className, isLoading = false }) => {
  const styles = useStyles();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoAspect, setVideoAspect] = useState(16 / 9);
  const [renderSize, setRenderSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Connect to stores
  const playbackStore = useOpenCutPlaybackStore();
  const timelineStore = useOpenCutTimelineStore();
  const mediaStore = useOpenCutMediaStore();
  const projectStore = useOpenCutProjectStore();

  const [showSafeAreas, setShowSafeAreas] = useState(false);
  const [showTimecode, setShowTimecode] = useState(false);
  const [loopPlayback, setLoopPlayback] = useState(false);
  const [zoom, setZoom] = useState<ZoomLevel>('fit');
  const [quality, setQuality] = useState<PreviewQuality>('full');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showGrid, setShowGrid] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(
    null
  );

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

  // Generate video source from timeline clips
  const videoSrc = useMemo(() => {
    // Get all video clips from Video 1 track
    const videoTrack = timelineStore.tracks.find((t) => t.type === 'video');
    if (!videoTrack) return undefined;

    const videoClips = timelineStore.clips
      .filter((c) => c.trackId === videoTrack.id && c.type === 'video')
      .sort((a, b) => a.startTime - b.startTime);

    if (videoClips.length === 0) return undefined;

    // For now, use the first video clip's media file
    const firstClip = videoClips[0];
    if (!firstClip.mediaId) return undefined;

    const mediaFile = mediaStore.getMediaById(firstClip.mediaId);
    return mediaFile?.url;
  }, [timelineStore.tracks, timelineStore.clips, mediaStore]);

  // Check if timeline has content
  const hasContent = timelineStore.clips.length > 0;

  // Sync video playback with playback store
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    const handleLoadedMetadata = () => {
      playbackStore.setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      // ARCHITECTURAL FIX: Always sync time updates, not just when playing
      // This was causing the bug where seeking while paused didn't update the preview
      // The check for isPlaying prevented video preview from updating during playhead drag
      playbackStore.setCurrentTime(video.currentTime);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoSrc, playbackStore]);

  // Sync playback state changes to video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    if (playbackStore.isPlaying) {
      video.play().catch((err: unknown) => {
        console.error('Failed to play video:', err);
        playbackStore.pause();
      });
    } else {
      video.pause();
    }
  }, [playbackStore.isPlaying, videoSrc, playbackStore]);

  // ARCHITECTURAL FIX: Sync video position from playback store (for seek/playhead drag)
  // This ensures the video element updates when the playhead is dragged while paused
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    // Only sync if there's a significant difference (avoid feedback loop)
    // Use 0.1 second threshold to avoid excessive updates
    if (Math.abs(video.currentTime - playbackStore.currentTime) > 0.1) {
      video.currentTime = playbackStore.currentTime;
    }
  }, [playbackStore.currentTime, videoSrc]);

  // Sync seek events to video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    const handleSeek = (e: Event) => {
      const customEvent = e as CustomEvent<{ time: number }>;
      video.currentTime = customEvent.detail.time;
    };

    window.addEventListener('opencut-playback-seek', handleSeek);

    return () => {
      window.removeEventListener('opencut-playback-seek', handleSeek);
    };
  }, [videoSrc]);

  // Sync volume and muted state to video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = playbackStore.volume;
    video.muted = playbackStore.muted;
  }, [playbackStore.volume, playbackStore.muted]);

  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {
        // Fullscreen request failed - browser may not support or user declined
      });
    } else {
      document.exitFullscreen().catch(() => {
        // Exit fullscreen failed - already not in fullscreen
      });
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    switch (zoom) {
      case 'fit':
        setZoom('fill');
        break;
      case 'fill':
        setZoom('50');
        break;
      case '50':
        setZoom('100');
        break;
      case '100':
        setZoom('200');
        break;
    }
  }, [zoom]);

  const handleZoomOut = useCallback(() => {
    switch (zoom) {
      case '200':
        setZoom('100');
        break;
      case '100':
        setZoom('50');
        break;
      case '50':
        setZoom('fill');
        break;
      case 'fill':
        setZoom('fit');
        break;
    }
  }, [zoom]);

  const getZoomPercent = () => {
    switch (zoom) {
      case 'fit':
        return 'Fit';
      case 'fill':
        return 'Fill';
      case '50':
        return '50%';
      case '100':
        return '100%';
      case '200':
        return '200%';
    }
  };

  // Intelligent preview dimension calculation
  const calculatePreviewDimensions = useCallback(() => {
    if (!canvasWrapperRef.current) return { width: 0, height: 0 };

    const container = canvasWrapperRef.current.getBoundingClientRect();
    const projectAspectRatio = projectStore.activeProject
      ? projectStore.activeProject.canvasWidth / projectStore.activeProject.canvasHeight
      : 16 / 9;

    // Available space (with padding)
    const padding = 16;
    const availableWidth = container.width - padding * 2;
    const availableHeight = container.height - padding * 2;
    const containerAspectRatio = availableWidth / availableHeight;

    let previewWidth: number;
    let previewHeight: number;

    switch (zoom) {
      case 'fit':
        // Fit entire video in view
        if (containerAspectRatio > projectAspectRatio) {
          // Container is wider - fit to height
          previewHeight = availableHeight;
          previewWidth = previewHeight * projectAspectRatio;
        } else {
          // Container is taller - fit to width
          previewWidth = availableWidth;
          previewHeight = previewWidth / projectAspectRatio;
        }
        break;

      case 'fill':
        // Fill container (may crop)
        if (containerAspectRatio > projectAspectRatio) {
          previewWidth = availableWidth;
          previewHeight = previewWidth / projectAspectRatio;
        } else {
          previewHeight = availableHeight;
          previewWidth = previewHeight * projectAspectRatio;
        }
        break;

      case '100':
        // Native resolution
        previewWidth = projectStore.activeProject?.canvasWidth || 1920;
        previewHeight = projectStore.activeProject?.canvasHeight || 1080;
        break;

      default: {
        // Custom zoom percentage (50%, 200%)
        const zoomValue = parseInt(zoom) / 100;
        previewWidth = (projectStore.activeProject?.canvasWidth || 1920) * zoomValue;
        previewHeight = (projectStore.activeProject?.canvasHeight || 1080) * zoomValue;
      }
    }

    return { width: previewWidth, height: previewHeight };
  }, [zoom, projectStore.activeProject]);

  const computeFittedSize = useCallback(
    (containerWidth: number, containerHeight: number) => {
      if (containerWidth <= 0 || containerHeight <= 0) {
        return { width: 0, height: 0 };
      }

      // Use intelligent preview dimensions calculation
      return calculatePreviewDimensions();
    },
    [calculatePreviewDimensions]
  );

  // Track video aspect ratio when metadata is available
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateAspect = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setVideoAspect(video.videoWidth / video.videoHeight);
      }
    };

    updateAspect();
    video.addEventListener('loadedmetadata', updateAspect);
    return () => {
      video.removeEventListener('loadedmetadata', updateAspect);
    };
  }, [videoSrc]);

  // Recompute fitted size on container resize or aspect changes
  useEffect(() => {
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) return;

    const updateSize = (width: number, height: number) => {
      setRenderSize(computeFittedSize(width, height));
    };

    const initialRect = wrapper.getBoundingClientRect();
    updateSize(initialRect.width, initialRect.height);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      updateSize(width, height);
    });
    resizeObserver.observe(wrapper);

    return () => {
      resizeObserver.disconnect();
    };
  }, [computeFittedSize]);

  const canvasStyle = useMemo(() => {
    if (renderSize.width <= 0 || renderSize.height <= 0) {
      return undefined;
    }
    return {
      width: `${renderSize.width}px`,
      height: `${renderSize.height}px`,
    };
  }, [renderSize.height, renderSize.width]);

  const getQualityLabel = () => {
    switch (quality) {
      case 'quarter':
        return '1/4';
      case 'half':
        return '1/2';
      case 'full':
        return 'Full';
    }
  };
  const canCopyFrame = Boolean(videoRef.current && videoRef.current.readyState >= 2);

  const handlePreviewContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setContextMenuOpen(true);
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenuOpen(false);
    setContextMenuPosition(null);
  }, []);

  const handleContextMenuOpenChange = useCallback((_: unknown, data: MenuOpenChangeData) => {
    setContextMenuOpen(data.open);
    if (!data.open) {
      setContextMenuPosition(null);
    }
  }, []);

  const handleFullscreenFromMenu = useCallback(() => {
    handleFullscreen();
    closeContextMenu();
  }, [closeContextMenu, handleFullscreen]);

  const handleTogglePlayback = useCallback(() => {
    if (playbackStore.isPlaying) {
      playbackStore.pause();
    } else {
      playbackStore.play();
    }
    closeContextMenu();
  }, [closeContextMenu, playbackStore]);

  const handleToggleLoop = useCallback(() => {
    setLoopPlayback((prev) => !prev);
    closeContextMenu();
  }, [closeContextMenu]);

  const handleToggleSafeAreas = useCallback(() => {
    setShowSafeAreas((prev) => !prev);
    closeContextMenu();
  }, [closeContextMenu]);

  const handleToggleTimecode = useCallback(() => {
    setShowTimecode((prev) => !prev);
    closeContextMenu();
  }, [closeContextMenu]);

  const handleZoomSelect = useCallback(
    (level: ZoomLevel) => {
      setZoom(level);
      closeContextMenu();
    },
    [closeContextMenu]
  );

  const handleQualitySelect = useCallback(
    (value: PreviewQuality) => {
      setQuality(value);
      closeContextMenu();
    },
    [closeContextMenu]
  );

  const handlePlaybackSpeedChange = useCallback(
    (speed: number) => {
      setPlaybackSpeed(speed);
      const video = videoRef.current;
      if (video) {
        video.playbackRate = speed;
      }
      closeContextMenu();
    },
    [closeContextMenu]
  );

  const handleExportFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `frame-${formatTimecode(playbackStore.currentTime)}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });

    closeContextMenu();
  }, [closeContextMenu, playbackStore.currentTime]);

  const handleSetPosterFrame = useCallback(() => {
    console.info('Set poster frame at:', playbackStore.currentTime);
    closeContextMenu();
  }, [closeContextMenu, playbackStore.currentTime]);

  const handleFrameStep = useCallback(
    (direction: 'forward' | 'backward') => {
      const video = videoRef.current;
      if (!video) return;

      const fps = projectStore.frameRate || 30;
      const frameDuration = 1 / fps;
      const newTime =
        direction === 'forward'
          ? video.currentTime + frameDuration
          : video.currentTime - frameDuration;

      video.currentTime = Math.max(0, Math.min(newTime, video.duration || 0));
      playbackStore.setCurrentTime(video.currentTime);
      closeContextMenu();
    },
    [closeContextMenu, playbackStore, projectStore.frameRate]
  );

  const handleToggleGrid = useCallback(() => {
    setShowGrid((prev) => !prev);
    closeContextMenu();
  }, [closeContextMenu]);

  const isMac = useMemo(() => {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  }, []);

  const handleCopyFrameToClipboard = useCallback(async () => {
    try {
      const video = videoRef.current;
      if (!video || !video.videoWidth || !video.videoHeight) {
        return;
      }

      if (typeof ClipboardItem === 'undefined') {
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((result) => resolve(result), 'image/png')
      );

      if (!blob || !navigator.clipboard?.write) return;

      const clipboardItem = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([clipboardItem]);
    } catch (error) {
      console.warn('Unable to copy frame to clipboard', error);
    } finally {
      closeContextMenu();
    }
  }, [closeContextMenu]);

  return (
    <div ref={containerRef} className={mergeClasses(styles.container, className)}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          {/* Zoom Controls */}
          <Tooltip content="Zoom out" relationship="label">
            <Button
              appearance="subtle"
              size="small"
              className={styles.toolButton}
              icon={<ZoomOut24Regular />}
              onClick={handleZoomOut}
              disabled={zoom === 'fit'}
            />
          </Tooltip>
          <Text className={styles.zoomText}>{getZoomPercent()}</Text>
          <Tooltip content="Zoom in" relationship="label">
            <Button
              appearance="subtle"
              size="small"
              className={styles.toolButton}
              icon={<ZoomIn24Regular />}
              onClick={handleZoomIn}
              disabled={zoom === '200'}
            />
          </Tooltip>
          <Tooltip content="Fit to window" relationship="label">
            <Button
              appearance="subtle"
              size="small"
              className={mergeClasses(styles.toolButton, zoom === 'fit' && styles.toolButtonActive)}
              icon={<ZoomFit24Regular />}
              onClick={() => setZoom('fit')}
            />
          </Tooltip>
        </div>

        <div className={styles.toolbarGroup}>
          {/* Safe Areas Toggle */}
          <Tooltip content="Toggle safe area guides" relationship="label">
            <Button
              appearance="subtle"
              size="small"
              className={mergeClasses(styles.toolButton, showSafeAreas && styles.toolButtonActive)}
              icon={<Grid24Regular />}
              onClick={() => setShowSafeAreas(!showSafeAreas)}
            />
          </Tooltip>

          {/* Timecode Toggle */}
          <Tooltip content="Toggle timecode overlay" relationship="label">
            <Button
              appearance="subtle"
              size="small"
              className={mergeClasses(styles.toolButton, showTimecode && styles.toolButtonActive)}
              icon={<Timer24Regular />}
              onClick={() => setShowTimecode(!showTimecode)}
            />
          </Tooltip>

          {/* Loop Toggle */}
          <Tooltip content="Toggle loop playback" relationship="label">
            <Button
              appearance="subtle"
              size="small"
              className={mergeClasses(styles.toolButton, loopPlayback && styles.toolButtonActive)}
              icon={<ArrowRepeatAll24Regular />}
              onClick={() => setLoopPlayback(!loopPlayback)}
            />
          </Tooltip>

          {/* Quality Menu */}
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Tooltip content="Preview quality" relationship="label">
                <Button
                  appearance="subtle"
                  size="small"
                  className={styles.toolButton}
                  icon={<Settings24Regular />}
                />
              </Tooltip>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem onClick={() => setQuality('full')}>
                  Full Quality {quality === 'full' && '✓'}
                </MenuItem>
                <MenuItem onClick={() => setQuality('half')}>
                  Half Quality {quality === 'half' && '✓'}
                </MenuItem>
                <MenuItem onClick={() => setQuality('quarter')}>
                  Quarter Quality {quality === 'quarter' && '✓'}
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>

          {/* Export Button */}
          <ExportDialog
            trigger={
              <Tooltip content="Export video" relationship="label">
                <Button appearance="primary" size="small" icon={<ArrowExportLtr24Regular />}>
                  Export
                </Button>
              </Tooltip>
            }
          />
        </div>
      </div>

      <div className={styles.previewArea}>
        <div ref={canvasWrapperRef} className={styles.canvasWrapper}>
          <div className={styles.canvasGlow} />
          <motion.div
            className={styles.canvas}
            style={canvasStyle}
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onContextMenu={handlePreviewContextMenu}
          >
            {isLoading ? (
              <div className={styles.loadingOverlay}>
                <Spinner size="large" />
                <Text size={200} style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Loading preview...
                </Text>
              </div>
            ) : hasContent && videoSrc ? (
              /* eslint-disable-next-line jsx-a11y/media-has-caption */
              <video
                ref={videoRef}
                className={mergeClasses(
                  styles.videoElement,
                  zoom === 'fit' && styles.videoElementFit,
                  zoom === '50' && styles.videoElement50,
                  zoom === '100' && styles.videoElement100,
                  zoom === '200' && styles.videoElement200
                )}
                src={videoSrc}
                loop={loopPlayback}
              />
            ) : (
              <motion.div
                className={styles.placeholder}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className={styles.placeholderIcon}>
                  <Video24Regular />
                </div>
                <Text size={200} className={styles.placeholderText}>
                  Add media to preview
                </Text>
              </motion.div>
            )}

            {/* Safe Area Guides */}
            {showSafeAreas && (
              <div className={styles.safeAreaGuides}>
                <div className={styles.safeAreaAction}>
                  <span className={styles.safeAreaLabel} style={{ top: '-16px', left: '4px' }}>
                    Action Safe (95%)
                  </span>
                </div>
                <div className={styles.safeAreaTitle}>
                  <span className={styles.safeAreaLabel} style={{ top: '-16px', left: '4px' }}>
                    Title Safe (90%)
                  </span>
                </div>
              </div>
            )}

            {/* Timecode Overlay */}
            {showTimecode && (
              <div className={styles.timecodeOverlay}>
                {formatTimecode(playbackStore.currentTime)}
              </div>
            )}

            {/* Quality Badge */}
            {quality !== 'full' && <div className={styles.qualityBadge}>{getQualityLabel()}</div>}

            {/* Caption Preview Overlay */}
            <CaptionPreview />

            <div className={styles.aspectRatioLabel}>16:9</div>

            {/* Enhanced Professional Context Menu */}
            <BaseContextMenu
              open={contextMenuOpen}
              position={contextMenuPosition}
              onClose={closeContextMenu}
            >
              <ContextMenuItem
                label={playbackStore.isPlaying ? 'Pause' : 'Play'}
                icon={playbackStore.isPlaying ? <Pause24Regular /> : <Play24Regular />}
                shortcut="Space"
                onClick={handleTogglePlayback}
              />
              <ContextMenuItem
                label="Toggle Loop"
                icon={<ArrowRepeatAll24Regular />}
                shortcut={isMac ? '⌘L' : 'Ctrl+L'}
                checked={loopPlayback}
                onClick={handleToggleLoop}
              />

              <ContextMenuDivider />

              <ContextMenuItem
                label="25%"
                checked={playbackSpeed === 0.25}
                onClick={() => handlePlaybackSpeedChange(0.25)}
              />
              <ContextMenuItem
                label="50%"
                checked={playbackSpeed === 0.5}
                onClick={() => handlePlaybackSpeedChange(0.5)}
              />
              <ContextMenuItem
                label="100%"
                checked={playbackSpeed === 1}
                onClick={() => handlePlaybackSpeedChange(1)}
              />
              <ContextMenuItem
                label="200%"
                checked={playbackSpeed === 2}
                onClick={() => handlePlaybackSpeedChange(2)}
              />
              <ContextMenuItem
                label="400%"
                checked={playbackSpeed === 4}
                onClick={() => handlePlaybackSpeedChange(4)}
              />

              <ContextMenuDivider />

              <ContextMenuItem
                label="Export Frame"
                icon={<ArrowExportLtr24Regular />}
                shortcut={isMac ? '⌘⇧E' : 'Ctrl+Shift+E'}
                disabled={!videoSrc}
                onClick={handleExportFrame}
              />
              <ContextMenuItem
                label="Copy Frame"
                icon={<Copy24Regular />}
                shortcut={isMac ? '⌘⇧C' : 'Ctrl+Shift+C'}
                disabled={!canCopyFrame || !videoSrc}
                onClick={handleCopyFrameToClipboard}
              />
              <ContextMenuItem
                label="Set Poster Frame"
                icon={<CheckmarkCircle24Regular />}
                disabled={!videoSrc}
                onClick={handleSetPosterFrame}
              />
              <ContextMenuItem
                label="Previous Frame"
                icon={<ChevronLeft24Regular />}
                shortcut="←"
                disabled={!videoSrc}
                onClick={() => handleFrameStep('backward')}
              />
              <ContextMenuItem
                label="Next Frame"
                icon={<ChevronRight24Regular />}
                shortcut="→"
                disabled={!videoSrc}
                onClick={() => handleFrameStep('forward')}
              />

              <ContextMenuDivider />

              <ContextMenuItem
                label="Zoom: Fit"
                icon={<ZoomFit24Regular />}
                checked={zoom === 'fit'}
                onClick={() => handleZoomSelect('fit')}
              />
              <ContextMenuItem
                label="Zoom: Fill"
                checked={zoom === 'fill'}
                onClick={() => handleZoomSelect('fill')}
              />
              <ContextMenuItem
                label="Zoom: 50%"
                checked={zoom === '50'}
                onClick={() => handleZoomSelect('50')}
              />
              <ContextMenuItem
                label="Zoom: 100%"
                checked={zoom === '100'}
                onClick={() => handleZoomSelect('100')}
              />
              <ContextMenuItem
                label="Zoom: 200%"
                checked={zoom === '200'}
                onClick={() => handleZoomSelect('200')}
              />

              <ContextMenuDivider />

              <ContextMenuItem
                label="Show Safe Areas"
                checked={showSafeAreas}
                onClick={handleToggleSafeAreas}
              />
              <ContextMenuItem
                label="Show Timecode"
                icon={<Timer24Regular />}
                checked={showTimecode}
                onClick={handleToggleTimecode}
              />
              <ContextMenuItem
                label="Show Grid"
                icon={<Grid24Regular />}
                checked={showGrid}
                onClick={handleToggleGrid}
              />

              <ContextMenuDivider />

              <ContextMenuItem
                label="Quality: Full"
                checked={quality === 'full'}
                onClick={() => handleQualitySelect('full')}
              />
              <ContextMenuItem
                label="Quality: Half"
                checked={quality === 'half'}
                onClick={() => handleQualitySelect('half')}
              />
              <ContextMenuItem
                label="Quality: Quarter"
                checked={quality === 'quarter'}
                onClick={() => handleQualitySelect('quarter')}
              />

              <ContextMenuDivider />

              <ContextMenuItem
                label="Toggle Fullscreen"
                icon={<FullScreenMaximize24Regular />}
                shortcut="F"
                onClick={handleFullscreenFromMenu}
              />
            </BaseContextMenu>
          </motion.div>
        </div>
      </div>

      <PlaybackControls onFullscreen={handleFullscreen} />
    </div>
  );
};

export default PreviewPanel;
