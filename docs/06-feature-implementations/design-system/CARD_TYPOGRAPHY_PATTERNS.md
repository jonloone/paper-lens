# Card Typography Patterns
**Last Updated:** 2025-01-10
**Status:** ✅ Design Standard

---

## Standard Card Typography Hierarchy

All cards across NexusOne should follow this consistent hierarchy:

```
Card Structure:
┌─────────────────────────────────────┐
│ CardTitle (text-xl, semibold)       │  ← 20px, Roobert Semibold
├─────────────────────────────────────┤
│ Section Heading (text-base, bold)   │  ← 16px, Roobert Semibold
│ Body Text (text-sm, regular)        │  ← 14px, Roobert Regular
│ Metadata/Labels (text-xs, medium)   │  ← 12px, Roobert Medium
└─────────────────────────────────────┘
```

---

## Typography Scale for Cards

### Card Title (Primary)
- **Size:** `text-xl` (20px)
- **Weight:** `font-semibold` (600)
- **Font:** Roobert
- **Usage:** Main card header title
- **Example:** "Purpose & Use Cases", "Getting Started"

```tsx
<CardTitle className="text-xl font-semibold">
  Card Title Here
</CardTitle>
```

### Section Heading (Inside Card)
- **Size:** `text-base` (16px)
- **Weight:** `font-semibold` (600)
- **Font:** Roobert
- **Usage:** Subsection headers within card content
- **Example:** "What is this product?", "Common Use Cases"

```tsx
<h4 className="text-base font-semibold mb-2">
  Section Heading
</h4>
```

### Body Text
- **Size:** `text-sm` (14px)
- **Weight:** `font-normal` (400)
- **Font:** Roobert
- **Color:** `text-muted-foreground`
- **Usage:** Main descriptive text, paragraphs

```tsx
<p className="text-sm text-muted-foreground leading-relaxed">
  Body text content here
</p>
```

### Metadata/Labels
- **Size:** `text-xs` (12px)
- **Weight:** `font-medium` (500)
- **Font:** Roobert
- **Color:** `text-muted-foreground`
- **Usage:** Labels, captions, timestamps

```tsx
<span className="text-xs font-medium text-muted-foreground">
  Label text
</span>
```

### Data/Numbers (Inside Cards)
- **Size:** `text-2xl` (24px) for primary metrics
- **Weight:** `font-bold` (700)
- **Font:** Roobert
- **Usage:** Key metrics, statistics

```tsx
<div className="text-2xl font-bold">
  {count.toLocaleString()}
</div>
<div className="text-sm text-muted-foreground">
  Metric Label
</div>
```

---

## Standard Card Patterns

### Pattern 1: Information Card

```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-xl font-semibold flex items-center gap-2">
      <Icon className="h-5 w-5" />
      Card Title
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div>
      <h4 className="text-base font-semibold mb-2">
        Section Heading
      </h4>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Description text goes here
      </p>
    </div>
  </CardContent>
</Card>
```

### Pattern 2: Metric Card

```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-xl font-semibold">
      Metrics
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1">
        <div className="text-2xl font-bold">
          {value}
        </div>
        <div className="text-sm text-muted-foreground">
          Metric Label
        </div>
      </div>
    </div>
  </CardContent>
</Card>
```

### Pattern 3: List Card

```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-xl font-semibold">
      List Title
    </CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground mb-3">
      List description
    </p>
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.id} className="p-2 rounded-lg border">
          <div className="text-sm font-medium">
            {item.title}
          </div>
          <div className="text-xs text-muted-foreground">
            {item.subtitle}
          </div>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

### Pattern 4: Product/Marketplace Card

```tsx
<Card className="hover:shadow-lg transition-all">
  <CardContent className="p-5">
    {/* Badge */}
    <Badge variant="secondary" className="mb-3 text-xs">
      Badge Text
    </Badge>

    {/* Title */}
    <h3 className="text-lg font-semibold leading-tight mb-2">
      Product Title
    </h3>

    {/* Description */}
    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
      Product description
    </p>

    {/* Metadata */}
    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
      <span>Metadata 1</span>
      <span>•</span>
      <span>Metadata 2</span>
    </div>

    {/* Action */}
    <Button className="w-full text-sm">
      Action
    </Button>
  </CardContent>
</Card>
```

---

## ✅ DO's

1. **Card Titles** → Always `text-xl font-semibold`
2. **Section Headings** → Always `text-base font-semibold`
3. **Body Text** → Always `text-sm text-muted-foreground`
4. **Metadata** → Always `text-xs text-muted-foreground`
5. **Consistency** → Use the same pattern across similar cards

---

## ❌ DON'Ts

1. **Don't use** `text-lg` for section headings (use `text-base`)
2. **Don't use** `text-base` for body text (use `text-sm`)
3. **Don't use** varied sizes in similar contexts
4. **Don't use** inconsistent font weights
5. **Don't use** arbitrary sizes like `text-[15px]`

---

## Migration Examples

### Before (Inconsistent)

```tsx
{/* Mixed sizes */}
<CardTitle className="flex items-center gap-2">  {/* No explicit size */}
  Title
</CardTitle>
<h4 className="text-sm font-semibold mb-2">     {/* Too small */}
  Heading
</h4>
<p className="text-sm leading-relaxed">          {/* OK */}
  Text
</p>
```

### After (Consistent)

```tsx
{/* Standardized */}
<CardTitle className="text-xl font-semibold flex items-center gap-2">
  Title
</CardTitle>
<h4 className="text-base font-semibold mb-2">
  Heading
</h4>
<p className="text-sm text-muted-foreground leading-relaxed">
  Text
</p>
```

---

## Quick Reference

| Element | Size | Weight | Color | Usage |
|---------|------|--------|-------|-------|
| Card Title | `text-xl` (20px) | `font-semibold` | `foreground` | Main card header |
| Section Heading | `text-base` (16px) | `font-semibold` | `foreground` | Subsections in cards |
| Body Text | `text-sm` (14px) | `font-normal` | `muted-foreground` | Descriptions |
| Metadata/Label | `text-xs` (12px) | `font-medium` | `muted-foreground` | Labels, captions |
| Metric Value | `text-2xl` (24px) | `font-bold` | `foreground` | Numbers, stats |
| Metric Label | `text-sm` (14px) | `font-normal` | `muted-foreground` | Metric descriptions |
| Product Title | `text-lg` (18px) | `font-semibold` | `foreground` | Marketplace cards |
| Button Text | `text-sm` (14px) | `font-medium` | varies | CTA buttons |

---

## Testing Checklist

Before deploying card changes:

- [ ] All CardTitles use `text-xl font-semibold`
- [ ] All section headings use `text-base font-semibold`
- [ ] All body text uses `text-sm`
- [ ] All metadata uses `text-xs`
- [ ] No arbitrary sizes used
- [ ] Similar cards have identical hierarchy
- [ ] Color classes are consistent (`text-muted-foreground` for secondary)
