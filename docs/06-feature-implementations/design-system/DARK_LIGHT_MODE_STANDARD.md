# Dark/Light Mode Design Standard
## NexusOne Enterprise Data Platform

**Version:** 1.0
**Last Updated:** October 14, 2025
**Status:** Active Standard

---

## Executive Summary

This document defines NexusOne's standards for implementing accessible, consistent, and user-friendly dark and light modes across the platform. Dark mode is a valuable feature for users who work long sessions, prefer aesthetic variety, or have visual accessibility needs—but it must be implemented thoughtfully to ensure readability, accessibility, and visual consistency.

**Core Principle:** Respect user preferences, maintain accessibility standards in both modes, and design for visual consistency across theme transitions.

---

## Table of Contents

1. [Understanding Dark Mode](#understanding-dark-mode)
2. [When to Prioritize Dark Mode](#when-to-prioritize-dark-mode)
3. [Color System Architecture](#color-system-architecture)
4. [Contrast and Accessibility Requirements](#contrast-and-accessibility-requirements)
5. [Implementation Guidelines](#implementation-guidelines)
6. [Component-Specific Standards](#component-specific-standards)
7. [Testing and Validation](#testing-and-validation)
8. [Audit Checklist](#audit-checklist)

---

## Understanding Dark Mode

### User Expectations

**Key Finding:** Users think about dark mode at the operating system level, not at the application level.

**User Expectations:**
- Most users expect all apps/websites to automatically switch to dark mode when their OS is in dark mode
- Users rarely notice or abandon designs that don't support dark mode (nice-to-have, not need-to-have)
- However, for applications with long session times, dark mode becomes more valuable

### Reasons Users Choose Dark Mode

1. **Aesthetic Appeal** (Primary reason)
   - Modern, sleek appearance
   - Personal preference

2. **Eye Strain Reduction** (Secondary reason)
   - Potential benefit in low-light environments
   - Reduced blue light exposure
   - Note: Scientific evidence is mixed

3. **Battery Savings** (Tertiary reason)
   - Primarily on OLED/AMOLED displays
   - Minimal benefit on LCD displays

4. **Accessibility** (Critical for subset of users)
   - Essential for users with photophobia
   - Helpful for users with certain visual impairments
   - Required for users with light sensitivity

### When Dark Mode Matters Most

**High Priority Scenarios:**
- ✅ Long user sessions (>1 hour continuous use)
- ✅ Frequent daily usage (5+ sessions per day)
- ✅ Low-light usage conditions (evening work, dark offices)
- ✅ Text-heavy interfaces (code editors, documentation, dashboards)
- ✅ Minimal media content (photos/videos look better in light mode)

**Lower Priority Scenarios:**
- ⚠️ Short sessions (<15 minutes)
- ⚠️ Infrequent usage (weekly or less)
- ⚠️ Media-rich interfaces (image galleries, marketing sites)
- ⚠️ Print-oriented content (reports, documents)

**NexusOne Assessment:** **HIGH PRIORITY**
- Users have long sessions monitoring dashboards
- Text-heavy interfaces (SQL, configurations, logs)
- Frequent daily usage
- Professional tool used in various lighting conditions

---

## When to Prioritize Dark Mode

### Priority Matrix

| User Scenario | Session Length | Frequency | Priority |
|---------------|----------------|-----------|----------|
| **Pipeline Monitoring** | 2-8 hours | Daily | 🔴 Critical |
| **SQL Workstation** | 1-4 hours | Daily | 🔴 Critical |
| **Data Discovery** | 30-60 min | Daily | 🟡 High |
| **Configuration** | 15-30 min | Weekly | 🟢 Medium |
| **Reporting** | 5-15 min | Weekly | 🟢 Medium |

### Implementation Approach

**Must-Have (Critical):**
- Automatic theme detection from OS
- Consistent theme across all pages
- Accessible contrast in both modes
- No broken layouts when switching themes

**Should-Have (High Priority):**
- Manual theme override toggle
- Persistent user preference
- Smooth transitions between themes
- Theme-appropriate images/icons

**Nice-to-Have (Medium Priority):**
- Theme preview before applying
- Per-page theme preferences
- Scheduled theme switching (day/night)
- Theme-specific accent colors

---

## Color System Architecture

### Material Design Elevation System

NexusOne uses Material Design's elevation-based surface colors for dark mode, which creates visual hierarchy through layered surfaces.

#### Base Colors

**Light Mode:**
```css
:root {
  --background: 0 0% 100%;        /* #FFFFFF - Pure white */
  --foreground: 222.2 84% 4.9%;   /* #020817 - Near black */

  --card: 0 0% 100%;              /* #FFFFFF - White */
  --card-foreground: 222.2 84% 4.9%; /* #020817 - Near black */

  --muted: 210 40% 96.1%;         /* #F1F5F9 - Light gray */
  --muted-foreground: 215.4 16.3% 46.9%; /* #64748B - Medium gray */
}
```

**Dark Mode:**
```css
.dark {
  --background: 222.2 84% 4.9%;   /* #020817 - Near black (not pure black) */
  --foreground: 210 40% 98%;      /* #F8FAFC - Near white */

  --card: 222.2 84% 4.9%;         /* #020817 - Matches background */
  --card-foreground: 210 40% 98%; /* #F8FAFC - Near white */

  --muted: 217.2 32.6% 17.5%;     /* #1E293B - Dark gray */
  --muted-foreground: 215 20.2% 65.1%; /* #94A3B8 - Light gray */
}
```

#### Why Not Pure Black?

**Pure Black (#000000):**
- ❌ Creates extreme contrast (21:1 with white text)
- ❌ Causes eye strain with bright white text
- ❌ Makes shadows invisible
- ❌ Looks harsh and aggressive

**Dark Gray (#020817):**
- ✅ Reduces contrast to comfortable levels (15.8:1 with white text)
- ✅ Allows shadows to be visible
- ✅ Expresses elevation and depth
- ✅ Feels more sophisticated
- ✅ Reduces eye strain

### Elevation Overlay System

Dark mode uses white overlays on the base surface color to create elevation levels:

| Elevation | Light Mode | Dark Mode Overlay | Dark Mode Color | Use Case |
|-----------|------------|-------------------|-----------------|----------|
| **0dp** (Base) | #FFFFFF | 0% | #020817 | Page background |
| **1dp** | #FFFFFF | 5% | #0F172A | Cards at rest |
| **2dp** | #FFFFFF | 7% | #1E293B | Raised cards |
| **4dp** | #FFFFFF | 9% | #334155 | Modals, dropdowns |
| **8dp** | #FFFFFF | 12% | #475569 | Navigation drawer |
| **16dp** | #FFFFFF | 15% | #64748B | Floating action button |
| **24dp** | #FFFFFF | 16% | #94A3B8 | Dialog |

**Implementation:**
```css
/* shadcn/ui uses muted variants for elevation */
.dark {
  --card: 222.2 84% 4.9%;           /* 0dp - base */
  --muted: 217.2 32.6% 17.5%;       /* ~1-2dp */
  --accent: 217.2 32.6% 17.5%;      /* ~2-4dp */
  --popover: 222.2 84% 4.9%;        /* 4dp+ */
}
```

### Semantic Color Tokens

#### Primary Colors

**Light Mode:**
```css
:root {
  --primary: 221.2 83.2% 53.3%;      /* #3B82F6 - Blue 500 */
  --primary-foreground: 210 40% 98%; /* #F8FAFC - Near white */
}
```

**Dark Mode:**
```css
.dark {
  /* Lighter, desaturated version for better readability */
  --primary: 217.2 91.2% 59.8%;      /* #60A5FA - Blue 400 */
  --primary-foreground: 222.2 47.4% 11.2%; /* #1E293B - Dark blue-gray */
}
```

**Key Principle:** Desaturate and lighten colors in dark mode to prevent visual vibration

#### Status Colors

**Success (Green):**
```css
/* Light Mode */
--success: 142 76% 36%;              /* #10B981 - Green 500 */
--success-foreground: 0 0% 100%;     /* #FFFFFF - White */

/* Dark Mode */
.dark {
  --success: 142 71% 45%;            /* #34D399 - Green 400 */
  --success-foreground: 222.2 47.4% 11.2%; /* #1E293B - Dark */
}
```

**Warning (Yellow/Orange):**
```css
/* Light Mode */
--warning: 38 92% 50%;               /* #F59E0B - Amber 500 */
--warning-foreground: 0 0% 100%;     /* #FFFFFF - White */

/* Dark Mode */
.dark {
  --warning: 38 92% 60%;             /* #FCD34D - Amber 300 */
  --warning-foreground: 222.2 47.4% 11.2%; /* #1E293B - Dark */
}
```

**Destructive (Red):**
```css
/* Light Mode */
--destructive: 0 84.2% 60.2%;        /* #EF4444 - Red 500 */
--destructive-foreground: 0 0% 100%; /* #FFFFFF - White */

/* Dark Mode */
.dark {
  --destructive: 0 62.8% 60.6%;      /* #F87171 - Red 400 */
  --destructive-foreground: 222.2 47.4% 11.2%; /* #1E293B - Dark */
}
```

**Info (Blue):**
```css
/* Light Mode */
--info: 199 89% 48%;                 /* #0EA5E9 - Sky 500 */
--info-foreground: 0 0% 100%;        /* #FFFFFF - White */

/* Dark Mode */
.dark {
  --info: 199 89% 58%;               /* #38BDF8 - Sky 400 */
  --info-foreground: 222.2 47.4% 11.2%; /* #1E293B - Dark */
}
```

### Border and Ring Colors

**Light Mode:**
```css
:root {
  --border: 214.3 31.8% 91.4%;       /* #E2E8F0 - Slate 200 */
  --ring: 221.2 83.2% 53.3%;         /* #3B82F6 - Blue 500 (focus) */
}
```

**Dark Mode:**
```css
.dark {
  --border: 217.2 32.6% 17.5%;       /* #1E293B - Slate 800 */
  --ring: 217.2 91.2% 59.8%;         /* #60A5FA - Blue 400 (focus) */
}
```

---

## Contrast and Accessibility Requirements

### WCAG 2.1 Standards

#### Minimum Contrast Ratios

**Normal Text (< 18pt or < 14pt bold):**
- **WCAG AA:** 4.5:1 minimum ✅ (Required)
- **WCAG AAA:** 7:1 minimum (Recommended for body text)

**Large Text (≥ 18pt or ≥ 14pt bold):**
- **WCAG AA:** 3:1 minimum ✅ (Required)
- **WCAG AAA:** 4.5:1 minimum (Recommended)

**UI Components and Graphical Objects:**
- **WCAG AA:** 3:1 minimum ✅ (Required)

#### NexusOne Contrast Requirements

**Body Text:**
- Light Mode: #020817 on #FFFFFF = **17.5:1** ✅ (Exceeds AAA)
- Dark Mode: #F8FAFC on #020817 = **15.8:1** ✅ (Exceeds AAA)

**Secondary Text (muted-foreground):**
- Light Mode: #64748B on #FFFFFF = **5.7:1** ✅ (Exceeds AA)
- Dark Mode: #94A3B8 on #020817 = **6.2:1** ✅ (Exceeds AA)

**Primary Action (Button):**
- Light Mode: #F8FAFC on #3B82F6 = **8.1:1** ✅ (Exceeds AAA)
- Dark Mode: #1E293B on #60A5FA = **7.8:1** ✅ (Exceeds AAA)

**Borders:**
- Light Mode: #E2E8F0 on #FFFFFF = **1.3:1** ⚠️ (Subtle, intentional)
- Dark Mode: #1E293B on #020817 = **2.1:1** ⚠️ (Subtle, intentional)
- Note: Borders are decorative and don't require high contrast

### Color Contrast Testing Tools

**Recommended Tools:**
1. WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
2. Stark (Figma plugin)
3. Axe DevTools (Browser extension)
4. Chrome DevTools > Lighthouse > Accessibility

**Testing Process:**
1. Test every text + background combination
2. Test all interactive elements (buttons, links, inputs)
3. Test status colors (success, warning, error, info)
4. Test disabled states (lower contrast acceptable)
5. Test across different screen brightness levels

### Maximum Contrast Considerations

**Problem:** Excessive contrast (pure black on pure white) can cause eye strain

**Recommendation:**
- Avoid 21:1 contrast ratios (pure black/white)
- Target 15:1 to 17:1 for optimal readability
- Use slightly off-white (#F8FAFC) instead of pure white in dark mode
- Use near-black (#020817) instead of pure black in light mode

---

## Implementation Guidelines

### 1. Automatic Theme Detection

**Respect OS Preferences:**
```typescript
// Detect system theme preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Listen for changes
window.matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', (e) => {
    const newTheme = e.matches ? 'dark' : 'light';
    setTheme(newTheme);
  });
```

**Implementation with next-themes:**
```typescript
import { ThemeProvider } from 'next-themes';

function App({ Component, pageProps }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
```

### 2. Manual Theme Toggle

**User Control:**
```typescript
import { useTheme } from 'next-themes';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Placement Guidelines:**
- Header navigation (always visible)
- User profile dropdown
- Settings/preferences page
- Keyboard shortcut (Cmd/Ctrl + Shift + T recommended)

### 3. Theme Persistence

**Store User Preference:**
```typescript
// Automatically handled by next-themes via localStorage
// Key: 'theme'
// Values: 'light' | 'dark' | 'system'

// Access in other components
const { theme, setTheme, systemTheme } = useTheme();

// Resolved theme (handles 'system' setting)
const currentTheme = theme === 'system' ? systemTheme : theme;
```

### 4. Smooth Theme Transitions

**CSS Transitions:**
```css
/* Apply to elements that should transition */
.theme-transition {
  transition: background-color 200ms ease-in-out,
              color 200ms ease-in-out,
              border-color 200ms ease-in-out;
}

/* Disable transitions during theme change (optional, for instant switch) */
.disable-transitions * {
  transition: none !important;
}
```

**Avoid Transition Flash:**
```typescript
// next-themes handles this automatically, but if implementing custom:
function setThemeWithoutTransition(newTheme: string) {
  document.documentElement.classList.add('disable-transitions');
  setTheme(newTheme);

  setTimeout(() => {
    document.documentElement.classList.remove('disable-transitions');
  }, 0);
}
```

### 5. Theme-Aware Images and Icons

**SVG Icons with CSS Variables:**
```tsx
<svg>
  <path fill="hsl(var(--foreground))" />
</svg>
```

**Different Images for Different Themes:**
```tsx
function ThemedLogo() {
  const { resolvedTheme } = useTheme();

  return (
    <Image
      src={resolvedTheme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg'}
      alt="NexusOne"
      width={120}
      height={40}
    />
  );
}
```

**Transparent PNGs/SVGs:**
- Use transparent backgrounds
- Design icons to work on both light and dark backgrounds
- Test on both themes during design phase

### 6. Code Syntax Highlighting

**Different Themes for Code Blocks:**
```typescript
// Example with Prism.js
import { useTheme } from 'next-themes';

function CodeBlock({ code, language }) {
  const { resolvedTheme } = useTheme();

  const prismTheme = resolvedTheme === 'dark'
    ? require('prism-react-renderer/themes/vsDark')
    : require('prism-react-renderer/themes/vsLight');

  return (
    <Highlight theme={prismTheme} code={code} language={language}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={className} style={style}>
          {/* Render code */}
        </pre>
      )}
    </Highlight>
  );
}
```

**Recommended Code Themes:**
- Light Mode: GitHub Light, VS Code Light
- Dark Mode: GitHub Dark, VS Code Dark, One Dark Pro

---

## Component-Specific Standards

### Cards

**Light Mode:**
```tsx
<Card className="bg-background border-border">
  <CardHeader>
    <CardTitle className="text-foreground">Title</CardTitle>
    <CardDescription className="text-muted-foreground">
      Description
    </CardDescription>
  </CardHeader>
  <CardContent className="text-foreground">
    Content
  </CardContent>
</Card>
```

**Dark Mode Considerations:**
- Use `bg-muted/50` for slight elevation (not pure background)
- Ensure borders are visible: `border-border`
- Test card shadows (may need to be more pronounced in dark mode)

**Elevated Cards:**
```tsx
{/* Slightly elevated card in dark mode */}
<Card className="bg-muted/50 dark:bg-muted">
  {/* Content */}
</Card>

{/* Highly elevated card (modal, dialog) */}
<Card className="bg-card dark:shadow-2xl">
  {/* Content */}
</Card>
```

### Buttons

**Primary Button:**
```tsx
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Primary Action
</Button>
```

**Secondary Button:**
```tsx
<Button variant="secondary" className="bg-secondary text-secondary-foreground">
  Secondary Action
</Button>
```

**Outline Button:**
```tsx
<Button variant="outline" className="border-input hover:bg-accent">
  Outline Action
</Button>
```

**Ghost Button:**
```tsx
<Button variant="ghost" className="hover:bg-accent">
  Ghost Action
</Button>
```

**Dark Mode Considerations:**
- Primary buttons should remain vibrant in dark mode
- Outline buttons need visible borders in both themes
- Ghost buttons should have clear hover states

### Forms

**Input Fields:**
```tsx
<Input
  className="bg-background border-input text-foreground placeholder:text-muted-foreground"
  placeholder="Enter text..."
/>
```

**Labels:**
```tsx
<Label className="text-sm font-medium text-foreground">
  Field Label
</Label>
```

**Helper Text:**
```tsx
<p className="text-sm text-muted-foreground">
  Helper text or description
</p>
```

**Error States:**
```tsx
<Input className="border-destructive" />
<p className="text-sm text-destructive">
  Error message
</p>
```

**Dark Mode Considerations:**
- Input backgrounds should be slightly different from page background
- Focus rings must be clearly visible
- Error states should use desaturated red in dark mode

### Tables

**Standard Table:**
```tsx
<Table>
  <TableHeader className="bg-muted/50">
    <TableRow className="border-b border-border">
      <TableHead className="text-muted-foreground">Column</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="border-b border-border hover:bg-muted/50">
      <TableCell className="text-foreground">Data</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

**Dark Mode Considerations:**
- Alternating row colors should be subtle in dark mode
- Hover states must be clearly visible
- Header background should differ from body
- Borders should be visible but not harsh

### Navigation

**Top Navigation:**
```tsx
<nav className="bg-background border-b border-border">
  <div className="container">
    <NavLink
      href="/dashboard"
      className="text-foreground hover:text-primary"
      activeClassName="text-primary font-semibold"
    >
      Dashboard
    </NavLink>
  </div>
</nav>
```

**Sidebar Navigation:**
```tsx
<aside className="bg-muted/50 border-r border-border">
  <nav>
    <NavLink className="text-muted-foreground hover:text-foreground hover:bg-accent">
      Menu Item
    </NavLink>
  </nav>
</aside>
```

**Dark Mode Considerations:**
- Active states should be clearly differentiated
- Hover states should be obvious
- Navigation backgrounds should contrast with page background

### Modals and Dialogs

**Dialog:**
```tsx
<Dialog>
  <DialogContent className="bg-card border-border">
    <DialogHeader>
      <DialogTitle className="text-foreground">Title</DialogTitle>
      <DialogDescription className="text-muted-foreground">
        Description
      </DialogDescription>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

**Dark Mode Considerations:**
- Dialogs should have higher elevation (more contrast with background)
- Backdrop overlay should be clearly visible but not opaque
- Close buttons must be easy to see

### Data Visualizations

**Chart Colors:**

**Light Mode Palette:**
```typescript
const lightChartColors = [
  'hsl(221.2 83.2% 53.3%)',  // Blue 500
  'hsl(142 76% 36%)',        // Green 500
  'hsl(38 92% 50%)',         // Amber 500
  'hsl(0 84.2% 60.2%)',      // Red 500
  'hsl(271 91% 65%)',        // Purple 400
  'hsl(199 89% 48%)',        // Sky 500
];
```

**Dark Mode Palette (lighter, desaturated):**
```typescript
const darkChartColors = [
  'hsl(217.2 91.2% 59.8%)',  // Blue 400
  'hsl(142 71% 45%)',        // Green 400
  'hsl(38 92% 60%)',         // Amber 300
  'hsl(0 62.8% 60.6%)',      // Red 400
  'hsl(271 81% 75%)',        // Purple 300
  'hsl(199 89% 58%)',        // Sky 400
];
```

**Implementation:**
```typescript
import { useTheme } from 'next-themes';

function Chart({ data }) {
  const { resolvedTheme } = useTheme();
  const colors = resolvedTheme === 'dark' ? darkChartColors : lightChartColors;

  return <ChartComponent data={data} colors={colors} />;
}
```

**Dark Mode Considerations:**
- Grid lines should be subtle but visible
- Axis labels must meet contrast requirements
- Tooltips need elevated backgrounds
- Legends should use theme-aware colors

### Status Indicators

**Success Indicator:**
```tsx
<Badge variant="default" className="bg-success text-success-foreground">
  <CheckCircle className="h-4 w-4 mr-1" />
  Success
</Badge>
```

**Warning Indicator:**
```tsx
<Badge variant="default" className="bg-warning text-warning-foreground">
  <AlertTriangle className="h-4 w-4 mr-1" />
  Warning
</Badge>
```

**Error Indicator:**
```tsx
<Badge variant="destructive">
  <XCircle className="h-4 w-4 mr-1" />
  Error
</Badge>
```

**Dark Mode Considerations:**
- Status colors should be desaturated in dark mode
- Icons should remain recognizable
- Combine color with icons for accessibility (don't rely on color alone)

---

## Testing and Validation

### Manual Testing Checklist

#### Visual Review
- [ ] Switch between light/dark modes on every page
- [ ] Check all interactive states (hover, active, focus, disabled)
- [ ] Verify readability of all text sizes
- [ ] Test at different screen brightness levels (25%, 50%, 100%)
- [ ] Review in different lighting conditions (bright office, dim room, darkness)

#### Component Testing
- [ ] All buttons clearly visible and readable
- [ ] All form inputs have clear boundaries
- [ ] All status indicators distinguishable
- [ ] All navigation elements accessible
- [ ] All modals/dialogs properly elevated

#### Content Testing
- [ ] All images/logos render correctly
- [ ] All icons visible and recognizable
- [ ] All charts/visualizations readable
- [ ] All code blocks properly syntax-highlighted
- [ ] All tables scannable and readable

#### Transition Testing
- [ ] Theme switch is smooth (no flash)
- [ ] Theme preference persists across sessions
- [ ] System theme changes are detected
- [ ] Manual override works correctly

### Automated Testing

#### Contrast Testing with Axe
```javascript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Dark Mode Accessibility', () => {
  it('should have no accessibility violations in light mode', async () => {
    const { container } = render(<Component />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in dark mode', async () => {
    document.documentElement.classList.add('dark');
    const { container } = render(<Component />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    document.documentElement.classList.remove('dark');
  });
});
```

#### Visual Regression Testing
```javascript
import { test, expect } from '@playwright/test';

test('light mode snapshot', async ({ page }) => {
  await page.goto('/dashboard');
  await page.evaluate(() => {
    localStorage.setItem('theme', 'light');
  });
  await page.reload();
  await expect(page).toHaveScreenshot('dashboard-light.png');
});

test('dark mode snapshot', async ({ page }) => {
  await page.goto('/dashboard');
  await page.evaluate(() => {
    localStorage.setItem('theme', 'dark');
  });
  await page.reload();
  await expect(page).toHaveScreenshot('dashboard-dark.png');
});
```

### Browser and Device Testing

**Test Matrix:**

| Browser | Light Mode | Dark Mode | Notes |
|---------|------------|-----------|-------|
| Chrome (latest) | ✅ | ✅ | Primary browser |
| Firefox (latest) | ✅ | ✅ | Test color rendering |
| Safari (latest) | ✅ | ✅ | Test on macOS |
| Edge (latest) | ✅ | ✅ | Test on Windows |

| Device | Light Mode | Dark Mode | Notes |
|--------|------------|-----------|-------|
| Desktop (1920x1080) | ✅ | ✅ | Primary device |
| Laptop (1366x768) | ✅ | ✅ | Common resolution |
| iPad (1024x768) | ✅ | ✅ | Tablet experience |
| iPhone (375x667) | ✅ | ✅ | Mobile experience |

---

## Audit Checklist

Use this checklist to audit existing components and pages for dark/light mode compliance:

### Theme Detection & Switching
- [ ] Automatic detection of OS theme preference works
- [ ] Manual theme toggle is accessible (header or settings)
- [ ] Theme preference persists across sessions
- [ ] Theme changes are detected when OS setting changes
- [ ] No flash of wrong theme on page load

### Color and Contrast
- [ ] All text meets WCAG AA contrast requirements (4.5:1 for normal, 3:1 for large)
- [ ] Primary actions have sufficient contrast in both modes
- [ ] Status colors (success/warning/error) are distinguishable in both modes
- [ ] Links are clearly identifiable in both modes
- [ ] Disabled states are distinguishable but appropriately low contrast

### Visual Consistency
- [ ] All components render correctly in both modes
- [ ] No broken layouts when switching themes
- [ ] Images/logos are appropriate for both themes
- [ ] Icons are visible in both modes
- [ ] Charts/visualizations use theme-appropriate colors

### Interactive Elements
- [ ] Buttons have clear hover states in both modes
- [ ] Form inputs have visible boundaries in both modes
- [ ] Focus indicators are clearly visible in both modes
- [ ] Active/selected states are obvious in both modes
- [ ] Disabled states are distinguishable in both modes

### Elevation and Hierarchy
- [ ] Card backgrounds differ from page background
- [ ] Modals/dialogs are clearly elevated
- [ ] Dropdowns/popovers have sufficient contrast with background
- [ ] Navigation is distinguishable from content areas
- [ ] Visual hierarchy is maintained across themes

### Content
- [ ] All images render appropriately (transparent or theme-specific versions)
- [ ] Code blocks use appropriate syntax highlighting theme
- [ ] Data tables are scannable in both modes
- [ ] Charts use appropriate color palettes
- [ ] Documentation is readable in both modes

### Accessibility
- [ ] No reliance on color alone to convey information
- [ ] All interactive elements keyboard accessible
- [ ] Screen readers announce theme toggle correctly
- [ ] High contrast mode compatibility (Windows)
- [ ] No seizure-inducing flashing during theme transitions

---

## Conclusion

Dark mode is a valuable feature for NexusOne users who spend long sessions working with data engineering tools. By following these standards, we ensure:

1. **Accessibility:** All users can access the platform regardless of visual preferences or needs
2. **Consistency:** Visual language remains consistent across theme switches
3. **Quality:** Both light and dark modes are equally polished and professional
4. **User Control:** Users can choose their preference and have it respected

**Key Takeaways:**
- Use dark gray (#020817), not pure black, for dark mode backgrounds
- Desaturate and lighten colors in dark mode to prevent visual vibration
- Maintain WCAG AA contrast ratios (4.5:1 minimum) in both modes
- Respect OS theme preferences by default, offer manual override
- Test thoroughly in both modes across all components and pages

**Implementation Priority:**
1. Ensure contrast accessibility (Required)
2. Implement automatic theme detection (Required)
3. Provide manual theme toggle (Required)
4. Add theme-specific images/icons (High)
5. Optimize chart color palettes (High)
6. Add theme transitions (Medium)

---

## References

1. Nielsen Norman Group - "Dark Mode: Best Practices" (https://www.nngroup.com/articles/dark-mode-users-issues/)
2. Material Design - "Dark Theme" (https://m2.material.io/design/color/dark-theme.html)
3. WCAG 2.1 - Contrast Requirements (https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
4. shadcn/ui - "Dark Mode" (https://ui.shadcn.com/docs/dark-mode)
5. "8 Tips for Dark Theme Design" - UX Planet
6. WebAIM - "Contrast and Color Accessibility"
7. Material Design - "The Color System"

---

**Document Owner:** NexusOne Design System Team
**Review Cycle:** Quarterly
**Next Review:** January 14, 2026
