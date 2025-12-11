/**
 * ScrubbableInput Component
 *
 * A numeric input that supports drag-to-change interaction.
 * Users can click and drag horizontally to adjust values smoothly.
 */

import { makeStyles, tokens, mergeClasses } from '@fluentui/react-components';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import { openCutTokens } from '../../../styles/designTokens';

export interface ScrubbableInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  label?: string;
  className?: string;
}

const useStyles = makeStyles({
  scrubbableInput: {
    display: 'flex',
    alignItems: 'center',
    gap: openCutTokens.spacing.xs,
  },
  scrubbableLabel: {
    color: tokens.colorNeutralForeground3,
    fontSize: openCutTokens.typography.fontSize.sm,
    minWidth: '56px',
  },
  scrubbableValue: {
    display: 'flex',
    alignItems: 'center',
    gap: openCutTokens.spacing.xs,
    padding: `${openCutTokens.spacing.xs} ${openCutTokens.spacing.sm}`,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: openCutTokens.radius.sm,
    cursor: 'ew-resize',
    userSelect: 'none',
    fontSize: openCutTokens.typography.fontSize.sm,
    color: tokens.colorNeutralForeground2,
    fontFamily: openCutTokens.typography.fontFamily.mono,
    transition: `background-color ${openCutTokens.animation.duration.fast} ${openCutTokens.animation.easing.easeOut}`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground4,
    },
  },
  scrubbableValueDragging: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  scrubbableSuffix: {
    color: tokens.colorNeutralForeground4,
    fontSize: openCutTokens.typography.fontSize.xs,
  },
});

export const ScrubbableInput: FC<ScrubbableInputProps> = ({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  suffix = '',
  label,
  className,
}) => {
  const styles = useStyles();
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startValue = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startX.current = e.clientX;
      startValue.current = value;
      document.body.style.cursor = 'ew-resize';
    },
    [value]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX.current;
      const deltaValue = deltaX * step;
      const newValue = Math.max(min, Math.min(max, startValue.current + deltaValue));
      onChange(Math.round(newValue / step) * step);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, min, max, step, onChange]);

  return (
    <div className={mergeClasses(styles.scrubbableInput, className)}>
      {label && <label className={styles.scrubbableLabel}>{label}</label>}
      <div
        className={mergeClasses(
          styles.scrubbableValue,
          isDragging && styles.scrubbableValueDragging
        )}
        onMouseDown={handleMouseDown}
        role="slider"
        aria-label={label || 'Numeric value'}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        tabIndex={0}
      >
        <span>{value}</span>
        {suffix && <span className={styles.scrubbableSuffix}>{suffix}</span>}
      </div>
    </div>
  );
};

export default ScrubbableInput;
