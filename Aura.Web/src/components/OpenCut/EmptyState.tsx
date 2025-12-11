/**
 * EmptyState Component
 *
 * A reusable empty state component following Apple HIG principles.
 * Features engaging visuals, clear messaging, and optional action buttons.
 */

import { makeStyles, tokens, Text, Button, mergeClasses } from '@fluentui/react-components';
import { motion } from 'framer-motion';
import type { FC, ReactNode, JSX } from 'react';
import { openCutTokens } from '../../styles/designTokens';

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: JSX.Element;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    height: '100%',
    minHeight: '100px',
  },
  containerSmall: {
    padding: openCutTokens.spacing.sm,
    gap: openCutTokens.spacing.xs,
  },
  containerMedium: {
    padding: openCutTokens.spacing.md,
    gap: openCutTokens.spacing.sm,
  },
  containerLarge: {
    padding: openCutTokens.spacing.lg,
    gap: openCutTokens.spacing.md,
  },
  iconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground3,
    transition: `transform ${openCutTokens.animation.duration.normal} ${openCutTokens.animation.easing.easeOut}, background-color ${openCutTokens.animation.duration.normal} ${openCutTokens.animation.easing.easeOut}`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground4,
    },
  },
  iconSmall: {
    width: '32px',
    height: '32px',
    '& svg': {
      width: '16px',
      height: '16px',
    },
  },
  iconMedium: {
    width: '48px',
    height: '48px',
    '& svg': {
      width: '24px',
      height: '24px',
    },
  },
  iconLarge: {
    width: '64px',
    height: '64px',
    '& svg': {
      width: '32px',
      height: '32px',
    },
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: openCutTokens.spacing.xs,
    maxWidth: '240px',
  },
  title: {
    color: tokens.colorNeutralForeground1,
  },
  description: {
    color: tokens.colorNeutralForeground3,
    lineHeight: openCutTokens.typography.lineHeight.normal.toString(),
  },
  actionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: openCutTokens.spacing.sm,
    marginTop: openCutTokens.spacing.sm,
  },
});

export const EmptyState: FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'medium',
  className,
}) => {
  const styles = useStyles();

  const containerSizeClass =
    size === 'small'
      ? styles.containerSmall
      : size === 'large'
        ? styles.containerLarge
        : styles.containerMedium;

  const iconSizeClass =
    size === 'small' ? styles.iconSmall : size === 'large' ? styles.iconLarge : styles.iconMedium;

  return (
    <div className={mergeClasses(styles.container, containerSizeClass, className)}>
      <motion.div
        className={mergeClasses(styles.iconWrapper, iconSizeClass)}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {icon}
      </motion.div>

      <motion.div
        className={styles.textContainer}
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
      >
        <Text
          weight="semibold"
          size={size === 'small' ? 300 : size === 'large' ? 500 : 400}
          className={styles.title}
        >
          {title}
        </Text>
        {description && (
          <Text size={size === 'small' ? 200 : 300} className={styles.description}>
            {description}
          </Text>
        )}
      </motion.div>

      {(action || secondaryAction) && (
        <motion.div
          className={styles.actionsContainer}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2, ease: 'easeOut' }}
        >
          {action && (
            <Button
              appearance="primary"
              icon={action.icon}
              onClick={action.onClick}
              size={size === 'small' ? 'small' : 'medium'}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              appearance="subtle"
              onClick={secondaryAction.onClick}
              size={size === 'small' ? 'small' : 'medium'}
            >
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default EmptyState;
