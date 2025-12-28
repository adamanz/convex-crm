# Convex CRM Style Guide

A comprehensive design system and component guidelines for building a modern, clean SaaS CRM interface.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Component Patterns](#component-patterns)
6. [UI Components](#ui-components)
7. [Shared Components](#shared-components)
8. [Page Patterns](#page-patterns)
9. [Interaction Patterns](#interaction-patterns)
10. [Accessibility](#accessibility)
11. [Best Practices](#best-practices)

---

## Design Philosophy

### Core Principles

1. **Clarity Over Decoration** — Every element should serve a purpose. Avoid purely decorative elements that don't improve usability.

2. **Progressive Disclosure** — Show essential information first; reveal complexity as needed through drill-down interactions.

3. **Consistent Visual Language** — Use the same patterns for similar actions across the entire application.

4. **Responsive & Touch-Friendly** — All interactive elements must be accessible on both desktop and mobile (minimum 44px touch targets).

5. **Performance-First** — Prioritize skeleton loaders and optimistic updates for perceived speed.

### Visual Identity

- **Clean & Modern**: Minimal visual noise, generous whitespace
- **Professional**: Neutral zinc palette with purposeful accent colors
- **Approachable**: Rounded corners, subtle shadows, smooth transitions
- **Data-Dense When Needed**: Tables and lists should be scannable

---

## Color System

### Design Tokens (CSS Custom Properties)

```css
/* Light Mode */
--background: 0 0% 100%;           /* Pure white */
--foreground: 240 10% 3.9%;        /* Near black */
--card: 0 0% 100%;
--card-foreground: 240 10% 3.9%;
--primary: 240 5.9% 10%;           /* Dark zinc - primary actions */
--primary-foreground: 0 0% 98%;
--secondary: 240 4.8% 95.9%;       /* Light gray - secondary actions */
--muted: 240 4.8% 95.9%;           /* Subtle backgrounds */
--muted-foreground: 240 3.8% 46.1%; /* Subdued text */
--accent: 240 4.8% 95.9%;
--destructive: 0 84.2% 60.2%;      /* Red - destructive actions */
--border: 240 5.9% 90%;
--ring: 240 5.9% 10%;              /* Focus rings */
--radius: 0.5rem;                  /* Base border radius */

/* Dark Mode */
--background: 240 10% 3.9%;
--foreground: 0 0% 98%;
/* ... inverted values */
```

### Semantic Colors

| Purpose | Light Mode | Dark Mode | Usage |
|---------|------------|-----------|-------|
| **Success** | `emerald-50/700` | `emerald-950/400` | Positive changes, won deals |
| **Warning** | `amber-50/700` | `amber-950/400` | Caution, pending items |
| **Error** | `red-50/700` | `red-950/400` | Errors, lost deals, destructive |
| **Info** | `blue-50/700` | `blue-950/400` | Informational, neutral |

### Stage Colors (Pipeline)

```typescript
const STAGE_COLORS = {
  lead: "#6366f1",        // Indigo
  qualified: "#8b5cf6",   // Violet
  proposal: "#a855f7",    // Purple
  negotiation: "#f59e0b", // Amber
  won: "#22c55e",         // Green
  lost: "#ef4444",        // Red
};
```

### Priority Colors

```typescript
const PRIORITY_COLORS = {
  low: "#6b7280",    // Gray
  medium: "#f59e0b", // Amber
  high: "#ef4444",   // Red
};
```

---

## Typography

### Font Family

- **Primary**: Geist Sans (via `next/font`)
- **Monospace**: Geist Mono (for code, IDs, timestamps)

### Type Scale

| Element | Class | Size | Weight | Line Height |
|---------|-------|------|--------|-------------|
| Page Title | `text-2xl font-semibold tracking-tight` | 24px | 600 | 1.2 |
| Section Title | `text-lg font-semibold` | 18px | 600 | 1.4 |
| Card Title | `font-semibold leading-none tracking-tight` | 16px | 600 | 1 |
| Body | `text-sm` | 14px | 400 | 1.5 |
| Small/Caption | `text-xs` | 12px | 400 | 1.4 |
| Label | `text-sm font-medium` | 14px | 500 | 1.4 |
| Muted Text | `text-sm text-muted-foreground` | 14px | 400 | 1.5 |
| Nav Item | `text-[13px] font-medium` | 13px | 500 | 1.4 |
| Section Header | `text-[10px] font-semibold uppercase tracking-wider` | 10px | 600 | 1.2 |

### Text Colors

```tsx
// Primary text
<span className="text-foreground">Primary content</span>
<span className="text-zinc-900 dark:text-zinc-50">Explicit primary</span>

// Secondary/muted text
<span className="text-muted-foreground">Secondary content</span>
<span className="text-zinc-500 dark:text-zinc-400">Subdued labels</span>

// Links and interactive
<span className="text-primary hover:text-primary/80">Clickable</span>
```

---

## Spacing & Layout

### Spacing Scale

Use Tailwind's default spacing scale consistently:

| Token | Value | Usage |
|-------|-------|-------|
| `0.5` | 2px | Icon/text micro gaps |
| `1` | 4px | Tight element spacing |
| `1.5` | 6px | Badge padding, tight gaps |
| `2` | 8px | Form element padding, list gaps |
| `3` | 12px | Card content padding, nav padding |
| `4` | 16px | Section padding, larger gaps |
| `6` | 24px | Card header/footer padding |
| `8` | 32px | Page section margins |
| `12` | 48px | Empty state vertical padding |

### Border Radius

```css
--radius-sm: calc(var(--radius) - 4px);  /* 4px - badges, small buttons */
--radius-md: var(--radius);               /* 8px - inputs, buttons */
--radius-lg: calc(var(--radius) + 4px);   /* 12px - cards, dialogs */
--radius-xl: calc(var(--radius) + 8px);   /* 16px - large containers */
```

### Layout Grid

```tsx
// Sidebar + Content layout
<div className="flex h-screen">
  <aside className="w-64 border-r" />  {/* 256px sidebar */}
  <main className="flex-1 overflow-auto" />
</div>

// Page content container
<div className="p-6 space-y-6">
  <PageHeader />
  <Content />
</div>

// Stats grid
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <StatsCard />
</div>
```

---

## Component Patterns

### Component Architecture

All components follow these patterns:

```tsx
// 1. Use forwardRef for DOM element access
const Component = React.forwardRef<HTMLElement, ComponentProps>(
  ({ className, ...props }, ref) => (
    <element ref={ref} className={cn(baseStyles, className)} {...props} />
  )
);
Component.displayName = "Component";

// 2. Use CVA for variants
const componentVariants = cva(
  "base-classes",
  {
    variants: {
      variant: { default: "...", secondary: "..." },
      size: { sm: "...", default: "...", lg: "..." },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// 3. Extend with VariantProps
interface ComponentProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof componentVariants> {}
```

### State Styling Patterns

```tsx
// Interactive states (buttons, cards)
"transition-all duration-200"
"hover:shadow-md hover:border-primary/20"
"active:scale-[0.98]"

// Disabled state
"disabled:pointer-events-none disabled:opacity-50"

// Focus visible
"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

// Selected/active state
"data-[state=selected]:bg-muted"
```

---

## UI Components

### Button

```tsx
// Variants
<Button variant="default">Primary Action</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button variant="link">Link Style</Button>

// Sizes
<Button size="sm">Small</Button>      // h-9, text-xs
<Button size="default">Default</Button> // h-10
<Button size="lg">Large</Button>      // h-11
<Button size="icon">Icon</Button>     // 40x40px

// With icon
<Button>
  <Plus className="h-4 w-4" />
  Add Contact
</Button>
```

**Guidelines:**
- Primary actions: `variant="default"` (dark background)
- Secondary actions: `variant="outline"` or `variant="secondary"`
- Destructive actions: `variant="destructive"` (confirm dialogs required)
- Minimum touch target: 44px (`min-h-[44px]`)

### Badge

```tsx
// Semantic variants
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="success">Won</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="destructive">Lost</Badge>
<Badge variant="info">New</Badge>
<Badge variant="outline">Outline</Badge>
```

**Guidelines:**
- Use for status indicators, tags, counts
- Keep text short (1-2 words)
- Use semantic colors for status

### Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Supporting text</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

**Guidelines:**
- Default padding: `p-6` for header/footer, `p-6 pt-0` for content
- Use `rounded-xl` for card containers
- Add `hover:shadow-md` for clickable cards
- Use `transition-all duration-200` for hover effects

### Input

```tsx
<Input
  placeholder="Enter value..."
  className="h-9 w-full"
/>
```

**Guidelines:**
- Height: `h-9` (36px) for forms
- Border: `border-input` with `focus-visible:ring-1`
- Placeholder: `text-muted-foreground`

### Table

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Content</TableCell>
      <TableCell><Badge>Active</Badge></TableCell>
    </TableRow>
  </TableBody>
</Table>
```

**Guidelines:**
- Use `hover:bg-muted/50` for row hover
- Header text: `font-medium text-muted-foreground`
- Cell padding: `p-2`
- Align text left by default

### Dialog

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Form content */}
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Guidelines:**
- Max width: `max-w-lg` (512px) default
- Always include close button (X)
- Animate in: `zoom-in-95 fade-in-0`
- Dark overlay: `bg-black/80`

---

## Shared Components

### PageHeader

```tsx
<PageHeader
  title="Contacts"
  description="Manage your customer relationships"
  actions={<Button>Add Contact</Button>}
/>
```

**Structure:**
- Title: `text-2xl font-semibold tracking-tight`
- Description: `text-sm text-muted-foreground`
- Actions aligned right on desktop

### StatsCard

```tsx
<StatsCard
  icon={Users}
  label="Total Contacts"
  value="1,234"
  change={12.5}
  changeLabel="vs last month"
/>
```

**Features:**
- Icon in rounded container (`rounded-lg bg-zinc-100`)
- Large value (`text-3xl font-semibold`)
- Change indicator with semantic colors
- Subtle hover gradient overlay

### EmptyState

```tsx
<EmptyState
  variant="contacts"  // contacts | deals | search | etc.
  title="No contacts yet"
  description="Get started by adding your first contact."
  actionLabel="Add Contact"
  onAction={() => {}}
/>
```

**Features:**
- Centered layout with icon
- Context-aware defaults
- Optional CTA button

### LoadingState

```tsx
// Full page spinner
<FullPageSpinner message="Loading contacts..." />

// Card skeleton
<CardSkeleton lines={3} showAvatar />

// Table skeleton
<TableSkeleton rows={5} columns={4} />

// Inline loading
<InlineLoading message="Saving..." />
```

---

## Page Patterns

### Dashboard Page

```tsx
<div className="flex-1 space-y-6 p-6">
  <PageHeader title="Dashboard" />

  {/* Stats Grid */}
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <StatsCard />
  </div>

  {/* Content Grid */}
  <div className="grid gap-6 lg:grid-cols-2">
    <Card>Chart</Card>
    <Card>Activity</Card>
  </div>
</div>
```

### List Page

```tsx
<div className="flex-1 space-y-6 p-6">
  <PageHeader
    title="Contacts"
    actions={<Button>Add Contact</Button>}
  />

  {/* Filters */}
  <div className="flex items-center gap-4">
    <Input placeholder="Search..." />
    <FilterDropdown />
  </div>

  {/* Table or Cards */}
  <Card>
    <Table>...</Table>
  </Card>
</div>
```

### Detail Page

```tsx
<div className="flex-1 p-6">
  <div className="mx-auto max-w-4xl space-y-6">
    {/* Header with back button */}
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon">
        <ArrowLeft />
      </Button>
      <PageHeader title="Contact Details" />
    </div>

    {/* Content sections */}
    <Card>...</Card>
  </div>
</div>
```

### Kanban Page (Deals)

```tsx
<div className="flex h-full gap-4 overflow-x-auto p-6">
  {stages.map(stage => (
    <div className="flex w-72 flex-shrink-0 flex-col">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="font-semibold">{stage.name}</h3>
        <Badge variant="secondary">{stage.count}</Badge>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto">
        {deals.map(deal => <DealCard key={deal.id} deal={deal} />)}
      </div>
    </div>
  ))}
</div>
```

---

## Interaction Patterns

### Transitions

```css
/* Standard transition */
transition-all duration-200

/* Hover shadow */
hover:shadow-md

/* Button press */
active:scale-[0.98]

/* Sidebar collapse */
transition-all duration-200 w-64 → w-[68px]

/* Modal animations */
data-[state=open]:animate-in
data-[state=closed]:animate-out
fade-in-0 / fade-out-0
zoom-in-95 / zoom-out-95
```

### Hover States

```tsx
// Card hover
"transition-all duration-200 hover:shadow-md hover:border-primary/20"

// Row hover
"hover:bg-muted/50"

// Link hover
"hover:text-primary"

// Icon hover
"text-muted-foreground hover:text-foreground"
```

### Drag & Drop

```tsx
// Dragging state
"opacity-50 shadow-lg rotate-2 scale-105 z-50"

// Drag handle visibility
"opacity-0 group-hover:opacity-100"
```

### Loading States

1. **Skeleton Placeholders** — Use for initial data loads
2. **Spinner** — Use for actions in progress
3. **Optimistic Updates** — Update UI immediately, rollback on error

---

## Accessibility

### Focus Management

```tsx
// Visible focus ring
"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

// Skip focus ring on click
"focus:outline-none focus-visible:ring-2"
```

### Touch Targets

- Minimum size: 44x44px for all interactive elements
- Button sizes enforce minimum heights: `min-h-[44px]`

### Screen Reader

```tsx
// Hidden but accessible
<span className="sr-only">Close dialog</span>

// ARIA labels
<button aria-label="Open menu">
  <Menu />
</button>
```

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Use `tabindex` appropriately
- Escape closes modals/drawers
- Support standard shortcuts (Cmd+K for search)

---

## Best Practices

### DO

- Use semantic color variants for status (success, warning, error)
- Provide loading skeletons that match content shape
- Use consistent spacing (`gap-4` for grids, `space-y-6` for sections)
- Include empty states with clear CTAs
- Add subtle hover/transition effects for interactivity
- Test on mobile viewports
- Use `cn()` utility for conditional classes

### DON'T

- Don't use raw color values (use design tokens)
- Don't skip loading states
- Don't use multiple primary buttons in the same view
- Don't make touch targets smaller than 44px
- Don't use inconsistent border radiuses
- Don't forget dark mode support
- Don't hardcode widths (use responsive utilities)

### Component Checklist

When building a new component:

- [ ] Extends proper HTML element types
- [ ] Uses `forwardRef` for DOM access
- [ ] Accepts `className` prop with `cn()` merge
- [ ] Has defined variants using CVA (if applicable)
- [ ] Supports keyboard navigation
- [ ] Has proper ARIA attributes
- [ ] Works in dark mode
- [ ] Has appropriate loading/empty states
- [ ] Meets touch target requirements
- [ ] Uses consistent spacing and typography
- [ ] Has smooth transitions

---

## File Structure

```
src/components/
├── ui/                    # Base UI primitives
│   ├── button.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   ├── table.tsx
│   └── ...
├── shared/                # Shared composite components
│   ├── page-header.tsx
│   ├── stats-card.tsx
│   ├── empty-state.tsx
│   ├── loading-state.tsx
│   └── ...
├── layout/                # Layout components
│   ├── app-sidebar.tsx
│   ├── command-menu.tsx
│   └── dashboard-header.tsx
├── [feature]/             # Feature-specific components
│   ├── contacts/
│   ├── deals/
│   ├── activities/
│   └── ...
└── providers/             # Context providers
```

---

## Quick Reference

### Common Patterns

```tsx
// Clickable card
<Card className="cursor-pointer transition-all duration-200 hover:shadow-md" onClick={...}>

// Icon with text
<div className="flex items-center gap-2">
  <Icon className="h-4 w-4 text-muted-foreground" />
  <span className="text-sm">Label</span>
</div>

// Truncated text
<p className="truncate">Long text...</p>
<p className="line-clamp-2">Multi-line truncate...</p>

// Responsive hide/show
<div className="hidden sm:block">Desktop only</div>
<div className="sm:hidden">Mobile only</div>

// Page container
<div className="flex-1 space-y-6 p-6">

// Card grid
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
```

---

*Last updated: December 2024*
*Version: 1.0*
