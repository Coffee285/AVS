/**
 * Toast Demo Page
 *
 * Simple page to demonstrate and test the smooth toast progress animations
 */

import { Button, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { useState } from 'react';
import { useNotifications } from '../components/Notifications/Toasts';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    ...shorthands.padding('40px'),
    ...shorthands.gap('24px'),
  },
  title: {
    fontSize: '32px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
    marginBottom: '16px',
  },
  subtitle: {
    fontSize: '16px',
    color: tokens.colorNeutralForeground2,
    marginBottom: '32px',
    textAlign: 'center',
    maxWidth: '600px',
  },
  buttonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    ...shorthands.gap('16px'),
    maxWidth: '600px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
    ...shorthands.padding('24px'),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius('8px'),
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
  },
  instructions: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
    marginTop: '32px',
    textAlign: 'center',
    maxWidth: '600px',
    lineHeight: '1.6',
  },
});

export default function ToastDemo() {
  const styles = useStyles();
  const { showSuccessToast, showFailureToast } = useNotifications();
  const [counter, setCounter] = useState(1);

  const handleShowQuickToast = () => {
    showSuccessToast({
      title: `Quick Toast ${counter}`,
      message: 'This toast will dismiss in 2 seconds',
      timeout: 2000,
    });
    setCounter(counter + 1);
  };

  const handleShowNormalToast = () => {
    showSuccessToast({
      title: `Normal Toast ${counter}`,
      message: 'This toast will dismiss in 5 seconds (default)',
      timeout: 5000,
    });
    setCounter(counter + 1);
  };

  const handleShowSlowToast = () => {
    showSuccessToast({
      title: `Slow Toast ${counter}`,
      message: 'This toast will dismiss in 10 seconds',
      timeout: 10000,
    });
    setCounter(counter + 1);
  };

  const handleShowErrorToast = () => {
    showFailureToast({
      title: `Error Toast ${counter}`,
      message: 'This is an error message with smooth progress',
      timeout: 5000,
      onRetry: () => console.log('Retry clicked'),
    });
    setCounter(counter + 1);
  };

  const handleShowWithActions = () => {
    showSuccessToast({
      title: `Toast with Actions ${counter}`,
      message: 'This toast has action buttons',
      timeout: 8000,
      outputPath: '/path/to/output/file.mp4',
      onOpenFile: () => console.log('Open file clicked'),
      onOpenFolder: () => console.log('Open folder clicked'),
    });
    setCounter(counter + 1);
  };

  const handleShowPersistent = () => {
    showSuccessToast({
      title: `Persistent Toast ${counter}`,
      message: 'This toast will not auto-dismiss (timeout: 0)',
      timeout: 0,
    });
    setCounter(counter + 1);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Toast Progress Animation Demo</h1>
      <p className={styles.subtitle}>
        Test the smooth CSS-based progress bar animations. Hover over toasts to pause the progress
        bar and auto-dismiss timer. Press ESC to dismiss the focused toast.
      </p>

      <div className={styles.buttonGrid}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Timing Variations</h2>
          <Button appearance="primary" onClick={handleShowQuickToast}>
            Quick Toast (2s)
          </Button>
          <Button appearance="primary" onClick={handleShowNormalToast}>
            Normal Toast (5s)
          </Button>
          <Button appearance="primary" onClick={handleShowSlowToast}>
            Slow Toast (10s)
          </Button>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Toast Types</h2>
          <Button appearance="primary" onClick={handleShowErrorToast}>
            Error Toast
          </Button>
          <Button appearance="primary" onClick={handleShowWithActions}>
            Toast with Actions
          </Button>
          <Button appearance="primary" onClick={handleShowPersistent}>
            Persistent Toast
          </Button>
        </div>
      </div>

      <div className={styles.instructions}>
        <strong>Key Features:</strong>
        <br />
        ✓ Smooth progress bar using CSS transform: scaleX() for hardware acceleration
        <br />
        ✓ No JavaScript setInterval for progress updates (only CSS animations)
        <br />
        ✓ Pause on hover stops both progress bar and auto-dismiss timer
        <br />
        ✓ Resume continues with accurate remaining time
        <br />
        ✓ ESC key dismisses the focused toast
        <br />
        ✓ Respects prefers-reduced-motion preference
        <br />
      </div>
    </div>
  );
}
