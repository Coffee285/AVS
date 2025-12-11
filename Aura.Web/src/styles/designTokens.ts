/**
 * OpenCut Design Token System
 *
 * A comprehensive design token system for the OpenCut video editor following
 * Apple Human Interface Guidelines for a premium, professional video editing
 * experience with generous spacing, refined typography, and elegant animations.
 */

/**
 * Core design tokens for OpenCut video editor.
 * These tokens provide a consistent design language across all components.
 */
export const openCutTokens = {
  /**
   * Spacing scale with tighter whitespace for professional NLE feel.
   * Based on 4px base unit with compact progression.
   */
  spacing: {
    /** 4px - Extra extra small */
    xxs: '0.25rem',
    /** 6px - Extra small */
    xs: '0.375rem',
    /** 8px - Small */
    sm: '0.5rem',
    /** 12px - Medium (base) */
    md: '0.75rem',
    /** 16px - Large */
    lg: '1rem',
    /** 24px - Extra large */
    xl: '1.5rem',
    /** 32px - Extra extra large */
    xxl: '2rem',
    /** 12px - Compact panel padding for professional NLE */
    panelPadding: '0.75rem',
    /** 16px - Tighter gap between sections */
    sectionGap: '1rem',
  },

  /**
   * Layout constants for panels and components.
   * Ensures consistent sizing across the editor.
   */
  layout: {
    /** Panel header minimum height - provides comfortable touch target */
    panelHeaderHeight: '52px',
    /** Panel toolbar height - compact but accessible */
    toolbarHeight: '44px',
    /** Standard control button size - 40px for comfortable interaction */
    controlButtonSize: '40px',
    /** Compact control button size - 36px for dense UIs */
    controlButtonSizeCompact: '36px',
    /** Small icon button size - 32px for inline actions */
    iconButtonSize: '32px',
    /** Standard hit target size for touch - matches Apple HIG 48px */
    hitTargetSize: '48px',
    /** Track label width in timeline */
    trackLabelWidth: '160px',
    /** Sidebar minimum width */
    sidebarMinWidth: '220px',
    /** Sidebar maximum width */
    sidebarMaxWidth: '380px',
    /** Default sidebar width as viewport percentage */
    sidebarDefaultPercent: 0.15,
  },

  /**
   * Typography system for professional video editing interface.
   * Uses system fonts for optimal rendering and familiarity.
   */
  typography: {
    fontFamily: {
      /** Display font stack for headers and titles */
      display: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
      /** Body font stack for general text */
      body: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
      /** Monospace font stack for timecodes and technical values */
      mono: '"SF Mono", ui-monospace, "Cascadia Code", monospace',
    },
    fontSize: {
      /** 0.75rem (12px) - Extra small for labels and badges */
      xs: '0.75rem',
      /** 0.8125rem (13px) - Small for secondary info */
      sm: '0.8125rem',
      /** 0.9375rem (15px) - Base size for body text */
      base: '0.9375rem',
      /** 1rem (16px) - Medium for emphasis */
      md: '1rem',
      /** 1.0625rem (17px) - Large for section headers */
      lg: '1.0625rem',
      /** 1.125rem (18px) - Extra large for panel headers */
      xl: '1.125rem',
      /** 1.375rem (22px) - Extra extra large for titles */
      xxl: '1.375rem',
    },
    fontWeight: {
      /** 400 - Regular weight */
      regular: 400,
      /** 500 - Medium weight for subtle emphasis */
      medium: 500,
      /** 600 - Semibold for headers */
      semibold: 600,
      /** 700 - Bold for strong emphasis */
      bold: 700,
    },
    lineHeight: {
      /** 1.2 - Tight line height for compact UI */
      tight: 1.2,
      /** 1.4 - Normal line height for readability */
      normal: 1.4,
      /** 1.6 - Relaxed line height for body text */
      relaxed: 1.6,
    },
  },

  /**
   * Semantic color tokens for the OpenCut interface.
   * Professional dark theme matching industry standards like Adobe Premiere Pro.
   */
  colors: {
    // Background layers (darker = further back in the stack)
    bg: {
      /** #0d0d0d - Deepest background behind everything */
      deepest: '#0d0d0d',
      /** #141414 - Main app background */
      deep: '#141414',
      /** #1a1a1a - Panel surfaces */
      surface: '#1a1a1a',
      /** #222222 - Elevated cards and menus */
      elevated: '#222222',
      /** #2a2a2a - Hover state backgrounds */
      highlight: '#2a2a2a',
    },

    // Foreground colors
    fg: {
      /** #e8e8e8 - Main text color */
      primary: '#e8e8e8',
      /** #a0a0a0 - Secondary text */
      secondary: '#a0a0a0',
      /** #666666 - Disabled/hints text */
      tertiary: '#666666',
      /** #0d0d0d - Text on accent colors */
      inverse: '#0d0d0d',
    },

    // Borders (subtle, using transparency)
    border: {
      /** Very subtle border */
      subtle: 'rgba(255, 255, 255, 0.06)',
      /** Default border */
      default: 'rgba(255, 255, 255, 0.10)',
      /** Strong border */
      strong: 'rgba(255, 255, 255, 0.15)',
    },

    // Accent colors
    accent: {
      /** #5c9eff - Main accent blue */
      primary: '#5c9eff',
      /** #3d7bd9 - Darker accent */
      secondary: '#3d7bd9',
      /** Subtle selection background */
      subtle: 'rgba(92, 158, 255, 0.15)',
    },

    // Clip colors with gradients
    clips: {
      video: {
        /** Gradient for video clips */
        bg: 'linear-gradient(180deg, #4a7c9b 0%, #3a6277 100%)',
        /** Border color for video clips */
        border: '#5a8caa',
      },
      audio: {
        /** Gradient for audio clips */
        bg: 'linear-gradient(180deg, #5a9b5e 0%, #4a7f4d 100%)',
        /** Border color for audio clips */
        border: '#6aab6e',
      },
      text: {
        /** Gradient for text clips */
        bg: 'linear-gradient(180deg, #9b7a5a 0%, #7f6349 100%)',
        /** Border color for text clips */
        border: '#ab8a6a',
      },
      image: {
        /** Gradient for image clips */
        bg: 'linear-gradient(180deg, #7a5a9b 0%, #634980 100%)',
        /** Border color for image clips */
        border: '#8a6aab',
      },
    },

    // Semantic colors
    /** #4caf50 - Success color */
    success: '#4caf50',
    /** #ff9800 - Warning color */
    warning: '#ff9800',
    /** #f44336 - Error color */
    error: '#f44336',

    // Legacy colors for backward compatibility (will be deprecated)
    /** Red for playhead */
    playhead: '#EF4444',
    /** Blue for selection highlight */
    selection: '#3B82F6',
    /** Violet for snap indicators */
    snap: '#8B5CF6',
    /** Orange for markers */
    marker: '#F97316',

    // Interactive state colors (legacy)
    /** Subtle hover state */
    hover: 'rgba(255, 255, 255, 0.05)',
    /** Active/pressed state */
    active: 'rgba(255, 255, 255, 0.1)',
    /** Disabled state */
    disabled: 'rgba(255, 255, 255, 0.3)',
  },

  /**
   * Shadow system for depth and elevation.
   * Progressive depth levels from subtle to dramatic.
   */
  shadows: {
    /** Subtle shadow for inline elements */
    subtle: '0 1px 2px rgba(0, 0, 0, 0.1)',
    /** Small shadow for cards */
    sm: '0 2px 4px rgba(0, 0, 0, 0.15)',
    /** Medium shadow for panels */
    md: '0 4px 12px rgba(0, 0, 0, 0.2)',
    /** Large shadow for dialogs */
    lg: '0 8px 24px rgba(0, 0, 0, 0.25)',
    /** Extra large shadow for modals */
    xl: '0 16px 48px rgba(0, 0, 0, 0.3)',
    /** Floating shadow for tooltips and popovers */
    floating: '0 10px 40px rgba(0, 0, 0, 0.35)',
  },

  /**
   * Border radius scale for consistent rounding.
   * From minimal to full circular.
   */
  radius: {
    /** 4px - Extra small for inputs */
    xs: '4px',
    /** 6px - Small for buttons */
    sm: '6px',
    /** 8px - Medium for cards */
    md: '8px',
    /** 12px - Large for panels */
    lg: '12px',
    /** 16px - Extra large for dialogs */
    xl: '16px',
    /** Full circular radius */
    full: '9999px',
  },

  /**
   * Animation system for smooth, professional transitions.
   * Timing and easing curves for consistent motion.
   */
  animation: {
    duration: {
      /** 50ms - Instant response for micro-interactions */
      instant: '50ms',
      /** 150ms - Fast transitions for small elements */
      fast: '150ms',
      /** 250ms - Normal transitions for most animations */
      normal: '250ms',
      /** 400ms - Slow transitions for large elements */
      slow: '400ms',
      /** 600ms - Slower transitions for dramatic effect */
      slower: '600ms',
    },
    easing: {
      /** Ease out - starts fast, ends slow (natural deceleration) */
      easeOut: 'cubic-bezier(0.25, 1, 0.5, 1)',
      /** Ease in - starts slow, ends fast (acceleration) */
      easeIn: 'cubic-bezier(0.5, 0, 0.75, 0)',
      /** Ease in-out - smooth start and end */
      easeInOut: 'cubic-bezier(0.45, 0, 0.55, 1)',
      /** Spring - slight overshoot for playful feel */
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      /** Bounce - elastic overshoot for emphasis */
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  /**
   * Z-index layering system for consistent stacking.
   * Logical layers from base content to toast notifications.
   */
  zIndex: {
    /** 0 - Base content layer */
    base: 0,
    /** 100 - Dropdowns and select menus */
    dropdown: 100,
    /** 200 - Sticky headers and footers */
    sticky: 200,
    /** 300 - Overlay backgrounds */
    overlay: 300,
    /** 400 - Modal dialogs */
    modal: 400,
    /** 500 - Popovers and popups */
    popover: 500,
    /** 600 - Tooltips */
    tooltip: 600,
    /** 700 - Toast notifications */
    toast: 700,
  },

  /**
   * Interaction styles for user interface elements.
   * Controls text selection and editing behavior.
   */
  interaction: {
    /** Prevent text selection on UI labels and non-editable content */
    noSelect: {
      userSelect: 'none',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
    },
    /** Allow text selection in editable areas */
    editable: {
      userSelect: 'text',
      WebkitUserSelect: 'text',
    },
  },

  /**
   * Cursor styles for professional NLE interactions.
   * Provides visual feedback for different interactive zones.
   */
  cursors: {
    /** Default cursor for general UI */
    default: 'default',
    /** Pointer cursor for clickable elements */
    pointer: 'pointer',
    /** Open hand cursor for draggable items */
    grab: 'grab',
    /** Closed hand cursor while dragging */
    grabbing: 'grabbing',
    /** East-west resize cursor for horizontal resizing (trim handles) */
    resizeEW: 'ew-resize',
    /** North-south resize cursor for vertical resizing (track height) */
    resizeNS: 'ns-resize',
    /** Column resize cursor for horizontal panel dividers */
    resizeCol: 'col-resize',
    /** Row resize cursor for horizontal dividers */
    resizeRow: 'row-resize',
    /** Move cursor for repositioning elements */
    move: 'move',
    /** Copy cursor for drag-and-drop operations */
    copy: 'copy',
    /** Not-allowed cursor for disabled/locked elements */
    notAllowed: 'not-allowed',
    /** Text cursor for editable text areas */
    text: 'text',
    /** Crosshair cursor for precision selection */
    crosshair: 'crosshair',
  },

  /**
   * Preview-specific design tokens for intelligent scaling and presentation.
   * Optimized for professional video preview with minimal letterboxing.
   */
  preview: {
    /** Very dark background for preview area - provides maximum contrast */
    backgroundDark: '#0a0a0a',
    /** Pure black for canvas background */
    canvasBackground: '#000000',
    /** Subtle inner shadow for depth perception */
    innerShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.5)',
    /** Canvas shadow for elevation */
    canvasShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
    /** Padding around preview content */
    containerPadding: '16px',
    /** Empty state icon size */
    emptyIconSize: '48px',
    /** Empty state icon background */
    emptyIconBackground: 'rgba(255, 255, 255, 0.05)',
    /** Empty state icon color */
    emptyIconColor: 'rgba(255, 255, 255, 0.3)',
    /** Empty state text color */
    emptyTextColor: 'rgba(255, 255, 255, 0.5)',
    /** Empty state text size */
    emptyTextSize: '12px',
    /** Transition duration for smooth resizing */
    transitionDuration: '0.2s',
    /** Transition easing function */
    transitionEasing: 'ease',
  },
} as const;

/**
 * Framer Motion animation variants for consistent, reusable animations.
 * Use these with AnimatePresence for enter/exit transitions.
 */
export const motionVariants = {
  /** Simple fade in/out */
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  /** Slide up with fade */
  slideUp: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
  },

  /** Slide down with fade */
  slideDown: {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  },

  /** Scale in with fade */
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },

  /** Spring scale in with slight overshoot */
  springIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 20 },
    },
  },

  /** Slide in from left */
  slideFromLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },

  /** Slide in from right */
  slideFromRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },

  /** Collapse/expand for accordion sections */
  collapse: {
    initial: { height: 0, opacity: 0 },
    animate: { height: 'auto', opacity: 1 },
    exit: { height: 0, opacity: 0 },
  },
} as const;

/**
 * Default transition configuration for framer-motion.
 */
export const defaultTransition = {
  duration: 0.25,
  ease: [0.25, 1, 0.5, 1], // easeOut
} as const;

/**
 * Reduced motion transition for accessibility.
 * Used when prefers-reduced-motion is enabled.
 */
export const reducedMotionTransition = {
  duration: 0,
  ease: 'linear',
} as const;
