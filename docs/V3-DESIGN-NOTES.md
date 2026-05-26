# V3-DESIGN-NOTES.md — Visual System From v3

Extracted from the v3 codebase (`v3-archive/client/`) so v4 can match the existing brand. Reference this when styling new components.

---

## Logo Assets (Copied To `public/`)

The v3 logo is a teardrop / map-pin shape with a circular cutout — represents both "location pin" (for remote work) and the letter R. Available in v4 at:

| File | Use |
|---|---|
| `public/v3-logo.svg` | Logo mark only (dark, on light backgrounds) |
| `public/v3-logo-with-text.svg` | Logo + "RemoteRep" wordmark (dark) |
| `public/v3-white-logo.svg` | Logo mark only (white, on dark backgrounds) |
| `public/v3-white-logo-with-text.svg` | Logo + wordmark (white) |
| `public/v3-white-logo-with-text.png` | Raster fallback for the white version |
| `public/v3-favicon.ico` | v3's favicon (use as v4 favicon for now) |

> 💡 **Naming note:** Files are prefixed `v3-` to mark their origin. When v4 has its own refined logo (if/when), drop the prefix.

---

## Color Palette

### Core brand
| Token | Hex | Use |
|---|---|---|
| **Primary** | `#004FBE` | Main brand blue. Primary buttons, links, focus rings. |
| **Primary Blue** | `#0079FE` | Lighter, more vibrant blue. Used for "bookmarked" status, accents. |
| **Secondary** | `#FBDC3B` | Brand yellow. Highlights, badges, callouts. |

### UI / status
| Token | Hex | Use |
|---|---|---|
| Success | `#22C55E` | Confirmed states, "active" badges |
| Warning | `#EAB308` | Caution states |
| Danger | `#EF4444` | Errors, destructive actions |

### Layout / background
| Token | Hex | Use |
|---|---|---|
| Side menu | `#141F40` | Dark blue nav background |
| Dark foreground | `#101936` | Dark mode primary surface |
| Light foreground | `#172349` | Dark mode secondary surface |
| Dark background | `#080E24` | Darkest background layer (almost black) |
| Background | `#F2F2F2` | Light mode page background |
| Second background | `#E7E7E7` | Light mode card / section background |
| Field outline | `#2A306D` | Form input borders |

### Text greys
| Token | Hex | Use |
|---|---|---|
| Light grey | `#818594` | Muted text |
| Dark text grey | `#BDBDBD` | Secondary text on dark backgrounds |
| Text grey | `#818594` | Standard muted text |
| Mid blue | `#3F5296` | Subdued blue accent |

### Application status colors (used on candidate cards / pipeline)
| Status | Hex | Box-shadow glow |
|---|---|---|
| Bookmarked | `#0079FE` (blue) | `0 0 15px rgba(242, 201, 76, 0.15)` |
| Invited | `#F2994A` (orange) | `0 0 15px rgba(242, 153, 74, 0.15)` |
| Applied | `#F2C94C` (yellow) | `0 0 15px rgba(242, 201, 76, 0.15)` |
| Interviewing | `#27AE60` (green) | `0 0 15px rgba(39, 174, 96, 0.15)` |
| Shortlisted | `#9B51E0` (purple) | `0 0 15px rgba(155, 81, 224, 0.15)` |
| Hired | `#56CCF2` (light blue) | `0 0 15px rgba(86, 204, 242, 0.15)` |
| Subscribed | `#DA3E3E` (red) | n/a (used on subscription expired) |
| Rating | `#F0A044` (amber) | n/a (used on star ratings) |

### Semantic colored backgrounds (subtle tinted blocks)
| Token | Color | Use |
|---|---|---|
| Green text | `#27AE60` | Success messages |
| Green background | `#6FCF97` (with 0.2 alpha variant) | Success block backgrounds |
| Red text | `#DA3E3E` | Error text |
| Red background | `#DA3E3E` (with 0.2 alpha variant) | Error block backgrounds |

---

## Typography

- **Font family:** `Inter var` (Inter Variable), with system-ui fallbacks (Tailwind defaults)
- Loaded via Google Fonts or a CDN — v4 should use `next/font/google` with Inter for performance
- v3 used the variable axis features (weights interpolated, not specific weights only)

---

## Dark Mode

v3 supports dark mode via the `class` strategy:
- Tailwind config: `darkMode: 'class'`
- Toggle by adding `dark` class to `<html>` (not auto-detected from system)
- Light mode default; user can opt in

v4 currently uses Next.js's default (system preference). Decision to make: keep auto, or copy v3's manual toggle pattern?

---

## Tailwind Plugins v3 Used

- `@tailwindcss/forms` — better default form styling
- `tailwind-scrollbar` — styled scrollbars

v4 is on Tailwind v4 which has different patterns:
- Forms: still install `@tailwindcss/forms` if needed
- Scrollbar styling: built-in CSS support now; plugin may not be needed

---

## How To Apply This To v4 (Future Session)

v4 uses Tailwind v4 which uses CSS-based config (not JS). The color palette goes in `src/app/globals.css` like this:

```css
@import "tailwindcss";

@theme {
  /* Brand */
  --color-primary: #004FBE;
  --color-secondary: #FBDC3B;
  --color-primary-blue: #0079FE;

  /* Status */
  --color-success: #22C55E;
  --color-warning: #EAB308;
  --color-danger: #EF4444;

  /* Application status */
  --color-bookmarked: #0079FE;
  --color-invited: #F2994A;
  --color-applied: #F2C94C;
  --color-interviewing: #27AE60;
  --color-shortlisted: #9B51E0;
  --color-hired: #56CCF2;
  --color-subscribed: #DA3E3E;

  /* Layout */
  --color-side-menu: #141F40;
  --color-dark-foreground: #101936;
  --color-dark-background: #080E24;
  --color-light-grey: #818594;
  --color-field-outline: #2A306D;

  /* Typography */
  --font-sans: "Inter Variable", ui-sans-serif, system-ui, sans-serif;
}
```

Then classes like `bg-primary`, `text-bookmarked`, `border-field-outline`, etc. all work in JSX.

For the Inter font, replace the current Geist setup in `src/app/layout.tsx`:

```typescript
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});
```

And use `className={inter.variable}` on `<html>`.

---

## What's NOT Captured Here

Things to refine when actually doing the design pass:
- Specific component patterns (button sizes, card padding, modal layouts) — would need to read v3 components
- Animation/transition timings
- Spacing scale customizations (v3 may have extended Tailwind's defaults)
- Specific layouts (sidebar widths, header heights, etc.)

These can be extracted on-demand when implementing each v4 feature; the global palette + logo above is the foundation.
