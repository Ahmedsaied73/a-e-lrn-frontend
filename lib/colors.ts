/**
 * Single source of truth for the site-wide color palette.
 *
 * Every hex value used in tailwind.config.ts, globals.css, and components
 * should derive from here. CSS custom properties in globals.css must
 * duplicate these values (CSS can't import TS) — keep them in sync.
 *
 * "Academic Precision" design system — Stitch project 14391907357742829862
 */

// ── Helpers ──────────────────────────────────────────────────────
export function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Primary ──────────────────────────────────────────────────────
export const primary = {
  DEFAULT: '#207bff',
  hover: '#1a6bdf',
  dark: '#0057c0',
  light: '#4ea5ff',
  container: '#006ff0',
  fixed: '#d8e2ff',
  fixedDim: '#aec6ff',
  onPrimary: '#ffffff',
  onContainer: '#fefcff',
  onFixed: '#001a43',
  onFixedVariant: '#004397',
  tint: '#005ac5',
  pale: '#eef6ff',
  paleAlt: '#e8f2ff',
  glow: 'rgba(32, 123, 255, 0.3)',
};

// ── Secondary ────────────────────────────────────────────────────
export const secondary = {
  DEFAULT: '#0061a7',
  container: '#4da4fe',
  onSecondary: '#ffffff',
  onContainer: '#003965',
  fixed: '#d2e4ff',
  fixedDim: '#a1c9ff',
  onFixed: '#001c37',
  onFixedVariant: '#00487f',
};

// ── Tertiary ─────────────────────────────────────────────────────
export const tertiary = {
  DEFAULT: '#1a59b6',
  container: '#3d72d0',
  onTertiary: '#ffffff',
  onContainer: '#fefcff',
  fixed: '#d8e2ff',
  fixedDim: '#aec6ff',
  onFixed: '#001a42',
  onFixedVariant: '#004395',
};

// ── Surface / Background ─────────────────────────────────────────
export const surface = {
  DEFAULT: '#f7f9fc',
  dim: '#d8dadd',
  bright: '#f7f9fc',
  containerLowest: '#ffffff',
  containerLow: '#f2f4f7',
  container: '#eceef1',
  containerHigh: '#e6e8eb',
  containerHighest: '#e0e3e6',
  variant: '#e0e3e6',
  white: '#ffffff',
};

// ── On-Surface (text) ───────────────────────────────────────────
export const onSurface = {
  DEFAULT: '#191c1e',
  variant: '#414754',
  inverse: '#2d3133',
  inverseOn: '#eff1f4',
};

// ── Outline / Border ─────────────────────────────────────────────
export const outline = {
  DEFAULT: '#727786',
  variant: '#c1c6d7',
  light: '#e1e8f0',
  border: '#e6e8eb',
};

// ── Error ────────────────────────────────────────────────────────
export const error = {
  DEFAULT: '#ba1a1a',
  onError: '#ffffff',
  container: '#ffdad6',
  onContainer: '#93000a',
};

// ── Semantic / Accent ────────────────────────────────────────────
export const success = {
  DEFAULT: '#61B846',
  hover: '#61B846CC', // 80% opacity
  text: '#16a34a',
};

// ── Dark-scheme surfaces (for dropdowns, overlays only) ──────────
export const dark = {
  bg: '#111827',
  card: '#1f2937',
  hover: '#2d3748',
  border: '#374151',
  gray700: '#374151',
  gray600: '#4b5563',
  gray400: '#9ca3af',
};

// ── Full palette export ──────────────────────────────────────────
export const colors = {
  primary,
  secondary,
  tertiary,
  surface,
  onSurface,
  outline,
  error,
  success,
  dark,
} as const;

export default colors;
