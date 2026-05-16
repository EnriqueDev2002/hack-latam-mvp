# VoiceGuard — Design System

**Aesthetic Direction:** "Warm Confidence"
Duolingo's human warmth × Revolut's structural clarity × Headspace's calming intention.
Professional but never cold. Trustworthy but never sterile.

---

## Color Tokens

### Brand
| Token | Value | Usage |
|-------|-------|-------|
| `brand` | `#2563EB` | Primary actions, active nav, links |
| `brand-dark` | `#1E40AF` | Hover states, headings |
| `brand-light` | `#DBEAFE` | Backgrounds, badges |
| `brand-50` | `#EFF6FF` | Hero backgrounds, subtle fills |

### Semantic
| Token | Value | Background | Usage |
|-------|-------|-----------|-------|
| `success` | `#16A34A` | `#DCFCE7` | Authentic voice, enrolled contacts |
| `danger` | `#DC2626` | `#FEE2E2` | Fake voice, fraud alerts |
| `warning` | `#D97706` | `#FEF3C7` | Suspicious voice, medium risk |

### Neutrals
| Token | Value | Usage |
|-------|-------|-------|
| `neutral-900` | `#0F172A` | Primary text |
| `neutral-600` | `#475569` | Secondary text, muted labels |
| `neutral-200` | `#E2E8F0` | Card borders, dividers |
| `neutral-50` | `#F8FAFC` | Page background |

### Accent
| Token | Value | Usage |
|-------|-------|-------|
| `peach` | `#FED7AA` | Warm accent for illustrations |

---

## Typography

**Fonts:**
- UI: **Plus Jakarta Sans** (400, 500, 600, 700, 800) — warm humanist sans
- Timer/mono: **JetBrains Mono** (500) — for recording timer and counters

**Scale:**
| Role | Size | Weight | Line-height | Letter-spacing |
|------|------|--------|-------------|----------------|
| Hero | 48px | 700 | 1.2 | -0.02em |
| Title | 32px | 700 | 1.2 | -0.02em |
| Subtitle | 22px | 600 | 1.4 | -0.01em |
| Body | 18px | 500 | 1.6 | 0 |
| Small | 14px | 500 | 1.5 | 0 |

**Senior-friendly:** `text-senior` = 18px / 1.75rem line-height. All body copy uses this minimum.

---

## Spacing

Multiple of 8px throughout:

| Token | Value | Usage |
|-------|-------|-------|
| 2 | 8px | Icon gap, tight inline |
| 3 | 12px | Gap between label and input |
| 4 | 16px | Internal card padding (small) |
| 5 | 20px | Button padding horizontal |
| 6 | 24px | Card padding (standard) |
| 8 | 32px | Card padding (large) |
| 10 | 40px | Section inner spacing |
| 16 | 64px | Section gap |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-[12px]` | 12px | Filter tabs, small buttons |
| `rounded-[14px]` | 14px | Input fields, inline cards |
| `rounded-[16px]` / `btn` | 16px | All buttons |
| `rounded-[20px]` / `card` | 20px | All cards (standard) |
| `rounded-[22px]` | 22px | Page header icons |
| `rounded-[24px]` | 24px | Modal dialogs |
| `rounded-full` | 9999px | Circular buttons, avatars, badges |

---

## Shadow System

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-card` | `0 1px 3px rgba(0,0,0,.05), 0 4px 12px rgba(0,0,0,.04)` | Resting cards |
| `shadow-card-hover` | `0 8px 24px rgba(0,0,0,.08)` | Hovered cards |
| `shadow-brand` | `0 4px 12px rgba(37,99,235,.18)` | Brand buttons |
| `shadow-brand-lg` | `0 8px 24px rgba(37,99,235,.25)` | Hovered brand buttons |
| `shadow-success` | `0 4px 12px rgba(22,163,74,.18)` | Success states |
| `shadow-danger` | `0 4px 12px rgba(220,38,38,.18)` | Danger states |

---

## Component Classes (globals.css)

| Class | Usage |
|-------|-------|
| `.btn-primary` | Primary CTA — gradient blue, shadow, translateY hover |
| `.btn-secondary` | Secondary CTA — white with brand border |
| `.card` | Standard card — white, 20px radius, shadow-card |
| `.card-hover` | Add hover elevation to card |
| `.input-field` | Text/tel inputs — 14px radius, focus:border-brand |
| `.badge` | Base badge — pill shape |
| `.badge-success` | Green badge |
| `.badge-danger` | Red badge |
| `.badge-warning` | Amber badge |
| `.badge-neutral` | Gray badge |
| `.skeleton` | Loading placeholder with shimmer animation |
| `.text-gradient-brand` | Blue gradient text |
| `.font-mono-display` | JetBrains Mono for timer display |

---

## Motion Principles

**Philosophy:** Motion communicates state. Every animation has purpose.

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| `fade-up` | 400ms | ease-out | Page elements, cards entering |
| `scale-in` | 500ms | spring (stiffness 220) | Success icons, modal entrance |
| `pulse-ring` | 2s | ease-in-out / infinite | Recording button rings |
| `wave-bar` | 1.2s | ease-in-out / infinite | Analyzing loader bars |
| `shimmer` | 1.8s | linear / infinite | Skeleton loaders |
| `shake` | 500ms | ease-out / once | High-risk result card |
| `success-pulse` | 2s | ease-in-out / once | Low-risk result glow |

**Stagger:** Lists use `animationDelay: idx * 60-80ms` for cascading entrance.

**framer-motion:** Used exclusively in `RiskIndicator` for:
- Icon: spring entrance (scale + rotate)
- Confidence bar: `width: 0 → pct%` over 1.4s with custom ease
- Text elements: sequential opacity/x fades with delays

---

## Accessibility

- Contrast ratio ≥ 7:1 on all text/background combinations
- Focus visible: `outline: 3px solid #2563EB, offset: 2px`
- All interactive elements have `aria-label` where icon-only
- Color is never the sole differentiator (always paired with icon + text)
- `text-senior` (18px) enforced as minimum for all body copy
- Disabled states use `opacity-50` + `cursor-not-allowed`

---

## Gradient Recipes

```css
/* Hero background */
background: linear-gradient(160deg, #EFF6FF 0%, #F8FAFC 55%, #F0FDF4 100%);

/* Primary button */
background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);

/* Tech section */
background: linear-gradient(135deg, #1E40AF 0%, #1d4ed8 100%);

/* Result card — success */
background: linear-gradient(160deg, #F0FDF4 0%, #FFFFFF 45%);

/* Result card — danger */
background: linear-gradient(160deg, #FEF2F2 0%, #FFFFFF 45%);

/* Result card — warning */
background: linear-gradient(160deg, #FFFBEB 0%, #FFFFFF 45%);
```

---

## Recording State UI

The recording button is the app's signature element:

- **Idle:** 120px circle, brand gradient, mic icon (48px)
- **Recording:** 120px circle, red (#DC2626), stop icon (40px) + 3 concentric pulse rings
- **Timer:** JetBrains Mono, 48px, tabular-nums, red
- **Rings:** `animate-pulse-ring` (2s), `animate-pulse-ring-2` (2s, delay 0.6s), `animate-pulse-ring-3` (2s, delay 1.2s)

This pattern appears in both `AudioRecorder.tsx` and `analyze/page.tsx`.
