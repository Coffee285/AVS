/**
 * SnapIndicator Component
 *
 * Visual indicator displayed when a clip snaps to a snap point.
 * Shows a vertical line at the snap position with a brief highlight animation.
 * Enhanced with distance tooltip and multi-type support for professional NLE feedback.
 */

import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { motion, AnimatePresence } from 'framer-motion';
import type { FC } from 'react';
import { openCutTokens } from '../../../styles/designTokens';

export type SnapType = 'clip' | 'playhead' | 'marker' | 'beat' | 'clip-edge' | 'time-zero';

export interface SnapIndicatorProps {
  /** Position in pixels from left of timeline */
  position: number;
  /** Whether the indicator is visible */
  visible: boolean;
  /** Type of snap point */
  snapType?: SnapType;
  /** Optional className */
  className?: string;
  /** Distance to snap point in seconds (shows tooltip if provided and within threshold) */
  distance?: number;
  /** Pixels per second for time formatting */
  pixelsPerSecond?: number;
  /** Whether actively snapping (enhances glow effect) */
  isActive?: boolean;
}

/**
 * Format time for short display in tooltip (e.g., "15f" for frames, "1.2s" for seconds)
 */
function formatTimeShort(seconds: number): string {
  if (seconds < 0.1) {
    const frames = Math.round(seconds * 30); // Assume 30fps
    return `${frames}f`;
  }
  return `${seconds.toFixed(1)}s`;
}

const useStyles = makeStyles({
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '2px',
    pointerEvents: 'none',
    zIndex: openCutTokens.zIndex.tooltip,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  line: {
    width: '2px',
    height: '100%',
    borderRadius: '1px',
    transformOrigin: 'top',
  },
  lineClip: {
    backgroundColor: tokens.colorBrandForeground1,
    boxShadow: `0 0 8px 2px ${tokens.colorBrandForeground1}80`,
  },
  lineClipActive: {
    boxShadow: `0 0 12px 3px ${tokens.colorBrandForeground1}`,
  },
  lineClipEdge: {
    backgroundColor: openCutTokens.colors.snap,
    boxShadow: `0 0 8px 2px ${openCutTokens.colors.snap}80`,
  },
  lineClipEdgeActive: {
    boxShadow: `0 0 12px 3px ${openCutTokens.colors.snap}`,
  },
  lineMarker: {
    backgroundColor: tokens.colorPaletteGreenForeground1,
    boxShadow: `0 0 8px 2px ${tokens.colorPaletteGreenForeground1}80`,
  },
  lineMarkerActive: {
    boxShadow: `0 0 12px 3px ${tokens.colorPaletteGreenForeground1}`,
  },
  linePlayhead: {
    backgroundColor: tokens.colorPaletteYellowForeground1,
    boxShadow: `0 0 8px 2px ${tokens.colorPaletteYellowForeground1}80`,
  },
  linePlayheadActive: {
    boxShadow: `0 0 12px 3px ${tokens.colorPaletteYellowForeground1}`,
  },
  lineBeat: {
    backgroundColor: tokens.colorPalettePurpleForeground2,
    boxShadow: `0 0 8px 2px ${tokens.colorPalettePurpleForeground2}80`,
  },
  lineBeatActive: {
    boxShadow: `0 0 12px 3px ${tokens.colorPalettePurpleForeground2}`,
  },
  lineTimeZero: {
    backgroundColor: '#22C55E',
    boxShadow: '0 0 8px 2px #22C55E80',
  },
  lineTimeZeroActive: {
    boxShadow: '0 0 12px 3px #22C55E',
  },
  diamond: {
    position: 'absolute',
    top: '-4px',
    width: '8px',
    height: '8px',
    transform: 'rotate(45deg)',
    borderRadius: '2px',
  },
  diamondClip: {
    backgroundColor: tokens.colorBrandForeground1,
  },
  diamondClipEdge: {
    backgroundColor: openCutTokens.colors.snap,
  },
  diamondMarker: {
    backgroundColor: tokens.colorPaletteGreenForeground1,
  },
  diamondPlayhead: {
    backgroundColor: tokens.colorPaletteYellowForeground1,
  },
  diamondBeat: {
    backgroundColor: tokens.colorPalettePurpleForeground2,
  },
  diamondTimeZero: {
    backgroundColor: '#22C55E',
  },
  distanceTooltip: {
    position: 'absolute',
    top: '-24px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '2px 6px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusSmall,
    fontSize: tokens.fontSizeBase100,
    fontFamily: openCutTokens.typography.fontFamily.mono,
    whiteSpace: 'nowrap',
    boxShadow: tokens.shadow4,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    color: tokens.colorNeutralForeground1,
    zIndex: 1,
  },
});

const snapLineVariants = {
  hidden: {
    opacity: 0,
    scaleY: 0.5,
  },
  visible: {
    opacity: 1,
    scaleY: 1,
    transition: {
      duration: 0.15,
      ease: [0.25, 1, 0.5, 1] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    scaleY: 0.5,
    transition: {
      duration: 0.1,
      ease: [0.5, 0, 0.75, 0] as [number, number, number, number],
    },
  },
};

const diamondVariants = {
  hidden: {
    opacity: 0,
    scale: 0,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    scale: 0,
    transition: {
      duration: 0.1,
      ease: [0.5, 0, 0.75, 0] as [number, number, number, number],
    },
  },
};

export const SnapIndicator: FC<SnapIndicatorProps> = ({
  position,
  visible,
  snapType = 'clip-edge',
  className,
  distance,
  pixelsPerSecond,
  isActive = false,
}) => {
  const styles = useStyles();

  // Normalize snap type to handle both old and new values
  const normalizedType =
    snapType === 'clip-edge' ? 'clip' : snapType === 'time-zero' ? 'clip' : snapType;

  const lineClass = {
    clip: styles.lineClip,
    'clip-edge': styles.lineClipEdge,
    marker: styles.lineMarker,
    playhead: styles.linePlayhead,
    beat: styles.lineBeat,
    'time-zero': styles.lineTimeZero,
  }[snapType];

  const lineActiveClass = {
    clip: styles.lineClipActive,
    'clip-edge': styles.lineClipEdgeActive,
    marker: styles.lineMarkerActive,
    playhead: styles.linePlayheadActive,
    beat: styles.lineBeatActive,
    'time-zero': styles.lineTimeZeroActive,
  }[snapType];

  const diamondClass = {
    clip: styles.diamondClip,
    'clip-edge': styles.diamondClipEdge,
    marker: styles.diamondMarker,
    playhead: styles.diamondPlayhead,
    beat: styles.diamondBeat,
    'time-zero': styles.diamondTimeZero,
  }[snapType];

  // Show tooltip if distance is provided, within 1 second, and greater than 0
  const showTooltip = distance !== undefined && distance > 0 && distance < 1;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={mergeClasses(styles.container, className)}
          style={{ left: position - 1 }}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={snapLineVariants}
        >
          <motion.div
            className={mergeClasses(styles.diamond, diamondClass)}
            variants={diamondVariants}
          />
          <motion.div
            className={mergeClasses(styles.line, lineClass, isActive && lineActiveClass)}
            initial={{ opacity: 0, scaleY: 0.5 }}
            animate={{
              opacity: isActive ? 1 : 0.5,
              scaleY: 1,
            }}
            transition={{ duration: 0.1 }}
          />
          {showTooltip && (
            <motion.div
              className={styles.distanceTooltip}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
            >
              {formatTimeShort(distance)}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SnapIndicator;
