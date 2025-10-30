# Dark Mode Elevation Fix - Material Design Compliance

## Critical Analysis

### Issues Identified:

1. **Broken Elevation Hierarchy**
   - Cards use `bg-card` (#161b22) against background (#0d1117) - insufficient contrast
   - `bg-muted/50` creates transparency instead of proper elevation
   - No shadow system in dark mode - elevation is color-only

2. **Material Design Violations**
   - Surface colors should LIGHTEN as they elevate in dark mode
   - Current implementation uses same grays for all surfaces
   - Missing the 5dp, 8dp elevation scale

3. **Inconsistent Theming**
   - Some components use `bg-gradient-to-br from-primary/5` - this doesn't work in dark mode
   - Tab backgrounds use `bg-muted/20` - too subtle
   - Hero card has no visual separation from page background

## Material Design Dark Theme Rules:

### Elevation Scale (Color Overlays):
```css
Surface Level 0 (Base):     #121212
Surface Level 1 (1dp):      #1E1E1E  (+5% white)
Surface Level 2 (2dp):      #232323  (+7% white)
Surface Level 3 (3dp):      #252525  (+8% white)
Surface Level 4 (4dp):      #272727  (+9% white)
Surface Level 6 (6dp):      #2C2C2C  (+11% white)
Surface Level 8 (8dp):      #2F2F2F  (+12% white)
Surface Level 12 (12dp):    #333333  (+14% white)
Surface Level 16 (16dp):    #363636  (+15% white)
Surface Level 24 (24dp):    #383838  (+16% white)
```

### Shadows in Dark Mode:
- Still use shadows, but much more subtle
- Use `rgba(0, 0, 0, 0.3)` instead of `rgba(0, 0, 0, 0.1)`

## Implementation Plan:

### 1. Fix CSS Variables (globals.css)
Update dark mode card surfaces:
```css
.dark {
  --background: 224 71% 3%;           /* #0d1117 - Base surface */
  --card: 220 13% 18%;                /* #2b3037 - Elevated 8dp */
  --card-elevated-4dp: 220 13% 14%;   /* #21262d - Mid-elevation */
  --card-elevated-16dp: 220 13% 22%;  /* #30363d - High elevation */

  --muted: 217 33% 17%;               /* For subtle backgrounds */
  --border: 217 32% 17%;              /* Subtle borders */
}
```

### 2. Create Elevation Utility Classes (globals.css)
```css
/* Material Design Dark Mode Elevation System */
.dark .elevation-surface-0 {
  background-color: hsl(224 71% 3%);  /* Base */
}

.dark .elevation-surface-1 {
  background-color: hsl(220 13% 12%); /* 1dp - #1e1e1e */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.dark .elevation-surface-2 {
  background-color: hsl(220 13% 14%); /* 2dp - #232323 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.dark .elevation-surface-4 {
  background-color: hsl(220 13% 16%); /* 4dp - #272727 */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.dark .elevation-surface-8 {
  background-color: hsl(220 13% 18%); /* 8dp - #2f2f2f */
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.dark .elevation-surface-16 {
  background-color: hsl(220 13% 22%); /* 16dp - #363636 */
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.35);
}
```

### 3. Component Fixes:

#### Hero Card (page.tsx)
```tsx
// FROM:
<Card>
  <CardContent className="pt-8 pb-8">

// TO:
<Card className="dark:elevation-surface-8">
  <CardContent className="pt-8 pb-8">
```

#### Overview Tab "At a Glance" Card (NewOverviewTab.tsx)
```tsx
// FROM:
<Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">

// TO:
<Card className="dark:elevation-surface-8 dark:bg-card dark:border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
```

#### Tab Container (page.tsx)
```tsx
// FROM:
<div className="bg-muted/20">

// TO:
<div className="bg-muted/20 dark:bg-muted/40">
```

#### Regular Content Cards
```tsx
// FROM:
<Card className="bg-muted/50">

// TO:
<Card className="dark:elevation-surface-4 bg-muted/50">
```

## Testing Checklist:
- [ ] Hero card clearly elevated from background
- [ ] Tab container visible separation
- [ ] "At a Glance" card stands out appropriately
- [ ] Business context cards have proper depth
- [ ] No "white on white" or "dark on dark" text issues
- [ ] Shadows visible but not harsh
