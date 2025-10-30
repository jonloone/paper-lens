# NexusOne Typography Hierarchy Guide
**Last Updated:** 2025-01-10
**Status:** ✅ Canonical Design Standard

---

## Core Typography Philosophy

NexusOne uses a **strict, professional typography hierarchy** with clear rules:

1. **Reckless** = Page titles (H1) ONLY
2. **Roobert** = Everything else (H2-H6, body text, UI components)
3. **JetBrains Mono** = Code/terminal contexts only

This creates visual clarity and professional consistency across the entire platform.

---

## Font Families

### Reckless (Display Font)
- **Usage:** Page titles (H1 elements only)
- **CSS Variable:** `var(--font-display)`
- **Weights Available:** 300, 400, 500, 600
- **Example:** "Build Data Product", "Data Product Marketplace"

### Roobert (Body Font)
- **Usage:** All headings (H2-H6), body text, UI components, navigation
- **CSS Variable:** `var(--font-body)`
- **Weights Available:** 300, 400, 500, 600, 700
- **Example:** Section headings, paragraphs, buttons, labels

### JetBrains Mono (Monospace)
- **Usage:** Code snippets, terminal output, SQL queries, technical data
- **CSS Variable:** `var(--font-mono)`
- **Weights Available:** 400, 500, 600
- **Example:** SQL workstation, JSON responses, file paths

---

## Typography Scale

**Scale Type:** Minor Third (1.2 ratio) - Professional and tight
**Base Size:** 16px (1rem)

| CSS Variable | Size | Px | Usage |
|-------------|------|-----|-------|
| `--text-xs` | 0.75rem | 12px | Labels, captions, metadata |
| `--text-sm` | 0.875rem | 14px | Secondary text, table data |
| `--text-base` | 1rem | 16px | Body text (standard) |
| `--text-lg` | 1.125rem | 18px | Lead text, emphasized body |
| `--text-xl` | 1.25rem | 20px | H6, small section headings |
| `--text-2xl` | 1.5rem | 24px | H5, card titles |
| `--text-3xl` | 1.875rem | 30px | H4, panel headings |
| `--text-4xl` | 2.25rem | 36px | H3, major sections |
| `--text-5xl` | 3rem | 48px | H2, subsections |
| `--text-6xl` | 3.75rem | 60px | H1, page titles (Reckless) |

---

## Heading Hierarchy

### H1 - Page Title (Reckless)
```css
h1 {
  font-family: var(--font-display);    /* Reckless */
  font-size: var(--text-6xl);          /* 60px */
  font-weight: 400;
  line-height: 1.25;
  letter-spacing: -0.025em;
}
```
**Example:** "Build Data Product", "Discover Marketplace"

### H2 - Major Section (Roobert)
```css
h2 {
  font-family: var(--font-body);       /* Roobert */
  font-size: var(--text-5xl);          /* 48px */
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.025em;
}
```
**Example:** "Getting Started", "Featured Solutions"

### H3 - Section Heading (Roobert)
```css
h3 {
  font-family: var(--font-body);       /* Roobert */
  font-size: var(--text-4xl);          /* 36px */
  font-weight: 600;
  line-height: 1.25;
}
```
**Example:** "Quality Configuration", "Delivery Settings"

### H4 - Subsection (Roobert)
```css
h4 {
  font-family: var(--font-body);       /* Roobert */
  font-size: var(--text-3xl);          /* 30px */
  font-weight: 600;
  line-height: 1.25;
}
```
**Example:** "Connection Details", "Transform Logic"

### H5 - Component Title (Roobert)
```css
h5 {
  font-family: var(--font-body);       /* Roobert */
  font-size: var(--text-2xl);          /* 24px */
  font-weight: 500;
  line-height: 1.375;
}
```
**Example:** Card titles, panel headers

### H6 - Small Heading (Roobert)
```css
h6 {
  font-family: var(--font-body);       /* Roobert */
  font-size: var(--text-xl);           /* 20px */
  font-weight: 500;
  line-height: 1.375;
}
```
**Example:** Sidebar section labels

---

## Body Text Variants

### Lead Text (Roobert)
```css
.roobert-body-lg {
  font-family: var(--font-body);
  font-size: var(--text-lg);           /* 18px */
  font-weight: 400;
  line-height: 1.625;
}
```
**Usage:** Introduction paragraphs, hero subtitles

### Standard Body (Roobert)
```css
.roobert-body, p {
  font-family: var(--font-body);
  font-size: var(--text-base);         /* 16px */
  font-weight: 400;
  line-height: 1.5;
}
```
**Usage:** Main content text, descriptions

### Secondary Text (Roobert)
```css
.roobert-body-sm {
  font-family: var(--font-body);
  font-size: var(--text-sm);           /* 14px */
  font-weight: 400;
  line-height: 1.5;
}
```
**Usage:** Helper text, metadata, timestamps

### Caption/Label (Roobert)
```css
.text-xs {
  font-size: var(--text-xs);           /* 12px */
}
```
**Usage:** Labels, captions, small metadata

---

## Roobert Headline Utility Classes

For UI components that need headline styling:

```css
/* Large component title - 30px */
.roobert-headline--xl {
  font-size: var(--text-3xl);
  font-weight: 600;
}

/* Section header - 24px */
.roobert-headline--lg {
  font-size: var(--text-2xl);
  font-weight: 600;
}

/* Subsection header - 20px */
.roobert-headline--md {
  font-size: var(--text-xl);
  font-weight: 500;
}

/* Label emphasis - 16px */
.roobert-headline--sm {
  font-size: var(--text-base);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

---

## Implementation Examples

### ✅ CORRECT Usage

```tsx
// Page component
<div>
  <h1 className="text-6xl">Build Data Product</h1>  {/* Reckless */}
  <p className="text-lg text-muted-foreground">Create production-ready data products</p>
</div>

// Section
<section>
  <h2 className="text-5xl">Quality Gates</h2>  {/* Roobert */}
  <p className="text-base">Configure validation rules</p>
</section>

// Card
<div className="card-nexus">
  <h5 className="card-nexus__title">Customer 360</h5>  {/* Roobert, 24px */}
  <p className="card-nexus__subtitle">Unified customer data</p>
</div>

// Component heading
<div>
  <h3 className="roobert-headline--lg">Connection Settings</h3>  {/* Roobert, 24px */}
  <p className="text-sm text-muted-foreground">Configure your data source</p>
</div>
```

### ❌ INCORRECT Usage

```tsx
// DON'T use Reckless for non-H1 elements
<h2 className="font-display text-5xl">Section Title</h2>  ❌

// DON'T use arbitrary sizes
<h1 className="text-[72px]">Page Title</h1>  ❌

// DON'T use text-7xl, text-8xl, text-9xl
<h1 className="text-9xl">Huge Title</h1>  ❌

// DON'T mix font families arbitrarily
<p className="font-display">Body text</p>  ❌
```

---

## Tailwind Class Reference

### Font Size Classes (Aligned with Design System)

```css
text-xs    →  12px  (var(--text-xs))
text-sm    →  14px  (var(--text-sm))
text-base  →  16px  (var(--text-base))
text-lg    →  18px  (var(--text-lg))
text-xl    →  20px  (var(--text-xl))
text-2xl   →  24px  (var(--text-2xl))
text-3xl   →  30px  (var(--text-3xl))
text-4xl   →  36px  (var(--text-4xl))
text-5xl   →  48px  (var(--text-5xl))
text-6xl   →  60px  (var(--text-6xl))
```

### Font Weight Classes

```css
font-light      →  300
font-normal     →  400
font-medium     →  500
font-semibold   →  600
font-bold       →  700
```

### Line Height Classes

```css
leading-none      →  1
leading-tight     →  1.25
leading-snug      →  1.375
leading-normal    →  1.5
leading-relaxed   →  1.625
leading-loose     →  1.75
```

---

## Common Patterns

### Page Header Pattern
```tsx
<div className="px-8 py-6">
  <h1 className="text-6xl font-normal tracking-tight mb-2">
    Page Title
  </h1>
  <p className="text-lg text-muted-foreground">
    Supporting description text
  </p>
</div>
```

### Section Pattern
```tsx
<section className="space-y-6">
  <div>
    <h2 className="text-5xl font-semibold mb-2">
      Section Title
    </h2>
    <p className="text-base text-muted-foreground">
      Section description
    </p>
  </div>
  {/* Content */}
</section>
```

### Card Pattern
```tsx
<Card>
  <CardHeader>
    <h5 className="text-2xl font-semibold">Card Title</h5>
    <p className="text-sm text-muted-foreground">Card subtitle</p>
  </CardHeader>
  <CardContent>
    <p className="text-base">Card content</p>
  </CardContent>
</Card>
```

### List Item Pattern
```tsx
<div className="space-y-1">
  <h6 className="text-xl font-medium">Item Title</h6>
  <p className="text-sm text-muted-foreground">Item description</p>
</div>
```

---

## Typography Don'ts

### ❌ Never Do This

1. **Don't use Reckless for anything except H1 page titles**
   ```tsx
   <h2 className="font-display">Section</h2>  ❌
   <div className="font-display">UI Element</div>  ❌
   ```

2. **Don't use arbitrary font sizes**
   ```tsx
   <h1 className="text-[72px]">Title</h1>  ❌
   <p className="text-[15px]">Text</p>  ❌
   ```

3. **Don't use text-7xl, text-8xl, text-9xl**
   - These sizes are not in our scale
   - Max size is text-6xl (60px) for H1

4. **Don't use mono font for non-code content**
   ```tsx
   <p className="font-mono">Regular text</p>  ❌
   ```

5. **Don't mix multiple heading levels arbitrarily**
   - Follow semantic HTML structure
   - H1 → H2 → H3 (hierarchical)

---

## Migration Guide

### Finding Issues

```bash
# Find arbitrary font sizes
rg "text-\[\d+px\]" --type tsx

# Find Reckless usage outside H1
rg "font-display" --type tsx | rg -v "h1"

# Find oversized text classes
rg "text-7xl|text-8xl|text-9xl" --type tsx
```

### Replacement Patterns

| Old Pattern | New Pattern | Notes |
|------------|-------------|-------|
| `text-[48px]` | `text-5xl` | Use scale variable |
| `text-7xl` | `text-6xl` | Max size is 60px |
| `<h2 className="font-display">` | `<h2>` | Only H1 uses Reckless |
| `text-[15px]` | `text-base` | Closest: 16px |
| `font-display text-3xl` | `text-3xl` | Remove font-display |

---

## Testing Checklist

Before deploying typography changes:

- [ ] All H1 elements use Reckless (font-display)
- [ ] All H2-H6 use Roobert (font-body)
- [ ] No arbitrary font sizes (text-[Xpx])
- [ ] No text-7xl, text-8xl, text-9xl usage
- [ ] All body text uses text-base or text-sm
- [ ] Card titles use text-2xl or text-3xl
- [ ] Navigation uses text-base or text-sm
- [ ] Mono font only in code contexts

---

## Related Files

- **CSS Variables:** `/styles/design-system.css`
- **Tailwind Config:** `/tailwind.config.ts`
- **Font Loading:** `/app/layout.tsx`
- **Component Library:** `/components/ui/*`

---

## Questions?

If you're unsure which size to use:

1. **Is it a page title?** → H1 (text-6xl, Reckless)
2. **Is it a major section?** → H2 (text-5xl, Roobert)
3. **Is it a card/panel title?** → H5 (text-2xl, Roobert)
4. **Is it body text?** → p (text-base, Roobert)
5. **Is it metadata/helper text?** → text-sm (Roobert)

**When in doubt, use Roobert and the closest scale size.**
