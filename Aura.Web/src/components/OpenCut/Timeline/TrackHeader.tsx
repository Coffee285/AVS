/**
 * TrackHeader Component
 *
 * Displays track information with hover-reveal controls for mute/lock.
 * Shows subtle state indicators when track is muted or locked.
 */

import { makeStyles, tokens, Tooltip } from '@fluentui/react-components';
import {
  Video16Regular,
  Speaker116Regular,
  TextT16Regular,
  Image16Regular,
  SpeakerMute16Regular,
  LockClosed16Regular,
  LockOpen16Regular,
} from '@fluentui/react-icons';
import { AnimatePresence, motion } from 'framer-motion';
import type { FC, MouseEvent as ReactMouseEvent } from 'react';
import { useState } from 'react';
import { openCutTokens } from '../../../styles/designTokens';
import type { ClipType, TimelineTrack } from '../../../stores/opencutTimeline';

export interface TrackHeaderProps {
  track: TimelineTrack;
  isSelected: boolean;
  onClick: () => void;
  onMuteToggle: (e: ReactMouseEvent) => void;
  onLockToggle: (e: ReactMouseEvent) => void;
}

const useStyles = makeStyles({
  trackHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 8px',
    height: 'inherit',
    gap: '4px',
    cursor: 'pointer',
    transition: `background-color ${openCutTokens.animation.duration.fast} ${openCutTokens.animation.easing.easeOut}`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  trackInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flex: 1,
    overflow: 'hidden',
    minWidth: 0,
  },
  trackIcon: {
    flexShrink: 0,
    color: tokens.colorNeutralForeground3,
    display: 'flex',
    alignItems: 'center',
    fontSize: '16px',
  },
  trackName: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
    fontWeight: openCutTokens.typography.fontWeight.medium,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  trackControls: {
    display: 'flex',
    gap: '2px',
    alignItems: 'center',
  },
  controlButton: {
    minWidth: '22px',
    minHeight: '22px',
    padding: '2px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: tokens.colorNeutralForeground2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: openCutTokens.radius.xs,
    transition: `background-color ${openCutTokens.animation.duration.fast} ${openCutTokens.animation.easing.easeOut}`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Pressed,
      color: tokens.colorNeutralForeground1,
    },
    ':active': {
      backgroundColor: tokens.colorNeutralBackground1Selected,
    },
  },
  trackStateIndicators: {
    display: 'flex',
    gap: '4px',
    opacity: 0.5,
    alignItems: 'center',
  },
  stateIcon: {
    width: '12px',
    height: '12px',
    color: tokens.colorNeutralForeground3,
  },
});

const TRACK_TYPE_ICONS: Record<ClipType, React.ReactNode> = {
  video: <Video16Regular />,
  audio: <Speaker116Regular />,
  text: <TextT16Regular />,
  image: <Image16Regular />,
};

export const TrackHeader: FC<TrackHeaderProps> = ({
  track,
  isSelected,
  onClick,
  onMuteToggle,
  onLockToggle,
}) => {
  const styles = useStyles();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={styles.trackHeader}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${track.name} track`}
    >
      <div className={styles.trackInfo}>
        <span className={styles.trackIcon}>{TRACK_TYPE_ICONS[track.type]}</span>
        <span className={styles.trackName}>{track.name}</span>
      </div>

      <AnimatePresence mode="wait">
        {isHovered ? (
          <motion.div
            key="controls"
            className={styles.trackControls}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.15 }}
          >
            <Tooltip content={track.muted ? 'Unmute' : 'Mute'} relationship="label">
              <button
                type="button"
                className={styles.controlButton}
                onClick={onMuteToggle}
                aria-label={track.muted ? 'Unmute track' : 'Mute track'}
              >
                {track.muted ? <SpeakerMute16Regular /> : <Speaker116Regular />}
              </button>
            </Tooltip>
            <Tooltip content={track.locked ? 'Unlock' : 'Lock'} relationship="label">
              <button
                type="button"
                className={styles.controlButton}
                onClick={onLockToggle}
                aria-label={track.locked ? 'Unlock track' : 'Lock track'}
              >
                {track.locked ? <LockClosed16Regular /> : <LockOpen16Regular />}
              </button>
            </Tooltip>
          </motion.div>
        ) : (
          (track.muted || track.locked) && (
            <motion.div
              key="indicators"
              className={styles.trackStateIndicators}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {track.muted && <SpeakerMute16Regular className={styles.stateIcon} />}
              {track.locked && <LockClosed16Regular className={styles.stateIcon} />}
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrackHeader;
