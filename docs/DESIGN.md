---
name: Academic Precision
colors:
  surface: '#f7f9fc'
  surface-dim: '#d8dadd'
  surface-bright: '#f7f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f7'
  surface-container: '#eceef1'
  surface-container-high: '#e6e8eb'
  surface-container-highest: '#e0e3e6'
  on-surface: '#191c1e'
  on-surface-variant: '#414754'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f4'
  outline: '#727786'
  outline-variant: '#c1c6d7'
  surface-tint: '#005ac5'
  primary: '#0057c0'
  on-primary: '#ffffff'
  primary-container: '#006ff0'
  on-primary-container: '#fefcff'
  inverse-primary: '#aec6ff'
  secondary: '#0061a7'
  on-secondary: '#ffffff'
  secondary-container: '#4da4fe'
  on-secondary-container: '#003965'
  tertiary: '#1a59b6'
  on-tertiary: '#ffffff'
  tertiary-container: '#3d72d0'
  on-tertiary-container: '#fefcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#aec6ff'
  on-primary-fixed: '#001a43'
  on-primary-fixed-variant: '#004397'
  secondary-fixed: '#d2e4ff'
  secondary-fixed-dim: '#a1c9ff'
  on-secondary-fixed: '#001c37'
  on-secondary-fixed-variant: '#00487f'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#aec6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#f7f9fc'
  on-background: '#191c1e'
  surface-variant: '#e0e3e6'
typography:
  headline-xl:
    fontFamily: Cairo
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Cairo
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Cairo
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Cairo
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Cairo
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Cairo
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Cairo
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  caption:
    fontFamily: Cairo
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

This design system is engineered for high-performance online learning environments. It balances the rigor of academic institutions with the accessibility of modern SaaS. The brand personality is authoritative yet encouraging, aiming to evoke a sense of clarity, focus, and progress.

The design style follows a **Corporate / Modern** aesthetic with subtle **Minimalist** influences. It prioritizes content hierarchy and legibility, using generous whitespace to reduce cognitive load during intensive study sessions. Visual interest is generated through precise geometry and a purposeful use of the primary blue to guide user action.

## Colors

The palette is anchored by a vibrant digital blue, chosen for its association with intelligence and trust. 

- **Primary (#207BFF):** Used for main actions, active states, and brand-critical elements.
- **Secondary (#4EA5FF):** Employed for accents, secondary buttons, and progress indicators to provide a lighter visual touch.
- **Tertiary (#1556B3):** A deeper shade for hover states and high-contrast text on light backgrounds.
- **Neutral (#F5F7FA):** The foundation for the UI; used for page backgrounds and large container surfaces to maintain a clean, "paper-like" digital workspace.
- **Semantic Colors:** Success (Emerald), Warning (Amber), and Error (Crimson) should be desaturated to fit the professional tone of the system.

## Typography

The design system utilizes **Cairo** exclusively across all levels to ensure a unified, modern voice. Cairo's wide range of weights and its clean, geometric construction make it ideal for both large-scale headlines and dense instructional text.

- **Headlines:** Use Bold (700) or SemiBold (600) weights. High-level titles should utilize slight negative letter-spacing to appear more cohesive.
- **Body Text:** Standardized at 16px for optimal readability. Use a line height of 1.6 to ensure text-heavy course modules remain approachable.
- **Labels:** Use SemiBold with uppercase transformation for metadata, categories, and small navigational cues.

## Layout & Spacing

The layout is built on a **12-column fluid grid** for desktop and a **4-column grid** for mobile devices. 

- **Desktop (1280px+):** Max-width containers centered with 48px outside margins. 24px gutters between columns.
- **Tablet (768px - 1279px):** Fluid width with 32px margins.
- **Mobile (Up to 767px):** 16px margins.
- **Spacing Rhythm:** A base-4 scale is strictly followed. Components use `md` (24px) padding for primary containers and `sm` (16px) for internal elements. Vertical rhythm between sections should typically be `lg` or `xl` to define clear thematic boundaries.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layers** and extremely soft, **Ambient Shadows**. This approach maintains the clean, flat aesthetic of modern SaaS while providing enough depth to signify interactivity.

- **Level 0 (Base):** Neutral background (#F5F7FA).
- **Level 1 (Cards/Surface):** Pure White (#FFFFFF) with a 1px border in #E1E8F0. No shadow.
- **Level 2 (Interactive):** Pure White with a soft, diffused shadow (0px 4px 20px rgba(0, 0, 0, 0.04)). Used for course cards and dropdowns.
- **Level 3 (Overlays):** Modals and flyouts use a slightly more pronounced shadow (0px 12px 32px rgba(0, 0, 0, 0.08)) to focus the user's attention.

## Shapes

The shape language is **Rounded**, reflecting an approachable and modern learning environment. 

- **Standard Elements:** Buttons, input fields, and cards utilize a 0.5rem (8px) corner radius.
- **Large Containers:** Hero sections and large instructional blocks use 1rem (16px) to feel more integrated and soft.
- **Small Elements:** Tooltips and tags may use 0.25rem (4px) for precision.

## Components

### Buttons
- **Primary:** Solid #207BFF with white text. 8px radius.
- **Secondary:** Transparent with #207BFF border and text.
- **Ghost:** No background or border; text-only using Primary blue.

### Input Fields
- White background with a 1px border (#E1E8F0). On focus, the border changes to Primary (#207BFF) with a subtle blue glow (shadow). Labels are always positioned above the field.

### Course Cards
- White background, Level 2 elevation (soft shadow), 16px internal padding. Featured images at the top should have the top corners rounded to 16px to match the container.

### Chips & Progress Bars
- **Chips:** Light tint of the primary color (#E8F2FF) with primary color text.
- **Progress Bars:** Background in Neutral (#F5F7FA) with a Secondary blue (#4EA5FF) fill. Bars are 8px height with fully rounded (pill) ends.

### Lists
- Instructional lists should use the Secondary blue for bullet points or numbering to maintain visual interest without being distracting.