/**
 * OpenCut Layout Store
 *
 * Manages the layout state for the OpenCut video editor including:
 * - Panel widths and collapsed states
 * - Timeline height
 * - Persistent layout storage with localStorage
 * - Layout reset functionality
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createSafeJSONStorage } from './opencutPersist';

/**
 * Layout sizing constants following professional NLE design.
 * Based on analysis of Adobe Premiere Pro and DaVinci Resolve.
 * Timeline gets 45% of vertical space as that's where editors spend most time.
 */
export const LAYOUT_CONSTANTS = {
  /** Left panel (Media) constraints */
  leftPanel: {
    defaultWidth: 320,
    minWidth: 240,
    maxWidth: 480,
    collapsedWidth: 48,
  },
  /** Right panel (Properties) constraints */
  rightPanel: {
    defaultWidth: 280,
    minWidth: 200,
    maxWidth: 400,
    collapsedWidth: 48,
  },
  /** Timeline constraints */
  timeline: {
    defaultHeightPercent: 0.45, // 45% of available vertical space
    minHeight: 200,
    maxHeightPercent: 0.7,
    trackHeight: {
      default: 64,
      min: 32,
      max: 120,
      compact: 24,
    },
    headerWidth: 200, // Track header area
  },
  /** Preview constraints */
  preview: {
    defaultHeightPercent: 0.4,
    minHeight: 200,
    toolbarHeight: 36,
    controlsHeight: 48,
  },
  /** Fixed heights */
  toolbar: {
    main: 40,
    timeline: 36,
    playback: 48,
  },
  /** Animation settings */
  animation: {
    collapseDuration: 200,
    collapseEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

export interface LayoutState {
  /** Width of the left (Media) panel */
  leftPanelWidth: number;
  /** Whether the left panel is collapsed to icon-only state */
  leftPanelCollapsed: boolean;
  /** Width of the left panel before it was collapsed (for restore) */
  leftPanelPreviousWidth: number;

  /** Width of the right (Properties) panel */
  rightPanelWidth: number;
  /** Whether the right panel is collapsed to icon-only state */
  rightPanelCollapsed: boolean;
  /** Width of the right panel before it was collapsed (for restore) */
  rightPanelPreviousWidth: number;

  /** Height of the timeline panel */
  timelineHeight: number;
  /** Whether the user has manually customized the timeline height */
  hasCustomLayout: boolean;

  /** Actions */
  setLeftPanelWidth: (width: number) => void;
  setLeftPanelCollapsed: (collapsed: boolean) => void;
  toggleLeftPanel: () => void;
  setRightPanelWidth: (width: number) => void;
  setRightPanelCollapsed: (collapsed: boolean) => void;
  toggleRightPanel: () => void;
  setTimelineHeight: (height: number, isUserAction?: boolean) => void;
  calculateInitialLayout: (windowHeight: number) => void;
  resetLayout: () => void;
}

const defaultState = {
  leftPanelWidth: LAYOUT_CONSTANTS.leftPanel.defaultWidth,
  leftPanelCollapsed: false,
  leftPanelPreviousWidth: LAYOUT_CONSTANTS.leftPanel.defaultWidth,
  rightPanelWidth: LAYOUT_CONSTANTS.rightPanel.defaultWidth,
  rightPanelCollapsed: false,
  rightPanelPreviousWidth: LAYOUT_CONSTANTS.rightPanel.defaultWidth,
  timelineHeight: 400, // Fallback default, will be calculated on mount
  hasCustomLayout: false,
};

export const useOpenCutLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      ...defaultState,

      setLeftPanelWidth: (width: number) => {
        const clampedWidth = Math.max(
          LAYOUT_CONSTANTS.leftPanel.minWidth,
          Math.min(LAYOUT_CONSTANTS.leftPanel.maxWidth, width)
        );
        set({
          leftPanelWidth: clampedWidth,
          leftPanelPreviousWidth: clampedWidth,
          leftPanelCollapsed: false,
        });
      },

      setLeftPanelCollapsed: (collapsed: boolean) => {
        const state = get();
        if (collapsed) {
          set({
            leftPanelCollapsed: true,
            leftPanelPreviousWidth: state.leftPanelWidth,
            leftPanelWidth: LAYOUT_CONSTANTS.leftPanel.collapsedWidth,
          });
        } else {
          set({
            leftPanelCollapsed: false,
            leftPanelWidth: state.leftPanelPreviousWidth,
          });
        }
      },

      toggleLeftPanel: () => {
        const state = get();
        state.setLeftPanelCollapsed(!state.leftPanelCollapsed);
      },

      setRightPanelWidth: (width: number) => {
        const clampedWidth = Math.max(
          LAYOUT_CONSTANTS.rightPanel.minWidth,
          Math.min(LAYOUT_CONSTANTS.rightPanel.maxWidth, width)
        );
        set({
          rightPanelWidth: clampedWidth,
          rightPanelPreviousWidth: clampedWidth,
          rightPanelCollapsed: false,
        });
      },

      setRightPanelCollapsed: (collapsed: boolean) => {
        const state = get();
        if (collapsed) {
          set({
            rightPanelCollapsed: true,
            rightPanelPreviousWidth: state.rightPanelWidth,
            rightPanelWidth: LAYOUT_CONSTANTS.rightPanel.collapsedWidth,
          });
        } else {
          set({
            rightPanelCollapsed: false,
            rightPanelWidth: state.rightPanelPreviousWidth,
          });
        }
      },

      toggleRightPanel: () => {
        const state = get();
        state.setRightPanelCollapsed(!state.rightPanelCollapsed);
      },

      setTimelineHeight: (height: number, isUserAction = true) => {
        const clampedHeight = Math.max(LAYOUT_CONSTANTS.timeline.minHeight, height);
        set({ timelineHeight: clampedHeight, hasCustomLayout: isUserAction });
      },

      calculateInitialLayout: (windowHeight: number) => {
        const state = get();
        // Only calculate if user hasn't customized the layout
        if (!state.hasCustomLayout) {
          // Account for typical fixed UI elements (conservative estimate)
          const fixedHeight = 100;
          const availableHeight = windowHeight - fixedHeight;

          // Timeline gets 45% of available space (professional NLE standard)
          const timelineHeight = Math.max(
            LAYOUT_CONSTANTS.timeline.minHeight,
            Math.floor(availableHeight * LAYOUT_CONSTANTS.timeline.defaultHeightPercent)
          );

          // Set without marking as custom (system-calculated)
          set({ timelineHeight, hasCustomLayout: false });
        }
      },

      resetLayout: () => {
        set(defaultState);
      },
    }),
    {
      name: 'opencut-layout',
      storage: createSafeJSONStorage<LayoutState>('opencut-layout'),
      partialize: (state) => ({
        leftPanelWidth: state.leftPanelWidth,
        leftPanelCollapsed: state.leftPanelCollapsed,
        leftPanelPreviousWidth: state.leftPanelPreviousWidth,
        rightPanelWidth: state.rightPanelWidth,
        rightPanelCollapsed: state.rightPanelCollapsed,
        rightPanelPreviousWidth: state.rightPanelPreviousWidth,
        timelineHeight: state.timelineHeight,
        hasCustomLayout: state.hasCustomLayout,
      }),
    }
  )
);

export default useOpenCutLayoutStore;
