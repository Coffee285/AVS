# Design System Quick Reference

**Version:** 1.0  
**Last Updated:** December 2024

A quick reference guide for Aura Video Studio's unified design system.

---

## Spacing Tokens

Use these for all margins, padding, and gaps. Prefer 8px increments (sm, md, lg) for most layouts.

| Token | Size | Pixels | Use For |
|-------|------|--------|---------|
| `--space-xs` | 0.25rem | 4px | Tight spacing within components |
| `--space-sm` | 0.5rem | 8px | Between related elements |
| `--space-md` | 1rem | 16px | Standard component gap |
| `--space-lg` | 1.5rem | 24px | Section spacing |
| `--space-xl` | 2rem | 32px | Major section breaks |
| `--space-2xl` | 3rem | 48px | Page-level spacing |
| `--space-3xl` | 4rem | 64px | Maximum spacing |

**Tailwind Classes:** `gap-1` (4px), `gap-2` (8px), `gap-4` (16px), `gap-6` (24px), `gap-8` (32px)

---

## Typography Scale

Clear hierarchy with 7 semantic levels. All sizes are rem-based for accessibility.

| Token | Size | Pixels | Weight | Use For |
|-------|------|--------|--------|---------|
| `--text-display` | 2.25rem | 36px | 600 | Hero headings, splash screens |
| `--text-title1` | 1.75rem | 28px | 600 | Page titles |
| `--text-title2` | 1.5rem | 24px | 600 | Section headers |
| `--text-title3` | 1.25rem | 20px | 600 | Subsection headers |
| `--text-body` | 0.875rem | 14px | 400 | Standard body text |
| `--text-caption` | 0.75rem | 12px | 400 | Labels, captions |
| `--text-small` | 0.6875rem | 11px | 400 | Fine print, footnotes |

**Utility Classes:** `.text-display`, `.text-title1`, `.text-body`, etc.

**Tailwind:** `text-3xl` (36px), `text-2xl` (28px), `text-xl` (24px), `text-lg` (20px), `text-base` (14px), `text-sm` (12px), `text-xs` (11px)

---

## Color System

Semantic names mapped to Fluent UI tokens for automatic dark mode support.

### Backgrounds
```css
--bg-app                /* Main app canvas */
--bg-surface            /* Cards, panels */
--bg-elevated           /* Elevated surfaces (modals) */
--bg-overlay            /* Full-screen overlays */
```

### Borders
```css
--border-default        /* Standard borders */
--border-subtle         /* Subtle dividers */
--border-strong         /* Emphasis borders */
```

### Text
```css
--text-primary          /* Primary text (highest contrast) */
--text-secondary        /* Secondary text */
--text-tertiary         /* Tertiary text (subtle) */
--text-disabled         /* Disabled state */
--text-on-brand         /* Text on brand color backgrounds */
```

### Brand
```css
--brand-primary         /* Primary brand color */
--brand-hover           /* Brand hover state */
--brand-pressed         /* Brand pressed state */
--brand-foreground      /* Text color for brand buttons */
```

### Status
```css
--status-success        /* Green - Success states */
--status-success-bg     /* Light green background */
--status-warning        /* Amber - Warning states */
--status-warning-bg     /* Light amber background */
--status-error          /* Red - Error states */
--status-error-bg       /* Light red background */
--status-info           /* Blue - Info states */
--status-info-bg        /* Light blue background */
```

---

## Elevation System

5 levels of shadows for depth hierarchy. Use semantic levels, not arbitrary shadows.

| Level | Token | Use For | Shadow Size |
|-------|-------|---------|-------------|
| 0 | `--shadow-0` | Flat elements | none |
| 1 | `--shadow-1` | Cards on surface | 1-2px |
| 2 | `--shadow-2` | Hover states, dropdowns | 2-4px |
| 3 | `--shadow-3` | Modals, tooltips | 4-12px |
| 4 | `--shadow-4` | Context menus, dialogs | 8-24px |
| 5 | `--shadow-5` | Full-screen overlays | 16-48px |

**Special:**
- `--shadow-glow` - Brand glow effect (buttons, focus)
- `--shadow-glow-sm` - Subtle glow
- `--shadow-inner` - Inset shadow (pressed states)

**Utility Classes:** `.elevation-1`, `.elevation-2`, etc.

---

## Border Radius

Consistent rounding for all surfaces and components.

| Token | Size | Use For |
|-------|------|---------|
| `--radius-sm` | 4px | Small components (tags, badges) |
| `--radius-md` | 8px | Standard (buttons, inputs, cards) |
| `--radius-lg` | 12px | Large panels, modals |
| `--radius-xl` | 16px | Hero sections |
| `--radius-2xl` | 20px | Extra large surfaces |
| `--radius-full` | 9999px | Pills, circular avatars |

**Tailwind:** `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full`

---

## Animation System

### Easing Functions

| Token | Curve | Use For |
|-------|-------|---------|
| `--ease-standard` | cubic-bezier(0.4, 0, 0.2, 1) | Standard transitions |
| `--ease-in` | cubic-bezier(0.4, 0, 1, 1) | Entering elements |
| `--ease-out` | cubic-bezier(0, 0, 0.2, 1) | Exiting elements |
| `--ease-in-out` | cubic-bezier(0.4, 0, 0.2, 1) | In and out |
| `--ease-bounce` | cubic-bezier(0.68, -0.55, 0.265, 1.55) | Emphasis, bounce |
| `--ease-smooth` | cubic-bezier(0.65, 0, 0.35, 1) | Smooth motion |

### Duration Tokens

| Token | Time | Use For |
|-------|------|---------|
| `--duration-instant` | 100ms | Immediate feedback (hover, focus) |
| `--duration-fast` | 150ms | Quick transitions (tooltips) |
| `--duration-normal` | 250ms | Standard animations (modals, panels) |
| `--duration-slow` | 350ms | Deliberate animations (page transitions) |
| `--duration-slowest` | 500ms | Very slow (large movements) |

**Example:**
```css
transition: all var(--duration-fast) var(--ease-out);
```

---

## Z-Index System

Predictable stacking order. Always use these tokens, never arbitrary values.

| Level | Token | Value | Use For |
|-------|-------|-------|---------|
| Base | `--z-base` | 0 | Normal document flow |
| Sticky | `--z-sticky` | 100 | Sticky headers |
| Dropdown | `--z-dropdown` | 1000 | Dropdowns, popovers |
| Modal | `--z-modal` | 2000 | Modals, dialogs |
| Overlay | `--z-overlay` | 3000 | Full-screen overlays |
| Toast | `--z-toast` | 4000 | Toast notifications |
| Tooltip | `--z-tooltip` | 5000 | Tooltips (always on top) |

---

## Layout Constants

### Container Widths
```css
--container-sm: 640px     /* Small content */
--container-md: 768px     /* Medium content */
--container-lg: 1024px    /* Large content (default) */
--container-xl: 1280px    /* Extra large content */
--container-2xl: 1536px   /* Maximum content width */
```

### Sidebar & Panels
```css
--sidebar-width: 240px              /* Standard sidebar */
--sidebar-width-collapsed: 60px     /* Collapsed sidebar */

--panel-min-width: 200px            /* Minimum panel width */
--panel-default-width: 280px        /* Default panel width */
--panel-max-width: 400px            /* Maximum panel width */
```

### Heights
```css
--header-height: 48px     /* Standard header (Apple HIG 44pt+) */
--toolbar-height: 40px    /* Secondary toolbar */
--footer-height: 32px     /* Footer bar */
```

---

## Common Patterns

### Card
```css
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-1);
}
```

Or use utility class:
```html
<div class="surface-card">
  Content
</div>
```

### Button
```css
.button {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--text-body);
  font-weight: var(--font-weight-medium);
  transition: all var(--duration-fast) var(--ease-out);
}

.button:hover {
  box-shadow: var(--shadow-2);
}
```

### Panel Header
```css
.panel-header {
  min-height: 40px;
  padding: 0 var(--space-md);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}
```

### Separator
```css
.separator-vertical {
  width: 1px;
  background: var(--border-subtle);
}

.separator-horizontal {
  height: 1px;
  background: var(--border-subtle);
}
```

---

## Layout Components

### Stack
Flex-based vertical or horizontal layout with consistent gaps.

```tsx
import { Stack } from '@/components/layout';

// Vertical stack
<Stack direction="vertical" gap="lg">
  <Item1 />
  <Item2 />
</Stack>

// Horizontal with space-between
<Stack direction="horizontal" gap="sm" justify="space-between">
  <Button>Cancel</Button>
  <Button>Save</Button>
</Stack>
```

### Container
Centered container with max-width constraint.

```tsx
import { Container } from '@/components/layout';

<Container maxWidth="lg" padding="lg">
  <PageContent />
</Container>
```

### Grid
Responsive CSS Grid layout.

```tsx
import { Grid } from '@/components/layout';

// Auto-responsive (fills columns)
<Grid minColumnWidth="250px" gap="md">
  {items.map(item => <Card key={item.id}>{item}</Card>)}
</Grid>

// Fixed columns
<Grid columns={3} gap="lg">
  <Card>1</Card>
  <Card>2</Card>
  <Card>3</Card>
</Grid>
```

### Spacer
Explicit spacing element.

```tsx
import { Spacer } from '@/components/layout';

<Section1 />
<Spacer size="xl" />
<Section2 />
```

---

## Common Components

### PageHeader
```tsx
import { PageHeader } from '@/components/common/PageHeader';

<PageHeader
  title="My Page"
  subtitle="Optional description"
  actions={<Button>Action</Button>}
/>
```

### EmptyState
```tsx
import { EmptyState } from '@/components/common/EmptyState';

<EmptyState
  icon={<FolderOpen24Regular />}
  title="No items yet"
  description="Get started by creating one"
  action={<Button>Create Item</Button>}
/>
```

---

## Utility Classes

### Elevation
```html
<div class="elevation-1">Card with subtle shadow</div>
<div class="elevation-3">Modal with pronounced shadow</div>
```

### Typography
```html
<h1 class="text-display">Display Text</h1>
<h2 class="text-title1">Title 1</h2>
<p class="text-body">Body text</p>
<span class="text-caption">Caption text</span>
```

### Surfaces
```html
<div class="surface-elevated">Elevated card</div>
<div class="surface-card">Standard card with border</div>
```

### Transitions
```html
<button class="transition-standard">Hover me</button>
<div class="transition-colors">Color transitions only</div>
```

### Text Utilities
```html
<p class="text-truncate">Long text that will truncate...</p>
<p class="line-clamp-2">Multi-line text limited to 2 lines...</p>
```

---

## OpenCut Premium Classes

### Panel
```html
<div class="opencut-panel">
  <div class="opencut-panel-header">
    <span class="opencut-panel-title">Media</span>
  </div>
  <div class="opencut-panel-content">
    Content with premium scrollbars
  </div>
</div>
```

### Separator
```html
<div class="opencut-panel-separator">
  <div class="resize-handle"></div>
</div>
```

### Tabs
```html
<div class="opencut-tabs">
  <button class="opencut-tab active">Media</button>
  <button class="opencut-tab">Effects</button>
</div>
```

### Utilities
```html
<div class="opencut-divider-vertical"></div>
<div class="opencut-no-select">Non-selectable text</div>
<div class="opencut-scrollable-y">Vertical scroll only</div>
```

---

## Zoom System

### useZoom Hook
```tsx
import { useZoom } from '@/hooks/useZoom';

function MyComponent() {
  const { zoom, isZoomed, isZoomedIn, isZoomedOut } = useZoom();
  
  return (
    <div>
      Current zoom: {zoom}%
      {isZoomedIn && <p>Zoomed in</p>}
    </div>
  );
}
```

### useZoomChange Hook
```tsx
import { useZoomChange } from '@/hooks/useZoom';

function MyComponent() {
  useZoomChange((newZoom) => {
    console.log('Zoom changed to', newZoom);
    // Adjust component behavior based on zoom
  });
  
  return <div>Content</div>;
}
```

### useZoomAwareValue Hook
```tsx
import { useZoomAwareValue } from '@/hooks/useZoom';

function MyComponent() {
  // Get a size that scales with zoom
  const scaledSize = useZoomAwareValue(16); // 16px at 100%, 22.4px at 140%
  
  return <div style={{ width: scaledSize }}>Content</div>;
}
```

---

## Responsive Breakpoints

Use these for consistent responsive behavior.

```css
--breakpoint-sm: 640px    /* Small devices (landscape phones) */
--breakpoint-md: 768px    /* Medium devices (tablets) */
--breakpoint-lg: 1024px   /* Large devices (desktops) */
--breakpoint-xl: 1280px   /* Extra large devices */
--breakpoint-2xl: 1536px  /* 2X large devices */
```

**Tailwind:** `sm:`, `md:`, `lg:`, `xl:`, `2xl:`

---

## Best Practices

### DO ✅
- Use design tokens for all spacing, colors, shadows
- Use semantic color names (--text-primary, not hardcoded colors)
- Use layout components (Stack, Container, Grid) for consistency
- Use utility classes over inline styles
- Use rem units for font sizes (accessibility)
- Use 4px increments, prefer 8px (xs/sm/md/lg)
- Test at multiple zoom levels (80%, 100%, 140%, 180%)
- Test responsive behavior at all breakpoints

### DON'T ❌
- Don't use arbitrary spacing values (use tokens)
- Don't use arbitrary colors (use semantic tokens)
- Don't use arbitrary z-index values (use z-index tokens)
- Don't use pixel units for font sizes (use rem)
- Don't use inline styles (use classes or tokens)
- Don't break the 4px grid (always use 4px increments)
- Don't add TODO/FIXME/HACK comments (create GitHub issues)

---

## Migration Guide

### From Old to New

**Spacing:**
```css
/* ❌ Before */
padding: 20px;
margin-bottom: 16px;

/* ✅ After */
padding: var(--space-lg);        /* 24px, on grid */
margin-bottom: var(--space-md);  /* 16px, standard gap */
```

**Typography:**
```css
/* ❌ Before */
font-size: 24px;
font-weight: 600;

/* ✅ After */
font-size: var(--text-title2);
font-weight: var(--font-weight-semibold);
```

**Colors:**
```css
/* ❌ Before */
color: #333;
background: #f8f9fa;

/* ✅ After */
color: var(--text-primary);
background: var(--bg-surface);
```

**Shadows:**
```css
/* ❌ Before */
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

/* ✅ After */
box-shadow: var(--shadow-2);
```

---

## File Locations

- **Design System:** `src/styles/design-system.css`
- **OpenCut Premium:** `src/styles/opencut-premium.css`
- **Layout Components:** `src/components/layout/`
- **Common Components:** `src/components/common/`
- **Zoom Hooks:** `src/hooks/useZoom.ts`
- **Zoom Constants:** `src/constants/zoom.ts`
- **Tailwind Config:** `tailwind.config.js`

---

## Resources

- **Architecture:** `docs/ux/UX_AUDIT_AND_PLAN.md`
- **Implementation:** `docs/ux/IMPLEMENTATION_SUMMARY.md`
- **Tests:** `src/components/layout/__tests__/`, `src/constants/__tests__/zoom.test.ts`

---

**Quick Start:** Copy this reference, use tokens everywhere, test at multiple zooms! 🚀
