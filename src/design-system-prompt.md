# Traaaction Design System Prompt

> Use this document as a system prompt to replicate the Traaaction visual style on any website. Copy-paste it as context for an LLM or design tool.

---

## 1. Identity & Philosophy

**Style name**: Traaaction — modern SaaS with editorial clarity.

**Inspirations**: Dub.co (minimalism, light backgrounds), Linear (typography, micro-interactions), Vercel (dark buttons, glass nav).

**Principles**:
- **Light mode only** — no dark theme, no toggle
- **Minimal and airy** — generous whitespace, subtle borders, low-contrast backgrounds
- **Micro-interactions everywhere** — spring-based animations, press feedback, hover lifts
- **Typography-driven** — Geist Sans as primary, tight tracking on headings, tabular numbers for data
- **Restrained color** — mostly grays + violet/purple as primary accent, semantic colors only where needed

---

## 2. Tech Stack

| Technology | Role |
|---|---|
| **Tailwind CSS v4** | Styling — no `tailwind.config.js`, everything via `@theme` in `globals.css` |
| **Framer Motion** | Spring-based animations, layout transitions, stagger effects |
| **Lucide React** | Icon library (outlined, 1.5px stroke) |
| **Geist Sans / Geist Mono** | Font family (Google Fonts via `next/font`) |
| **Next.js App Router + React 19** | Framework |

---

## 3. Color Palette

### CSS Variables (`:root`)
```css
--background: #FAFAFA;    /* Page background — light warm gray */
--foreground: #000000;    /* Default text — pure black */
--card-bg: #FFFFFF;       /* Card/surface background */
--card-border: #E5E7EB;   /* Card border — gray-200 */
```

### Tailwind Colors Used

**Neutrals** (primary palette):
| Token | Hex | Usage |
|---|---|---|
| `gray-50` | `#F9FAFB` | Subtle hover backgrounds, section fills |
| `gray-100` | `#F3F4F6` | Disabled states, skeleton base, toggle inactive |
| `gray-200` | `#E5E7EB` | Standard borders, dividers, scrollbar thumb |
| `gray-300` | `#D1D5DB` | Scrollbar hover, secondary borders |
| `gray-400` | `#9CA3AF` | Muted text, placeholder, inactive icons |
| `gray-500` | `#6B7280` | Secondary text, descriptions |
| `gray-600` | `#4B5563` | Sidebar inactive text, body text |
| `gray-700` | `#374151` | Button secondary text |
| `gray-800` | `#1F2937` | Button hover states |
| `gray-900` | `#111827` | Primary buttons, headings |
| `slate-900` | `#0F172A` | Landing page headings, hero text |

**Primary Accent — Violet/Purple**:
| Token | Usage |
|---|---|
| `violet-50` | Active sidebar item background |
| `violet-100` | Subtle badge borders |
| `violet-500` | Active sidebar indicator bar |
| `violet-600` | Primary CTA buttons, active icon color |
| `violet-700` | Active sidebar text, button hover |
| `purple-50` | Active nav background (alternative), badge bg |
| `purple-500` | Indicator bar (alternative) |
| `purple-600` | Badge text, portal badge |
| `purple-700` | Active nav text (alternative) |

**Semantic Colors**:
| Role | Background | Text | Border |
|---|---|---|---|
| Lead | `purple-50` | `purple-600/700/900` | — |
| Sale | `emerald-50` | `emerald-600/700/900` | — |
| Recurring | `blue-50` | `blue-600/700/900` | — |
| Success | `green-50` | `green-600/700` | `green-200` |
| Warning | `amber-50` / `orange-50` | `amber-600/700` / `orange-700/800` | `orange-200` |
| Danger | `red-50` | `red-600` | `red-200` |
| Info | `blue-50` | `blue-800` | `blue-200` |
| Organization | `amber-50` | `amber-700` | — |
| Group | `violet-50` | `violet-700` | — |
| Portal | `purple-50` | `purple-600` | — |

**Gradient Presets**:
```
Avatar fallback (startup): bg-gradient-to-br from-violet-600 to-purple-500
Avatar fallback (seller):  bg-gradient-to-br from-amber-400 to-orange-500
Dark header:                bg-gradient-to-r from-neutral-900 to-neutral-800
Landing dark button:        bg-gradient-to-b from-neutral-700 to-neutral-900
Hero gradient text:         bg-gradient-to-b from-slate-500 to-slate-950
Completion banner:          bg-gradient-to-r from-orange-500 to-red-500
```

### Background Patterns
```css
/* Dot grid */
bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]

/* Smaller dot grid */
bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]

/* Linear grid */
bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)]
bg-[size:32px_32px]

/* Grid with radial mask (fade edges) */
[mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]

/* Ambient glow blob */
w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[120px] pointer-events-none
```

---

## 4. Typography

### Font Stack
```css
--font-geist-sans: 'Geist Sans', system-ui, sans-serif;  /* Primary */
--font-geist-mono: 'Geist Mono', monospace;                /* Code, metrics */
```

Body: `font-family: var(--font-geist-sans); -webkit-font-smoothing: antialiased;`

### Type Scale

| Element | Classes |
|---|---|
| Hero headline (landing) | `text-4xl md:text-6xl font-medium tracking-tight text-slate-900` |
| Hero giant text | `text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter` |
| Hero subtitle | `text-lg md:text-xl text-slate-600 leading-relaxed` |
| Landing section title | `text-4xl md:text-5xl font-medium tracking-tight text-slate-900` |
| Landing section desc | `text-lg text-slate-500 leading-relaxed font-medium` |
| Page title (dashboard) | `text-xl font-semibold` or `text-2xl font-bold` |
| Card title | `text-lg font-semibold` |
| Section header | `text-sm font-semibold` or `text-[15px] font-semibold` |
| Body text | `text-sm` (14px) or `text-[15px]` |
| Labels / meta | `text-xs font-medium text-gray-500` |
| Uppercase label | `text-xs font-medium uppercase tracking-wider text-gray-400` |
| Tiny status | `text-[10px] font-medium` or `text-[11px]` |
| Financial numbers | `tabular-nums font-semibold text-gray-900` |
| FAQ question | `text-base md:text-lg font-medium tracking-[-0.01em]` |
| FAQ answer | `text-[15px] md:text-base text-slate-500 leading-[1.7]` |
| Fluid (clamp) | `text-[clamp(2rem,5vw,3rem)]` |

### Gradient Text
```
text-transparent bg-clip-text bg-gradient-to-b from-slate-500 to-slate-950
```

---

## 5. Spacing & Layout

### Page Structure
```
Page background:   bg-[#FAFAFA]
Page padding:      px-4 sm:px-6 py-10 sm:py-16
Container widths:  max-w-5xl (standard), max-w-7xl (full), max-w-3xl (narrow), max-w-2xl (form)
```

### Spacing Scale
```
Section gaps:      space-y-6, space-y-8, space-y-32 (landing features)
Card internal:     p-4 sm:p-5, p-5, p-6, p-8
Card header:       px-4 py-3 border-b border-gray-100
Button padding:    px-4 py-2, px-4 py-2.5, px-5 py-2
Input padding:     px-3 sm:px-4 py-3 sm:py-3.5
Badge padding:     px-1.5 py-0.5, px-2 py-0.5, px-2 py-1, px-3 py-1.5
Flex gaps:         gap-1, gap-1.5, gap-2, gap-3, gap-4, gap-6
Bottom margins:    mb-3, mb-4, mb-6, mb-8
Landing sections:  py-24, py-32
```

---

## 6. Component Library

### Cards

**Standard card**:
```
bg-white rounded-xl border border-gray-200 overflow-hidden
```

**Hoverable card**:
```
bg-white rounded-xl border border-gray-100 p-5 card-hover
```
(`card-hover` = `translateY(-1px)` + `box-shadow: 0 2px 8px rgba(0,0,0,0.06)` on hover)

**Card with header**:
```
bg-white rounded-xl border border-gray-200 overflow-hidden
  → header: px-4 py-3 border-b border-gray-100
  → body: p-5
  → dividers: divide-y divide-gray-50
```

**Landing feature card**:
```
bg-white rounded-[1.5rem] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)]
border border-slate-100 hover:scale-105 transition-transform
```

**Visual display box** (landing):
```
bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden relative
shadow-[inset_0_0_40px_rgba(0,0,0,0.02)]
```

---

### Buttons

**Primary (dark)**:
```
bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium
hover:bg-gray-800 transition-colors btn-press
```

**Primary (black, dashboard)**:
```
bg-black text-white rounded-xl px-4 py-2.5 text-sm font-medium
hover:bg-gray-800 btn-press
```

**Secondary (outline)**:
```
bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium
text-gray-700 hover:bg-gray-50 hover:border-gray-300 btn-press
```

**Violet CTA**:
```
bg-violet-600 text-white rounded-lg px-4 py-2 text-sm font-medium
hover:bg-violet-700 btn-press
```

**Landing primary CTA**:
```
h-12 px-8 rounded-lg bg-slate-900 text-white font-medium
hover:bg-slate-800 shadow-lg hover:shadow-xl shadow-blue-900/20
```

**Landing dark gradient button**:
```
px-5 py-2 text-sm font-medium text-white rounded-xl
bg-gradient-to-b from-neutral-700 to-neutral-900 border border-neutral-700
hover:from-neutral-600 hover:to-neutral-800
shadow-[0px_2px_4px_rgba(0,0,0,0.2),0px_1px_0px_rgba(255,255,255,0.1)_inset]
hover:shadow-[0px_4px_8px_rgba(0,0,0,0.3),0px_1px_0px_rgba(255,255,255,0.1)_inset]
```

**Danger**:
```
text-red-600 border border-red-200 hover:bg-red-50 btn-press
```

**Danger (solid)**:
```
bg-red-600 text-white rounded-xl px-4 py-2.5 hover:bg-red-700
```

**Ghost / icon button**:
```
p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors
```

**Copy success state**:
```
bg-green-50 text-green-600 copy-success
```

**`btn-press` utility** (all clickable elements):
```css
transition: transform 100ms ease;
&:active { transform: scale(0.97); }
```

---

### Badges & Pills

| Type | Classes |
|---|---|
| Lead | `bg-purple-50 text-purple-700 rounded-lg px-2 py-0.5 text-xs font-medium` |
| Sale | `bg-emerald-50 text-emerald-700 rounded-lg px-2 py-0.5 text-xs font-medium` |
| Recurring | `bg-blue-50 text-blue-700 rounded-lg px-2 py-0.5 text-xs font-medium` |
| Status (active) | `bg-green-50 text-green-700 rounded-full px-2 py-0.5 text-xs font-medium` |
| Status (pending) | `bg-orange-50 text-orange-700 rounded-full px-2 py-0.5 text-xs font-medium` |
| Status (inactive) | `bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 text-xs font-medium` |
| Private | `bg-amber-50 text-amber-600 rounded-full text-xs font-medium` |
| Organization | `bg-amber-50 text-amber-700 rounded px-2 py-0.5 text-xs font-medium` |
| Group | `bg-violet-50 text-violet-700 rounded px-2 py-0.5 text-xs font-medium` |
| Portal | `bg-purple-50 text-purple-600 rounded px-2 py-0.5 text-xs font-medium` |
| Tiny status | `text-[10px] font-medium px-1.5 py-0.5 rounded-full` |
| Hero badge (landing) | `rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-500 backdrop-blur-md` |
| Feature badge (landing) | `rounded-full bg-violet-50 border border-violet-100 text-violet-600 text-xs font-bold uppercase tracking-wide` |

---

### Inputs & Forms

**Text input**:
```
w-full px-3 sm:px-4 py-3 sm:py-3.5 border border-gray-200 rounded-xl text-base
focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all
placeholder:text-gray-400
```

**Search input**:
```
bg-white rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]
px-4 py-2.5 bg-transparent text-[15px] focus:outline-none
```

**Textarea**:
```
w-full px-4 py-3 border border-gray-200 rounded-xl resize-none
focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
```

**Select/dropdown**:
```
px-3 py-1.5 border border-gray-200 rounded-lg text-sm
```

**Label**:
```
text-xs font-medium text-gray-500
```

**Error message**:
```
text-xs text-red-600 mt-1
```

**Checkbox**:
```
w-3.5 h-3.5 rounded border-gray-300 text-gray-900 focus:ring-gray-900
```

---

### Sidebar Navigation

**Container**:
```
w-64 bg-white border-r border-gray-200
```
(Collapsed: `w-[68px]`)

**Nav item (inactive)**:
```
flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors
```
Icon: `w-4 h-4 text-gray-400`

**Nav item (active)**:
```
flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
bg-purple-50 text-purple-700 font-medium
```
Icon: `w-4 h-4 text-purple-600`

**Active indicator bar** (left edge):
```
w-[3px] h-5 bg-purple-500 rounded-r-full
```
(Animated with Framer Motion `layoutId`)

**Section title**:
```
text-xs font-medium text-gray-400 uppercase tracking-wide px-3 mb-1
```

---

### Tables & List Rows

**Table row**:
```
px-6 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer row-hover
```

**`row-hover` utility**:
```css
transition: transform 200ms ease, background-color 150ms ease;
&:hover { transform: translateX(2px); }
```

**Table header cell**:
```
text-xs font-semibold uppercase tracking-wider text-gray-500
```

**Row chevron** (reveal on hover):
```
opacity-0 group-hover:opacity-100 transition-opacity
```

**Stat value in table**:
```
text-sm tabular-nums font-semibold text-gray-900
```

**Logo in row** (with gradient fallback):
```
w-10 h-10 rounded-lg object-cover
```
Fallback: `bg-gradient-to-br from-violet-600 to-purple-500 text-white font-semibold`

---

### Modals & Dialogs

**Backdrop**:
```
fixed inset-0 bg-black/30 backdrop-blur-sm z-50
```

**Panel**:
```
bg-white rounded-2xl max-w-md shadow-2xl overflow-hidden
```

**Modal header**:
```
px-6 py-4 border-b border-gray-100 sticky top-0 z-10
```

**Video modal overlay**:
```
bg-black/60 backdrop-blur-sm
```

**Close button**:
```
p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600
```

---

### Empty States

**Container**:
```
bg-white border border-gray-200 rounded-xl p-8 sm:p-16 text-center
```

**Floating icon**:
```
w-12 h-12 mx-auto mb-4 bg-gray-50 rounded-full
flex items-center justify-center border border-gray-100
```
(Animated with `floatVariants`: y oscillation `[0, -6, 0]` over 3s)

**Text**:
```
text-sm text-gray-400 mb-4
```

---

### Avatars

**User avatar (with image)**:
```
w-10 h-10 rounded-full object-cover
```

**Startup logo fallback**:
```
w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500
text-white font-semibold flex items-center justify-center
```

**Seller avatar fallback**:
```
w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500
text-white font-medium flex items-center justify-center
```

---

### Alert / Notification Boxes

**Warning**:
```
bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5 text-sm text-orange-800
```

**Info**:
```
bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-sm text-blue-800
```

**Error**:
```
bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-600
```

---

### Toggles & Tabs

**Tab bar container**:
```
bg-gray-100 p-1 rounded-lg flex
```

**Tab button (active)**:
```
bg-white rounded-md shadow-sm text-sm font-medium text-gray-900 px-3 py-1.5
```

**Tab button (inactive)**:
```
text-sm font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5
```

**Landing toggle**:
```
inline-flex p-1 bg-slate-100 rounded-full border border-slate-200 shadow-sm
```

---

## 7. Micro-Animation Utilities (CSS)

Copy these into `globals.css`:

```css
/* Button press — universal click feedback */
@utility btn-press {
  transition: transform 100ms ease;
  &:active { transform: scale(0.97); }
}

/* Card hover lift */
@utility card-hover {
  transition: transform 200ms ease, box-shadow 200ms ease;
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
}

/* Table row indent hover */
@utility row-hover {
  transition: transform 200ms ease, background-color 150ms ease;
  &:hover { transform: translateX(2px); }
}

/* Skeleton shimmer */
@utility skeleton-shimmer {
  position: relative; overflow: hidden; background: #f3f4f6;
  &::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%);
    animation: skeleton-shimmer-slide 1.5s ease-in-out infinite;
  }
}

/* Progress bar fill */
@utility progress-fill {
  transition: width 600ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Badge pop — scale bounce on appear */
@utility badge-pop {
  animation: badge-pop-anim 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes badge-pop-anim {
  0%   { transform: scale(0.6); opacity: 0; }
  100% { transform: scale(1);   opacity: 1; }
}

/* Copy success — bounce feedback */
@utility copy-success {
  animation: copy-success-anim 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes copy-success-anim {
  0%   { transform: scale(0.8);  }
  50%  { transform: scale(1.15); }
  100% { transform: scale(1);    }
}

/* Glass nav */
.glass-nav {
  @apply backdrop-blur-md bg-white/70 border-b border-gray-200;
}
```

---

## 8. Framer Motion Presets

```typescript
import type { Transition, Variants } from 'framer-motion'

// SPRINGS
const springSnappy: Transition = { type: 'spring', stiffness: 500, damping: 30 }
const springSmooth: Transition = { type: 'spring', stiffness: 300, damping: 30 }
const springGentle: Transition = { type: 'spring', stiffness: 200, damping: 24 }

// INTERACTIONS
const buttonTap = { scale: 0.97 }   // whileTap
const iconHover = { scale: 1.12 }   // whileHover

// VARIANTS
const fadeInUp: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
}

const scalePop: Variants = {
  hidden:  { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: springSnappy },
}

const dropdownVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.95, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: springSnappy },
  exit:    { opacity: 0, scale: 0.95, y: -4, transition: { duration: 0.15 } },
}

const modalOverlayVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
}

const modalContentVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.96, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: springSmooth },
  exit:    { opacity: 0, scale: 0.96, y: 10, transition: { duration: 0.15 } },
}

const staggerContainer: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.04 } },
}

const staggerItem: Variants = {
  hidden:  { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 },
}

const floatVariants: Variants = {
  float: {
    y: [0, -6, 0],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
}

const checkmarkDraw: Variants = {
  hidden:  { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
}
```

**Usage patterns**:
```tsx
// Staggered list
<motion.div variants={staggerContainer} initial="hidden" animate="visible">
  {items.map(item => (
    <motion.div key={item.id} variants={staggerItem}>...</motion.div>
  ))}
</motion.div>

// Button with tap
<motion.button whileTap={buttonTap}>Click me</motion.button>

// Modal
<AnimatePresence>
  {isOpen && (
    <>
      <motion.div variants={modalOverlayVariants} initial="hidden" animate="visible" exit="exit" />
      <motion.div variants={modalContentVariants} initial="hidden" animate="visible" exit="exit">
        ...
      </motion.div>
    </>
  )}
</AnimatePresence>

// Sidebar active indicator (shared layout)
<motion.div layoutId="sidebar-indicator" className="w-[3px] h-5 bg-purple-500 rounded-r-full" />
```

---

## 9. Landing Page Specifics

### Hero Section
```tsx
// Container
<section className="relative flex flex-col items-center justify-center py-32 overflow-hidden">

// Headline
<h1 className="text-4xl md:text-6xl font-medium tracking-tight text-slate-900 mb-8 max-w-5xl mx-auto text-center">

// Giant gradient word
<span className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter
  text-transparent bg-clip-text bg-gradient-to-b from-slate-500 to-slate-950
  drop-shadow-sm select-none">

// Italic subtitle with dividers
<span className="flex items-center gap-4 text-xl md:text-2xl font-serif italic text-slate-400">
  <span className="h-[1px] w-12 bg-slate-200" />
  Text
  <span className="h-[1px] w-12 bg-slate-200" />
</span>

// Subheadline
<p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">

// CTA row
<div className="flex flex-col sm:flex-row gap-4">
  <button className="h-12 px-8 rounded-lg bg-slate-900 text-white font-medium
    hover:bg-slate-800 shadow-lg hover:shadow-xl shadow-blue-900/20">
  <button className="h-12 px-8 rounded-lg border border-slate-200 bg-white
    text-slate-900 font-medium hover:bg-slate-50">
</div>
```

### Glass Navigation Bar
```tsx
<nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
  <div className="w-full max-w-5xl rounded-2xl bg-white/90 backdrop-blur-md
    border border-gray-200/50 shadow-xl px-6 py-3">
```

### Section Headers (landing)
```tsx
<div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
  <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-slate-900">
  <p className="text-lg text-slate-500 leading-relaxed font-medium">
</div>
```

### Feature Grid with Dividers
```tsx
<div className="grid grid-cols-1 md:grid-cols-3
  divide-y md:divide-y-0 md:divide-x divide-slate-200 border-t border-slate-200">
  <div className="flex flex-col pt-12 pb-8 px-6 md:px-8 group bg-white">
```

### Testimonial Section
```
border-t border-slate-200 bg-white relative overflow-hidden
→ background: bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-60
→ blockquote: text-xl md:text-2xl font-medium text-slate-900 leading-tight tracking-tight
→ avatar: grayscale hover:grayscale-0 transition-all duration-500
```

### FAQ Accordion
```
Section: bg-[#FAFAF9] py-20 md:py-32
Label: text-sm font-medium tracking-[0.2em] uppercase text-slate-400
Title: text-[clamp(2rem,5vw,3rem)] font-semibold text-slate-900 tracking-[-0.02em]
Question: text-base md:text-lg font-medium (text-slate-600 → text-slate-900 on open/hover)
Chevron: w-8 h-8 rounded-full (bg-slate-100 → bg-slate-900 text-white on open)
Answer: text-[15px] md:text-base text-slate-500 leading-[1.7]
```

---

## 10. Responsive Patterns

**Breakpoints**: `sm` (640px), `md` (768px), `lg` (1024px)

**Approach**: Mobile-first. Base = mobile, then add `sm:`, `md:`, `lg:` overrides.

```
Sidebar:         hidden md:block (desktop), mobile drawer overlay (mobile)
Mobile header:   sticky top-0 bg-white/80 backdrop-blur-md z-40
Stack direction: flex-col md:flex-row
Hide on mobile:  hidden md:flex
Show only mobile: md:hidden
Text scaling:    text-4xl md:text-6xl (landing), text-xl sm:text-2xl (dashboard)
Padding scaling: px-4 sm:px-6, py-10 sm:py-16
Card padding:    p-4 sm:p-5
Grid collapse:   grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

---

## 11. Scrollbar & Polish

```css
/* Thin scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }

/* Text selection */
selection:bg-blue-100 selection:text-blue-900

/* Font smoothing (on body) */
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

---

## 12. Quick Reference — Common Compositions

**Dashboard page skeleton**:
```tsx
<div className="min-h-screen bg-[#FAFAFA]">
  <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Page Title</h1>
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Section</h2>
        </div>
        <div className="p-5">Content</div>
      </div>
    </div>
  </div>
</div>
```

**Stat card grid**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Label</p>
    <p className="text-2xl font-bold tabular-nums text-gray-900">$1,234</p>
    <p className="text-xs text-gray-400 mt-1">+12% vs last month</p>
  </div>
</div>
```

**List item with avatar**:
```tsx
<div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer group row-hover">
  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500
    text-white font-semibold flex items-center justify-center text-sm">
    AB
  </div>
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium text-gray-900 truncate">Item Name</p>
    <p className="text-xs text-gray-500">Description</p>
  </div>
  <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
</div>
```

**Landing section**:
```tsx
<section className="bg-white border-t border-slate-200">
  <div className="container mx-auto px-4 max-w-5xl py-24">
    <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
      <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-slate-900">
        Section Title
      </h2>
      <p className="text-lg text-slate-500 leading-relaxed font-medium">
        Description text here.
      </p>
    </div>
    {/* Content */}
  </div>
</section>
```

---

## 13. Do's and Don'ts

**DO**:
- Use `bg-[#FAFAFA]` for all page backgrounds (not pure white)
- Use `rounded-xl` for cards, `rounded-lg` for buttons, `rounded-full` for pills
- Use `border border-gray-200` (not shadow) for card edges
- Use `text-sm` as default body text size
- Use `font-medium` on buttons and nav items
- Use `tracking-tight` on all headings
- Use `tabular-nums` on financial/metric displays
- Add `btn-press` to all clickable elements
- Use spring-based Framer Motion (not CSS easing)
- Use Lucide React icons (outlined style)

**DON'T**:
- Use dark mode or dark backgrounds (exception: landing gradient buttons)
- Use heavy box shadows for elevation (prefer subtle borders)
- Use `font-bold` on buttons (use `font-medium`)
- Use colors outside the defined palette
- Use `rounded-md` or `rounded-sm` (too subtle for this design)
- Use CSS transitions for complex animations (use Framer Motion)
- Mix icon libraries (Lucide only)
- Use pure `#000000` for borders (use gray scale)
