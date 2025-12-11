/**
 * OpenCut Layout Store Tests
 *
 * Tests for the layout persistence and panel management store.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useOpenCutLayoutStore, LAYOUT_CONSTANTS } from '../opencutLayout';

describe('OpenCutLayoutStore', () => {
  beforeEach(() => {
    // Reset store to default state before each test
    useOpenCutLayoutStore.setState({
      leftPanelWidth: LAYOUT_CONSTANTS.leftPanel.defaultWidth,
      leftPanelCollapsed: false,
      leftPanelPreviousWidth: LAYOUT_CONSTANTS.leftPanel.defaultWidth,
      rightPanelWidth: LAYOUT_CONSTANTS.rightPanel.defaultWidth,
      rightPanelCollapsed: false,
      rightPanelPreviousWidth: LAYOUT_CONSTANTS.rightPanel.defaultWidth,
      timelineHeight: 400,
      hasCustomLayout: false,
    });
  });

  describe('Layout Constants', () => {
    it('should have valid left panel constraints', () => {
      expect(LAYOUT_CONSTANTS.leftPanel.minWidth).toBe(240);
      expect(LAYOUT_CONSTANTS.leftPanel.maxWidth).toBe(480);
      expect(LAYOUT_CONSTANTS.leftPanel.collapsedWidth).toBe(48);
      expect(LAYOUT_CONSTANTS.leftPanel.defaultWidth).toBe(320);
    });

    it('should have valid right panel constraints', () => {
      expect(LAYOUT_CONSTANTS.rightPanel.minWidth).toBe(200);
      expect(LAYOUT_CONSTANTS.rightPanel.maxWidth).toBe(400);
      expect(LAYOUT_CONSTANTS.rightPanel.collapsedWidth).toBe(48);
      expect(LAYOUT_CONSTANTS.rightPanel.defaultWidth).toBe(280);
    });

    it('should have valid timeline constraints', () => {
      expect(LAYOUT_CONSTANTS.timeline.minHeight).toBe(200);
      expect(LAYOUT_CONSTANTS.timeline.defaultHeightPercent).toBe(0.45);
      expect(LAYOUT_CONSTANTS.timeline.maxHeightPercent).toBe(0.7);
    });

    it('should have valid preview constraints', () => {
      expect(LAYOUT_CONSTANTS.preview.minHeight).toBe(200);
      expect(LAYOUT_CONSTANTS.preview.defaultHeightPercent).toBe(0.4);
    });
  });

  describe('Left Panel Operations', () => {
    it('should set left panel width within bounds', () => {
      const { setLeftPanelWidth } = useOpenCutLayoutStore.getState();

      setLeftPanelWidth(400);

      const state = useOpenCutLayoutStore.getState();
      expect(state.leftPanelWidth).toBe(400);
      expect(state.leftPanelPreviousWidth).toBe(400);
      expect(state.leftPanelCollapsed).toBe(false);
    });

    it('should clamp left panel width to minimum', () => {
      const { setLeftPanelWidth } = useOpenCutLayoutStore.getState();

      setLeftPanelWidth(100); // Below minimum

      const state = useOpenCutLayoutStore.getState();
      expect(state.leftPanelWidth).toBe(LAYOUT_CONSTANTS.leftPanel.minWidth);
    });

    it('should clamp left panel width to maximum', () => {
      const { setLeftPanelWidth } = useOpenCutLayoutStore.getState();

      setLeftPanelWidth(800); // Above maximum

      const state = useOpenCutLayoutStore.getState();
      expect(state.leftPanelWidth).toBe(LAYOUT_CONSTANTS.leftPanel.maxWidth);
    });

    it('should collapse left panel', () => {
      const { setLeftPanelWidth, setLeftPanelCollapsed } = useOpenCutLayoutStore.getState();

      setLeftPanelWidth(350);
      setLeftPanelCollapsed(true);

      const state = useOpenCutLayoutStore.getState();
      expect(state.leftPanelCollapsed).toBe(true);
      expect(state.leftPanelWidth).toBe(LAYOUT_CONSTANTS.leftPanel.collapsedWidth);
      expect(state.leftPanelPreviousWidth).toBe(350);
    });

    it('should expand left panel to previous width', () => {
      const { setLeftPanelWidth, setLeftPanelCollapsed } = useOpenCutLayoutStore.getState();

      setLeftPanelWidth(350);
      setLeftPanelCollapsed(true);
      setLeftPanelCollapsed(false);

      const state = useOpenCutLayoutStore.getState();
      expect(state.leftPanelCollapsed).toBe(false);
      expect(state.leftPanelWidth).toBe(350);
    });

    it('should toggle left panel', () => {
      const { toggleLeftPanel } = useOpenCutLayoutStore.getState();

      toggleLeftPanel();
      expect(useOpenCutLayoutStore.getState().leftPanelCollapsed).toBe(true);

      toggleLeftPanel();
      expect(useOpenCutLayoutStore.getState().leftPanelCollapsed).toBe(false);
    });
  });

  describe('Right Panel Operations', () => {
    it('should set right panel width within bounds', () => {
      const { setRightPanelWidth } = useOpenCutLayoutStore.getState();

      setRightPanelWidth(350);

      const state = useOpenCutLayoutStore.getState();
      expect(state.rightPanelWidth).toBe(350);
      expect(state.rightPanelPreviousWidth).toBe(350);
      expect(state.rightPanelCollapsed).toBe(false);
    });

    it('should clamp right panel width to minimum', () => {
      const { setRightPanelWidth } = useOpenCutLayoutStore.getState();

      setRightPanelWidth(100); // Below minimum

      const state = useOpenCutLayoutStore.getState();
      expect(state.rightPanelWidth).toBe(LAYOUT_CONSTANTS.rightPanel.minWidth);
    });

    it('should clamp right panel width to maximum', () => {
      const { setRightPanelWidth } = useOpenCutLayoutStore.getState();

      setRightPanelWidth(900); // Above maximum

      const state = useOpenCutLayoutStore.getState();
      expect(state.rightPanelWidth).toBe(LAYOUT_CONSTANTS.rightPanel.maxWidth);
    });

    it('should collapse right panel', () => {
      const { setRightPanelWidth, setRightPanelCollapsed } = useOpenCutLayoutStore.getState();

      setRightPanelWidth(350);
      setRightPanelCollapsed(true);

      const state = useOpenCutLayoutStore.getState();
      expect(state.rightPanelCollapsed).toBe(true);
      expect(state.rightPanelWidth).toBe(LAYOUT_CONSTANTS.rightPanel.collapsedWidth);
      expect(state.rightPanelPreviousWidth).toBe(350);
    });

    it('should expand right panel to previous width', () => {
      const { setRightPanelWidth, setRightPanelCollapsed } = useOpenCutLayoutStore.getState();

      setRightPanelWidth(350);
      setRightPanelCollapsed(true);
      setRightPanelCollapsed(false);

      const state = useOpenCutLayoutStore.getState();
      expect(state.rightPanelCollapsed).toBe(false);
      expect(state.rightPanelWidth).toBe(350);
    });

    it('should toggle right panel', () => {
      const { toggleRightPanel } = useOpenCutLayoutStore.getState();

      toggleRightPanel();
      expect(useOpenCutLayoutStore.getState().rightPanelCollapsed).toBe(true);

      toggleRightPanel();
      expect(useOpenCutLayoutStore.getState().rightPanelCollapsed).toBe(false);
    });
  });

  describe('Timeline Operations', () => {
    it('should set timeline height within bounds', () => {
      const { setTimelineHeight } = useOpenCutLayoutStore.getState();

      setTimelineHeight(350);

      const state = useOpenCutLayoutStore.getState();
      expect(state.timelineHeight).toBe(350);
      expect(state.hasCustomLayout).toBe(true);
    });

    it('should clamp timeline height to minimum', () => {
      const { setTimelineHeight } = useOpenCutLayoutStore.getState();

      setTimelineHeight(100); // Below minimum

      const state = useOpenCutLayoutStore.getState();
      expect(state.timelineHeight).toBe(LAYOUT_CONSTANTS.timeline.minHeight);
    });

    it('should mark as custom layout when user resizes', () => {
      const { setTimelineHeight } = useOpenCutLayoutStore.getState();

      setTimelineHeight(500, true);

      const state = useOpenCutLayoutStore.getState();
      expect(state.hasCustomLayout).toBe(true);
    });

    it('should not mark as custom layout when system calculates', () => {
      const { setTimelineHeight } = useOpenCutLayoutStore.getState();

      setTimelineHeight(450, false);

      const state = useOpenCutLayoutStore.getState();
      expect(state.hasCustomLayout).toBe(false);
    });
  });

  describe('Initial Layout Calculation', () => {
    it('should calculate timeline height as 45% of available space', () => {
      const { calculateInitialLayout } = useOpenCutLayoutStore.getState();

      // Simulate a 1000px window height
      calculateInitialLayout(1000);

      const state = useOpenCutLayoutStore.getState();
      // Available height = 1000 - 100 (fixed) = 900
      // Timeline should be 45% of 900 = 405
      expect(state.timelineHeight).toBe(405);
      expect(state.hasCustomLayout).toBe(false);
    });

    it('should respect minimum timeline height', () => {
      const { calculateInitialLayout } = useOpenCutLayoutStore.getState();

      // Simulate a very small window
      calculateInitialLayout(300);

      const state = useOpenCutLayoutStore.getState();
      // Should enforce minimum height of 200px
      expect(state.timelineHeight).toBe(LAYOUT_CONSTANTS.timeline.minHeight);
    });

    it('should not recalculate if user has customized layout', () => {
      const { setTimelineHeight, calculateInitialLayout } = useOpenCutLayoutStore.getState();

      // User customizes layout
      setTimelineHeight(600, true);
      expect(useOpenCutLayoutStore.getState().hasCustomLayout).toBe(true);

      // System tries to recalculate
      calculateInitialLayout(1000);

      // Should keep user's custom value
      const state = useOpenCutLayoutStore.getState();
      expect(state.timelineHeight).toBe(600);
      expect(state.hasCustomLayout).toBe(true);
    });
  });

  describe('Reset Layout', () => {
    it('should reset all layout values to defaults', () => {
      const {
        setLeftPanelWidth,
        setLeftPanelCollapsed,
        setRightPanelWidth,
        setRightPanelCollapsed,
        setTimelineHeight,
        resetLayout,
      } = useOpenCutLayoutStore.getState();

      // Modify all values
      setLeftPanelWidth(500);
      setLeftPanelCollapsed(true);
      setRightPanelWidth(600);
      setRightPanelCollapsed(true);
      setTimelineHeight(600);

      // Reset
      resetLayout();

      const state = useOpenCutLayoutStore.getState();
      expect(state.leftPanelWidth).toBe(LAYOUT_CONSTANTS.leftPanel.defaultWidth);
      expect(state.leftPanelCollapsed).toBe(false);
      expect(state.rightPanelWidth).toBe(LAYOUT_CONSTANTS.rightPanel.defaultWidth);
      expect(state.rightPanelCollapsed).toBe(false);
      expect(state.timelineHeight).toBe(400);
      expect(state.hasCustomLayout).toBe(false);
    });
  });
});
