# NexusOne Design System Guide
**Version**: 2.0
**Last Updated**: October 7, 2025

## Table of Contents
1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Spacing & Layout](#spacing--layout)
6. [Components](#components)
7. [Shadows & Elevation](#shadows--elevation)
8. [Animation & Motion](#animation--motion)
9. [Accessibility](#accessibility)
10. [Best Practices](#best-practices)

---

## Overview

The NexusOne Design System is built on **expert-first enterprise UX principles**, utilizing proven interface patterns enhanced with AI-powered insights. This guide ensures consistency, maintainability, and accessibility across all components.

### Core Technologies
- **Framework**: Next.js 14.1.0 with React 18
- **Styling**: Tailwind CSS + CSS Variables
- **Theming**: next-themes with 16 theme variants
- **Icons**: Lucide React + Custom Pixel Icons
- **Fonts**: Reckless (display), Roobert (body), JetBrains Mono (code)

---

## Design Principles

### 1. Traditional Enterprise UX First
Use familiar patterns that data engineers already understand:
- Dashboard overviews with drill-down
- Tabbed interfaces for configurations
- Modal workflows for complex processes
- Breadcrumb navigation

### 2. Deep Focus Optimization
Interfaces designed for sustained technical work:
- Complex configuration without cognitive overhead
- Full technical control exposed immediately
- Familiar patterns that reduce learning curve

### 3. AI Enhancement Without Replacement
AI augments human expertise:
- Reactive intelligence responding to user intent
- Transparent reasoning with override capability
- Cross-system pattern recognition

---

## Color System

### CSS Variable Architecture

All colors use HSL-based CSS variables for theme compatibility:

```css
/* Primary colors */
--primary: 224 75% 68%;        /* Blue accent */
--accent: 174 100% 45%;        /* Cyan/teal accent */
--destructive: 0 84% 60%;      /* Red for errors */
--success: 142 76% 36%;        /* Green for success */
--warning: 38 92% 50%;         /* Orange for warnings */

/* Base colors */
--background: 0 0% 100%;       /* Page background */
--foreground: 222 47% 11%;     /* Primary text */
--card: 0 0% 100%;            /* Card backgrounds */
--border: 214 32% 91%;        /* Borders and dividers */
--muted: 210 40% 96%;         /* Muted backgrounds */
```

### Usage Guidelines

**DO** ✅
```tsx
// Use design tokens
<div className="bg-primary text-primary-foreground">
<div className="border-accent/30">
<div style={{ backgroundColor: 'hsl(var(--primary))' }}>
```

**DON'T** ❌
```tsx
// Never use hardcoded colors
<div className="bg-[#5B6EFF]">
<div style={{ color: '#00E5C8' }}>
```

### Theme Variants

#### Light Themes
1. **Light** - Clean, modern default
2. **Solarized Light** - Low contrast, beige tones
3. **Gruvbox Light** - Warm, retro aesthetic
4. **Nature Light** - Green-tinted natural
5. **Amethyst Haze Light** - Purple mystical
6. **Modus Light** - High contrast accessibility

#### Dark Themes
1. **Dark** - Standard dark theme
2. **Dracula** - Purple accents, pink highlights
3. **Solarized Dark** - Blue-tinted low contrast
4. **One Dark Pro** - VSCode-inspired
5. **Gruvbox Dark** - Dark warm colors
6. **Nature Dark** - Forest aesthetic
7. **Amethyst Haze Dark** - Dark purple mystical
8. **Modus Dark** - High contrast dark
9. **Windows 98** - Nostalgic retro

### Color Opacity Patterns

```tsx
// Background overlays
bg-background/60  // Glassmorphism
bg-card/50        // Subtle overlays

// Borders
border-accent/30   // Subtle accent borders
border-primary/20  // Very subtle

// Shadows
shadow-primary/20  // Colored shadows
shadow-destructive/30
```

---

## Typography

### Font Stack

```css
/* Display/Headings */
font-family: 'Reckless', Georgia, serif;

/* Body/UI */
font-family: 'Roobert', -apple-system, BlinkMacSystemFont, sans-serif;

/* Code/Terminal */
font-family: 'JetBrains Mono', monospace;
```

### Scale

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px | Minimum size (WCAG AA) |
| `text-sm` | 14px | Secondary text |
| `text-base` | 16px | Body text |
| `text-lg` | 18px | Emphasized text |
| `text-xl` | 20px | Small headings |
| `text-2xl` | 24px | Section headings |
| `text-3xl` | 30px | Page headings |
| `text-4xl` | 36px | Hero headings |

### Guidelines

**DO** ✅
```tsx
<p className="text-sm text-muted-foreground">
<h1 className="text-3xl font-bold">
<code className="text-xs font-mono">
```

**DON'T** ❌
```tsx
<p className="text-[11px]">        // Below WCAG minimum
<div style={{ fontSize: '10px' }}>  // Accessibility violation
```

---

## Spacing & Layout

### Tailwind Spacing Scale

Use standard Tailwind classes, not arbitrary values:

| Class | Size | Usage |
|-------|------|-------|
| `w-96` | 384px | Standard width |
| `h-12` | 48px | Button/input height |
| `h-16` | 64px | Textarea min-height |
| `p-4` | 16px | Standard padding |
| `gap-2` | 8px | Tight spacing |
| `gap-4` | 16px | Standard spacing |
| `space-y-6` | 24px | Section spacing |

**DO** ✅
```tsx
<div className="w-96 h-12 p-4 gap-4">
<input className="min-h-16">
```

**DON'T** ❌
```tsx
<div className="w-[400px] h-[48px] p-[16px]">  // Use standard classes
<input style={{ minHeight: '60px' }}>         // Use Tailwind
```

### Layout Patterns

#### Glassmorphism
```tsx
<div className="bg-background/60 backdrop-blur-sm border border-border/50 rounded-2xl">
```

#### Card Pattern
```tsx
<div className="bg-card border border-border rounded-lg p-6 shadow-lg">
```

#### Modal Pattern
```tsx
<div className="fixed inset-0 bg-background/80 backdrop-blur-sm">
  <div className="bg-card border rounded-xl shadow-2xl">
```

---

## Components

### Enhanced Button

```tsx
import { Button } from '@/components/ui/enhanced-button';

// Primary action
<Button variant="data-primary">
  Create Product
</Button>

// Success action
<Button variant="data-success">
  Deploy
</Button>

// With quality indicator
<Button dataQuality="excellent">
  High Quality
</Button>
```

### Data Grid

```tsx
import { VirtualizedDataGrid } from '@/components/ui/virtualized-data-grid';

<VirtualizedDataGrid
  columns={columns}
  data={data}
  showQualityIndicators={true}
  searchable={true}
  onRowClick={(row) => console.log(row)}
/>
```

### Theme Switcher

```tsx
import { ThemeSwitcher } from '@/components/ui/theme-switcher';

<ThemeSwitcher />  // Dropdown with all 16 themes
```

### Quality Indicator

```tsx
// Automatic color based on quality score
<QualityIndicator quality={0.98} size="md" />

// Colors:
// 0.95+ → Excellent (cyan/accent)
// 0.80+ → Good (blue/primary)
// 0.60+ → Warning (orange)
// <0.60 → Poor (red/destructive)
```

---

## Shadows & Elevation

### Standard Shadows

Use Tailwind shadow utilities with theme-aware colors:

```tsx
// Standard shadows
shadow-sm   // Subtle elevation
shadow-md   // Card elevation
shadow-lg   // Modal/dropdown
shadow-xl   // High emphasis
shadow-2xl  // Maximum elevation

// Colored shadows
shadow-lg shadow-primary/20      // Blue glow
shadow-lg shadow-accent/20       // Cyan glow
shadow-xl shadow-destructive/30  // Error state
```

**DO** ✅
```tsx
<div className="shadow-lg hover:shadow-primary/20">
<div className="shadow-xl hover:shadow-accent/10">
```

**DON'T** ❌
```tsx
// Never use hardcoded rgba shadows
<div style={{ boxShadow: '0 0 20px rgba(91,110,255,0.2)' }}>
<div className="shadow-[0_0_30px_rgba(255,107,122,0.3)]">
```

### Row State Shadows

```tsx
// Data grid row states
anomaly:    hover:shadow-lg hover:shadow-destructive/20
processing: hover:shadow-lg hover:shadow-primary/20
error:      hover:shadow-xl hover:shadow-destructive/30
quality:    hover:shadow-lg hover:shadow-accent/10
```

---

## Animation & Motion

### Transitions

```tsx
// Standard transition
transition-all duration-300

// Fast interactions
transition-colors duration-200

// Smooth transforms
transform transition-transform duration-500
```

### Hover Effects

```tsx
// Scale on hover
hover:scale-110 transition-transform

// Glow effect
hover:shadow-lg hover:shadow-primary/20 transition-all

// Color shift
hover:bg-accent/10 transition-colors
```

### Loading States

```tsx
// Pulse animation
<div className="animate-pulse">

// Spin for icons
<Icon className="animate-spin" />

// Custom shimmer (see globals.css)
<div className="command-loading">
```

---

## Accessibility

### WCAG AA Compliance

#### Text Size
- **Minimum**: `text-xs` (12px)
- **Body**: `text-sm` or `text-base`
- **Headings**: `text-xl` and above

#### Color Contrast
```tsx
// High contrast themes available
<ThemeSwitcher />  // Includes Modus Light/Dark

// Test contrast ratios
foreground on background: ≥ 4.5:1
accent on background: ≥ 3:1
```

#### Focus Indicators
```tsx
// Always visible focus states
focus-visible:outline-none
focus-visible:ring-1
focus-visible:ring-ring

// Keyboard navigation
<button className="focus-visible:ring-2 focus-visible:ring-primary">
```

#### ARIA Labels
```tsx
<Button aria-label="Create new data product">
  <Plus className="w-4 h-4" />
</Button>

<Input aria-describedby="email-error" />
<span id="email-error" className="sr-only">Invalid email</span>
```

### Screen Reader Support

```tsx
// Visually hidden but screen-reader accessible
<span className="sr-only">Loading...</span>

// Skip links
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to content
</a>
```

---

## Best Practices

### Component Optimization

#### Use React.memo
```tsx
export const MyComponent = React.memo(function MyComponent({ ... }) {
  // Component logic
});
```

#### Memoize Expensive Computations
```tsx
const processedData = useMemo(() => {
  return expensiveTransformation(data);
}, [data]);
```

#### Memoize Event Handlers
```tsx
const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]);
```

### Import Optimization

**DO** ✅
```tsx
// Direct imports (tree-shakeable)
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
```

**DON'T** ❌
```tsx
// Barrel imports (imports everything)
import { Button, Card, Dialog, ... } from '@/components/ui';
```

### Dynamic Imports

```tsx
// Lazy load heavy components
const MapView = dynamic(() => import('@/components/Map/MapView'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-96" />
});
```

### State Management

```tsx
// Lazy initialization for expensive state
const [data, setData] = useState(() => expensiveComputation());

// Debounce user input
import { useDebouncedCallback } from 'use-debounce';

const handleSearch = useDebouncedCallback((query) => {
  performSearch(query);
}, 300);
```

---

## Code Examples

### Complete Component Example

```tsx
'use client';

import React, { useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DataProductCardProps {
  product: DataProduct;
  onSelect: (id: string) => void;
  className?: string;
}

export const DataProductCard = React.memo(function DataProductCard({
  product,
  onSelect,
  className
}: DataProductCardProps) {
  // Memoize expensive computations
  const qualityScore = useMemo(() => {
    return calculateQuality(product.metrics);
  }, [product.metrics]);

  // Memoize event handlers
  const handleClick = useCallback(() => {
    onSelect(product.id);
  }, [onSelect, product.id]);

  return (
    <Card className={cn(
      "p-6 hover:shadow-lg hover:shadow-primary/10 transition-all",
      className
    )}>
      <h3 className="text-lg font-semibold text-foreground">
        {product.name}
      </h3>

      <p className="text-sm text-muted-foreground mt-2">
        {product.description}
      </p>

      <div className="flex items-center gap-2 mt-4">
        <QualityIndicator quality={qualityScore} size="sm" />
        <span className="text-xs text-muted-foreground">
          Quality: {(qualityScore * 100).toFixed(0)}%
        </span>
      </div>

      <Button
        onClick={handleClick}
        variant="data-primary"
        className="mt-4 w-full"
      >
        Select Product
      </Button>
    </Card>
  );
});
```

### Complete Page Example

```tsx
'use client';

import { useState, useMemo } from 'react';
import { VirtualizedDataGrid } from '@/components/ui/virtualized-data-grid';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import type { DataGridColumn } from '@/components/ui/virtualized-data-grid';

export default function DataProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Column definitions
  const columns: DataGridColumn[] = useMemo(() => [
    {
      key: 'name',
      label: 'Product Name',
      width: 200,
      sortable: true,
      dataType: 'string',
      quality: 0.98
    },
    {
      key: 'owner',
      label: 'Owner',
      width: 150,
      sortable: true,
      dataType: 'string',
      quality: 0.95
    },
    {
      key: 'status',
      label: 'Status',
      width: 120,
      sortable: true,
      render: (value) => (
        <Badge variant={value === 'active' ? 'default' : 'secondary'}>
          {value}
        </Badge>
      )
    }
  ], []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Data Products
          </h1>
          <ThemeSwitcher />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <VirtualizedDataGrid
          columns={columns}
          data={products}
          searchable={true}
          showQualityIndicators={true}
          onRowClick={(row) => console.log('Selected:', row)}
        />
      </main>
    </div>
  );
}
```

---

## Resources

### Documentation
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Lucide Icons](https://lucide.dev)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Internal Docs
- `/docs/DESIGN_SYSTEM_AUDIT_2025.md` - Recent audit findings
- `/docs/PERFORMANCE_OPTIMIZATION_REPORT.md` - Performance guide
- `/docs/THEME_TESTING_REPORT.md` - Theme testing results

### Tools
- **Theme Preview**: Use theme switcher to test all 16 variants
- **DevTools**: React DevTools Profiler for performance
- **Lighthouse**: Accessibility and performance audits

---

**Maintained by**: NexusOne Design Team
**Questions**: Refer to audit reports or create documentation PRs
