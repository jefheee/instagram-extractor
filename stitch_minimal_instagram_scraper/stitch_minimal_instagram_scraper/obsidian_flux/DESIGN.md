---
name: Obsidian Flux
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#bfc7d4'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#89919e'
  outline-variant: '#3f4752'
  surface-tint: '#9ecaff'
  primary: '#9ecaff'
  on-primary: '#003258'
  primary-container: '#0095f6'
  on-primary-container: '#002b4d'
  inverse-primary: '#0061a3'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#c8c6c5'
  on-tertiary: '#303030'
  tertiary-container: '#929090'
  on-tertiary-container: '#2a2a2a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d1e4ff'
  primary-fixed-dim: '#9ecaff'
  on-primary-fixed: '#001d36'
  on-primary-fixed-variant: '#00497d'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e4e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1b1c1c'
  on-tertiary-fixed-variant: '#474746'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.5'
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 16px
  margin-safe: 24px
---

## Brand & Style

This design system is engineered for efficiency, targeting developers and power users who prioritize speed and data density over visual fluff. The personality is "Tactical Minimalist"—utilitarian, precise, and authoritative. It draws from **Minimalism** and **Corporate Modern** styles but adds a developer-centric edge through high-contrast typography and monospaced technical accents.

The emotional response should be one of "controlled power." By using a true-black background and electric blue accents, the UI recedes into the hardware, making the content and terminal data the sole focus. The visual language is strictly flat, using hair-line borders rather than shadows to define structure, ensuring the interface feels lightweight and performative.

## Colors

The palette is anchored in a "True Dark" philosophy. The base surface uses a deep black to maximize contrast and reduce eye strain during long-form technical sessions.

- **Primary:** Electric Blue is reserved strictly for primary actions, success states, and critical progress indicators.
- **Surface Scale:** We use a monochromatic layering system. `#050505` for the background, `#1a1a1a` for cards/containers, and `#262626` for interactive states like hover.
- **Borders:** Subtle borders (`#333333`) provide the primary means of separation in the absence of shadows.
- **Text:** Pure white is used for headings to ensure maximum readability, while a muted grey is used for secondary metadata to maintain visual hierarchy.

## Typography

The system utilizes a dual-font strategy to balance approachability with technical precision.

- **UI & Content:** `Hanken Grotesk` provides a sharp, contemporary sans-serif feel that remains highly legible even at small sizes. Headings use tighter tracking and heavier weights to command attention.
- **Technical Data:** `JetBrains Mono` is used for all "output" data, including CLI snippets, paths, file sizes, and status labels. This creates a clear mental shift for the user between "navigating the app" and "reviewing the data."
- **Mobile Scaling:** Headlines scale down by 20% on mobile devices, while code snippets maintain their size but enable horizontal scrolling to preserve formatting integrity.

## Layout & Spacing

This design system employs a **Fluid Grid** model with a strictly enforced 4px baseline rhythm. 

- **Density:** High information density is a priority. Containers use compact internal padding (`16px`) to allow more data to fit on-screen.
- **Grid:** A 12-column grid is used for desktop layouts. On tablet, this shifts to 6 columns, and 2 columns on mobile.
- **Terminal Logic:** The layout often features a "Side-car" terminal view. On desktop, this is a fixed-width right panel (320px-400px). On mobile, this collapses into a bottom-sheet drawer.
- **Reflow:** For documentation-heavy pages, content is capped at a max-width of `800px` for readability, centered within the fluid viewport.

## Elevation & Depth

To maintain the "Obsidian" aesthetic, traditional shadows are strictly prohibited. Depth is instead communicated through **Tonal Layering** and **Line Art**.

1.  **Level 0 (Background):** Pure black `#050505`.
2.  **Level 1 (Cards/Sidebar):** Surface grey `#1a1a1a` with a 1px solid border of `#333333`.
3.  **Level 2 (Modals/Popovers):** Surface grey `#262626` with a slightly brighter border `#444444`.

Interactive elements do not "lift" off the page; instead, they change their border color or background brightness to signify state changes. This flat hierarchy keeps the focus on the data and maintains a "pro-tool" feel.

## Shapes

The shape language is "Soft-Mechanical." We avoid the friendliness of large rounded corners in favor of a precision-engineered look.

- **Base Radius:** `4px` (Soft) is the standard for buttons, inputs, and small containers.
- **Large Components:** `8px` is used for primary dashboard cards and modals.
- **Icons:** Line-based icons with a 2px stroke weight. Avoid filled icons unless used for a toggle-active state.

## Components

- **Buttons:** 
  - *Primary:* Solid Electric Blue background, white text, bold weight.
  - *Secondary:* Transparent background, `#333333` border, white text. Hover state brightens border to `#0095f6`.
- **Input Fields:** Dark background (`#050505`), 1px border. On focus, the border turns Electric Blue. Use Monospace font for inputs involving paths or handles.
- **Chips/Status:** Small, monospace text with a subtle background tint (e.g., Success = Dark Green background, Light Green text). No borders.
- **Terminal Component:** A specialized container using a black background, no rounded corners (sharp), and a 1px top-border only. Internal padding of 12px.
- **Lists:** Clean rows with 1px bottom separators. Hover state triggers a subtle background shift to `#1a1a1a`.
- **Checkboxes/Radios:** Square-ish (2px radius) to match the mechanical aesthetic. Electric Blue fill when active.