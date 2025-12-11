/**
 * OpenCut Toast Component
 *
 * Individual toast notification with enter/exit animations,
 * auto-dismiss progress bar, and action button support.
 */

import { makeStyles, mergeClasses, Button, tokens } from '@fluentui/react-components';
import {
  CheckmarkCircle20Regular,
  ErrorCircle20Regular,
  Info20Regular,
  Warning20Regular,
  Dismiss20Regular,
} from '@fluentui/react-icons';
import { useEffect, useState, useCallback, useRef, type FC } from 'react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import type { Toast as ToastData, ToastType } from '../../../stores/opencutToasts';
import { openCutTokens } from '../../../styles/designTokens';

/** Default toast duration in milliseconds */
const DEFAULT_TOAST_DURATION = 5000;

export interface ToastProps {
  /** Toast data */
  toast: ToastData;
  /** Callback when toast should be dismissed */
  onDismiss: (id: string) => void;
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: openCutTokens.spacing.sm,
    padding: openCutTokens.spacing.md,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: openCutTokens.radius.lg,
    boxShadow: openCutTokens.shadows.lg,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    minWidth: '280px',
    maxWidth: '400px',
    position: 'relative',
    overflow: 'hidden',
  },
  entering: {
    '@keyframes toastEnter': {
      '0%': {
        opacity: 0,
        transform: 'translateX(100%)',
      },
      '100%': {
        opacity: 1,
        transform: 'translateX(0)',
      },
    },
    animationName: 'toastEnter',
    animationDuration: openCutTokens.animation.duration.normal,
    animationTimingFunction: openCutTokens.animation.easing.easeOut,
    animationFillMode: 'forwards',
  },
  exiting: {
    '@keyframes toastExit': {
      '0%': {
        opacity: 1,
        transform: 'translateX(0)',
      },
      '100%': {
        opacity: 0,
        transform: 'translateX(100%)',
      },
    },
    animationName: 'toastExit',
    animationDuration: openCutTokens.animation.duration.fast,
    animationTimingFunction: openCutTokens.animation.easing.easeIn,
    animationFillMode: 'forwards',
  },
  noAnimation: {
    animation: 'none',
    opacity: 1,
    transform: 'translateX(0)',
  },
  icon: {
    flexShrink: 0,
    width: '20px',
    height: '20px',
  },
  iconSuccess: {
    color: '#34C759',
  },
  iconError: {
    color: '#FF3B30',
  },
  iconWarning: {
    color: '#FF9500',
  },
  iconInfo: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: openCutTokens.typography.fontSize.md,
    fontWeight: openCutTokens.typography.fontWeight.semibold,
    color: tokens.colorNeutralForeground1,
    lineHeight: openCutTokens.typography.lineHeight.tight,
    marginBottom: openCutTokens.spacing.xxs,
  },
  message: {
    fontSize: openCutTokens.typography.fontSize.sm,
    color: tokens.colorNeutralForeground2,
    lineHeight: openCutTokens.typography.lineHeight.normal,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: openCutTokens.spacing.xs,
    marginTop: openCutTokens.spacing.sm,
  },
  actionButton: {
    fontSize: openCutTokens.typography.fontSize.sm,
    padding: `${openCutTokens.spacing.xxs} ${openCutTokens.spacing.sm}`,
  },
  dismissButton: {
    flexShrink: 0,
    minWidth: '24px',
    height: '24px',
    padding: '0',
    color: tokens.colorNeutralForeground3,
    ':hover': {
      color: tokens.colorNeutralForeground1,
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '3px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressFill: {
    height: '100%',
    transformOrigin: 'left',
    willChange: 'transform',
    '@media (prefers-reduced-motion: reduce)': {
      transitionProperty: 'transform',
      transitionDuration: '0.1s',
      transitionTimingFunction: 'linear',
    },
  },
  progressFillAnimated: {
    '@keyframes progressShrink': {
      from: {
        transform: 'scaleX(1)',
      },
      to: {
        transform: 'scaleX(0)',
      },
    },
    animationName: 'progressShrink',
    animationTimingFunction: 'linear',
    animationFillMode: 'forwards',
  },
  progressFillPaused: {
    animationPlayState: 'paused',
  },
  progressSuccess: {
    backgroundColor: '#34C759',
  },
  progressError: {
    backgroundColor: '#FF3B30',
  },
  progressWarning: {
    backgroundColor: '#FF9500',
  },
  progressInfo: {
    backgroundColor: '#007AFF',
  },
});

/**
 * Get the icon component for a toast type
 */
function getToastIcon(type: ToastType) {
  switch (type) {
    case 'success':
      return CheckmarkCircle20Regular;
    case 'error':
      return ErrorCircle20Regular;
    case 'warning':
      return Warning20Regular;
    case 'info':
    default:
      return Info20Regular;
  }
}

/**
 * Toast notification component with animations and progress bar
 * Uses CSS animation for smooth, hardware-accelerated progress indication
 */
export const Toast: FC<ToastProps> = ({ toast, onDismiss }) => {
  const styles = useStyles();
  const prefersReducedMotion = useReducedMotion();
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [animationDuration, setAnimationDuration] = useState(
    toast.duration ?? DEFAULT_TOAST_DURATION
  );
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pauseStartTimeRef = useRef<number>(0);
  const totalPausedTimeRef = useRef<number>(0);
  const effectiveDuration = toast.duration ?? DEFAULT_TOAST_DURATION;

  const Icon = getToastIcon(toast.type);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    // Wait for exit animation before removing
    setTimeout(
      () => {
        onDismiss(toast.id);
      },
      prefersReducedMotion ? 0 : 150
    );
  }, [onDismiss, toast.id, prefersReducedMotion]);

  // Setup auto-dismiss timer with pause tracking
  useEffect(() => {
    if (effectiveDuration <= 0) {
      return;
    }

    // Clear any existing timeout
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
    }

    // Reset state
    totalPausedTimeRef.current = 0;
    pauseStartTimeRef.current = 0;
    setAnimationDuration(effectiveDuration);

    // Schedule dismiss
    dismissTimeoutRef.current = setTimeout(() => {
      handleDismiss();
    }, effectiveDuration);

    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
        dismissTimeoutRef.current = null;
      }
    };
  }, [effectiveDuration, handleDismiss]);

  // Handle pause - track when paused and calculate remaining time
  useEffect(() => {
    if (isPaused) {
      // Track when pause started
      pauseStartTimeRef.current = Date.now();

      // Clear the dismiss timeout
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
        dismissTimeoutRef.current = null;
      }
    } else if (pauseStartTimeRef.current > 0) {
      // Resuming from pause
      const pauseDuration = Date.now() - pauseStartTimeRef.current;
      totalPausedTimeRef.current += pauseDuration;

      // Calculate remaining time
      const remainingTime = effectiveDuration - totalPausedTimeRef.current;

      if (remainingTime > 0) {
        // Update animation duration to remaining time
        setAnimationDuration(remainingTime);

        // Reschedule dismiss
        dismissTimeoutRef.current = setTimeout(() => {
          handleDismiss();
        }, remainingTime);
      } else {
        // Time already expired, dismiss immediately
        handleDismiss();
      }

      pauseStartTimeRef.current = 0;
    }
  }, [isPaused, effectiveDuration, handleDismiss]);

  // Handle pause/resume
  const handleMouseEnter = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPaused(false);
  }, []);

  const iconClassName = mergeClasses(
    styles.icon,
    toast.type === 'success' && styles.iconSuccess,
    toast.type === 'error' && styles.iconError,
    toast.type === 'warning' && styles.iconWarning,
    toast.type === 'info' && styles.iconInfo
  );

  // Build progress fill class names based on animation state
  const progressFillBaseClasses = mergeClasses(
    styles.progressFill,
    toast.type === 'success' && styles.progressSuccess,
    toast.type === 'error' && styles.progressError,
    toast.type === 'warning' && styles.progressWarning,
    toast.type === 'info' && styles.progressInfo
  );

  const progressClassName = prefersReducedMotion
    ? progressFillBaseClasses
    : mergeClasses(
        progressFillBaseClasses,
        styles.progressFillAnimated,
        isPaused && styles.progressFillPaused
      );

  // For reduced motion, use transform with JS-controlled value; otherwise use CSS animation
  const progressStyle = prefersReducedMotion
    ? { transform: `scaleX(${isPaused ? 1 : 0})` }
    : { animationDuration: `${animationDuration}ms` };

  return (
    <div
      className={mergeClasses(
        styles.root,
        prefersReducedMotion ? styles.noAnimation : isExiting ? styles.exiting : styles.entering
      )}
      role="alert"
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Icon className={iconClassName} />

      <div className={styles.content}>
        <div className={styles.title}>{toast.title}</div>
        {toast.message && <div className={styles.message}>{toast.message}</div>}

        {toast.action && (
          <div className={styles.actions}>
            <Button
              appearance="primary"
              size="small"
              className={styles.actionButton}
              onClick={toast.action.onClick}
            >
              {toast.action.label}
            </Button>
          </div>
        )}
      </div>

      <Button
        appearance="transparent"
        icon={<Dismiss20Regular />}
        className={styles.dismissButton}
        onClick={handleDismiss}
        aria-label="Dismiss notification"
      />

      {/* Progress bar for auto-dismiss */}
      {effectiveDuration > 0 && (
        <div className={styles.progressBar}>
          <div className={progressClassName} style={progressStyle} />
        </div>
      )}
    </div>
  );
};

export default Toast;
