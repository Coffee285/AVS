/**
 * OpenCut Native Editor
 *
 * A native React implementation of the OpenCut video editor that runs
 * directly in Aura.Web without requiring a separate server process.
 * This replaces the iframe-based approach with integrated components.
 *
 * Redesigned following Apple Human Interface Guidelines for a premium,
 * professional video editing experience with generous spacing, refined
 * typography, and elegant animations.
 *
 * Features:
 * - Collapsible side panels with persistent layout state
 * - Extended resize ranges for flexible workspace
 * - Keyboard shortcuts for panel toggling
 */

import { makeStyles, tokens, TabList, Tab } from '@fluentui/react-components';
import { useEffect, useState, useCallback } from 'react';
import { useOpenCutKeyboardHandler } from '../../hooks/useOpenCutKeyboardHandler';
import { useOpenCutLayoutStore, LAYOUT_CONSTANTS } from '../../stores/opencutLayout';
import { useOpenCutProjectStore } from '../../stores/opencutProject';
import { useOpenCutCaptionsStore } from '../../stores/opencutCaptions';
import { useOpenCutPlaybackStore } from '../../stores/opencutPlayback';
import { useOpenCutTimelineStore } from '../../stores/opencutTimeline';
import { useOpenCutToastsStore } from '../../stores/opencutToasts';
import { openCutTokens } from '../../styles/designTokens';
import { CaptionsPanel } from './Captions';
import { EffectsPanel } from './Effects';
import { CollapsedPanel, PanelDivider } from './Layout';
import { MediaPanel } from './MediaPanel';
import { GraphicsPanel } from './MotionGraphics';
import { PreviewPanel } from './PreviewPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { TemplatesPanel } from './Templates';
import { Timeline } from './Timeline';
import { TransitionsPanel } from './Transitions';
import { ToastContainer } from './ui';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
    fontFamily: openCutTokens.typography.fontFamily.body,
    fontSize: openCutTokens.typography.fontSize.base,
    lineHeight: openCutTokens.typography.lineHeight.normal.toString(),
    ...openCutTokens.interaction.noSelect,
  },
  mainContent: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground2,
    boxShadow: openCutTokens.shadows.sm,
    zIndex: openCutTokens.zIndex.dropdown,
    transition: `width ${LAYOUT_CONSTANTS.animation.collapseDuration}ms ${LAYOUT_CONSTANTS.animation.collapseEasing}`,
  },
  leftPanelTabs: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    padding: `${openCutTokens.spacing.sm} ${openCutTokens.spacing.md}`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  leftPanelContent: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  centerPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    backgroundColor: tokens.colorNeutralBackground1,
    zIndex: openCutTokens.zIndex.base,
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground2,
    boxShadow: openCutTokens.shadows.sm,
    zIndex: openCutTokens.zIndex.dropdown,
    transition: `width ${LAYOUT_CONSTANTS.animation.collapseDuration}ms ${LAYOUT_CONSTANTS.animation.collapseEasing}`,
  },
});

type LeftPanelTab = 'media' | 'effects' | 'transitions' | 'graphics' | 'templates' | 'captions';

export function OpenCutEditor() {
  const styles = useStyles();
  const projectStore = useOpenCutProjectStore();
  const layoutStore = useOpenCutLayoutStore();
  const captionsStore = useOpenCutCaptionsStore();
  const playbackStore = useOpenCutPlaybackStore();
  const timelineStore = useOpenCutTimelineStore();
  const toastsStore = useOpenCutToastsStore();

  const [leftPanelTab, setLeftPanelTab] = useState<LeftPanelTab>('media');

  // Handler for inserting selected caption at playhead
  const handleInsertAtPlayhead = useCallback(() => {
    const { selectedCaptionId, getCaptionById } = captionsStore;
    
    if (selectedCaptionId) {
      const caption = getCaptionById(selectedCaptionId);
      if (caption) {
        const currentTime = playbackStore.currentTime;

        let textTrack = timelineStore.tracks.find((t) => t.type === 'text');
        if (!textTrack) {
          const trackId = timelineStore.addTrack('text', 'Captions');
          textTrack = timelineStore.getTrackById(trackId);
        }

        if (!textTrack) {
          toastsStore.error('Failed to create text track');
          return;
        }

        timelineStore.addClip({
          trackId: textTrack.id,
          type: 'text',
          name: caption.text.substring(0, 20),
          mediaId: null,
          startTime: currentTime,
          duration: caption.endTime - caption.startTime,
          inPoint: 0,
          outPoint: caption.endTime - caption.startTime,
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
          text: {
            content: caption.text,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 48,
            fontWeight: 400,
            fontStyle: 'normal',
            textAlign: 'center',
            color: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
            shadowBlur: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
          },
          speed: 1,
          reversed: false,
          timeRemapEnabled: false,
          locked: false,
        });

        toastsStore.success('Caption added to timeline');
      }
    }
  }, [captionsStore, playbackStore, timelineStore, toastsStore]);

  // Initialize keyboard shortcuts handler
  // In/out points are returned but will be used by future components
  const _keyboardState = useOpenCutKeyboardHandler({
    enabled: true,
    onUnhandledAction: (action) => {
      if (action === 'insertAtPlayhead') {
        handleInsertAtPlayhead();
      }
    },
  });

  // Initialize project on mount
  useEffect(() => {
    if (!projectStore.activeProject) {
      projectStore.createProject('Untitled Project');
    }
  }, [projectStore]);

  // Register keyboard shortcuts for panel toggling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.shiftKey) {
        switch (e.key) {
          case '[':
            e.preventDefault();
            layoutStore.toggleLeftPanel();
            break;
          case ']':
            e.preventDefault();
            layoutStore.toggleRightPanel();
            break;
          case '\\':
            e.preventDefault();
            layoutStore.resetLayout();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [layoutStore]);

  const handleLeftPanelResize = useCallback(
    (deltaX: number) => {
      const newWidth = layoutStore.leftPanelWidth + deltaX;
      layoutStore.setLeftPanelWidth(newWidth);
    },
    [layoutStore]
  );

  const handleRightPanelResize = useCallback(
    (deltaX: number) => {
      const newWidth = layoutStore.rightPanelWidth + deltaX;
      layoutStore.setRightPanelWidth(newWidth);
    },
    [layoutStore]
  );

  const handleLeftPanelTabChange = useCallback((_: unknown, data: { value: unknown }) => {
    setLeftPanelTab(data.value as LeftPanelTab);
  }, []);

  const renderLeftPanelContent = () => {
    switch (leftPanelTab) {
      case 'media':
        return <MediaPanel />;
      case 'effects':
        return <EffectsPanel />;
      case 'transitions':
        return <TransitionsPanel />;
      case 'graphics':
        return <GraphicsPanel />;
      case 'templates':
        return <TemplatesPanel />;
      case 'captions':
        return <CaptionsPanel />;
      default:
        return <MediaPanel />;
    }
  };

  return (
    <div className={styles.root}>
      {/* Toast notifications container */}
      <ToastContainer position="top-right" />

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {/* Left Panel - Media/Effects/Transitions */}
        {layoutStore.leftPanelCollapsed ? (
          <CollapsedPanel type="media" onExpand={() => layoutStore.setLeftPanelCollapsed(false)} />
        ) : (
          <div className={styles.leftPanel} style={{ width: layoutStore.leftPanelWidth }}>
            <div className={styles.leftPanelTabs}>
              <TabList
                selectedValue={leftPanelTab}
                onTabSelect={handleLeftPanelTabChange}
                size="small"
              >
                <Tab value="media">Media</Tab>
                <Tab value="effects">Effects</Tab>
                <Tab value="transitions">Transitions</Tab>
                <Tab value="graphics">Graphics</Tab>
                <Tab value="templates">Templates</Tab>
                <Tab value="captions">Captions</Tab>
              </TabList>
            </div>
            <div className={styles.leftPanelContent}>{renderLeftPanelContent()}</div>
          </div>
        )}

        {/* Left Panel Divider */}
        <PanelDivider
          direction="left"
          isCollapsed={layoutStore.leftPanelCollapsed}
          onResize={handleLeftPanelResize}
          onDoubleClick={layoutStore.toggleLeftPanel}
        />

        {/* Center Panel - Preview */}
        <div className={styles.centerPanel}>
          <PreviewPanel />
        </div>

        {/* Right Panel Divider */}
        <PanelDivider
          direction="right"
          isCollapsed={layoutStore.rightPanelCollapsed}
          onResize={handleRightPanelResize}
          onDoubleClick={layoutStore.toggleRightPanel}
        />

        {/* Right Panel - Properties */}
        {layoutStore.rightPanelCollapsed ? (
          <CollapsedPanel
            type="properties"
            onExpand={() => layoutStore.setRightPanelCollapsed(false)}
          />
        ) : (
          <div className={styles.rightPanel} style={{ width: layoutStore.rightPanelWidth }}>
            <PropertiesPanel />
          </div>
        )}
      </div>

      {/* Timeline (with built-in vertical resize) */}
      <Timeline />
    </div>
  );
}

export default OpenCutEditor;
