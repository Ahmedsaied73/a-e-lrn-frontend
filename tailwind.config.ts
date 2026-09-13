import type { Config } from 'tailwindcss';
import { primary, secondary, tertiary, surface, onSurface, outline, error as errorColors, dark as darkColors } from './lib/colors';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Legacy (keep for backward compat)
        primary: 'hsl(var(--primary))',
        secondary: 'hsl(var(--secondary))',

        // Design System — Surface
        surface: surface.DEFAULT,
        'surface-dim': surface.dim,
        'surface-bright': surface.bright,
        'surface-container-lowest': surface.containerLowest,
        'surface-container-low': surface.containerLow,
        'surface-container': surface.container,
        'surface-container-high': surface.containerHigh,
        'surface-container-highest': surface.containerHighest,
        'surface-variant': surface.variant,
        'surface-white': surface.white,

        // Design System — On-Surface
        'on-surface': onSurface.DEFAULT,
        'on-surface-variant': onSurface.variant,
        'inverse-surface': onSurface.inverse,
        'inverse-on-surface': onSurface.inverseOn,

        // Design System — Outline
        outline: outline.DEFAULT,
        'outline-variant': outline.variant,
        'outline-border': outline.border,

        // Design System — Dark surfaces (dropdowns, overlays only)
        dark: darkColors.bg,
        'dark-hover': darkColors.hover,
        'dark-border': darkColors.border,
        'dark-gray400': darkColors.gray400,

        // Design System — Primary
        'primary-color': primary.DEFAULT,
        'primary-hover': primary.hover,
        'primary-light': primary.light,
        'primary-pale': primary.pale,
        'on-primary': primary.onPrimary,
        'primary-container': primary.container,
        'on-primary-container': primary.onContainer,
        'inverse-primary': primary.fixedDim,
        'primary-fixed': primary.fixed,
        'primary-fixed-dim': primary.fixedDim,
        'on-primary-fixed': primary.onFixed,
        'on-primary-fixed-variant': primary.onFixedVariant,
        'surface-tint': primary.tint,

        // Design System — Secondary
        'secondary-color': secondary.DEFAULT,
        'secondary-container': secondary.container,
        'on-secondary': secondary.onSecondary,
        'on-secondary-container': secondary.onContainer,
        'secondary-fixed': secondary.fixed,
        'secondary-fixed-dim': secondary.fixedDim,
        'on-secondary-fixed': secondary.onFixed,
        'on-secondary-fixed-variant': secondary.onFixedVariant,

        // Design System — Tertiary
        tertiary: tertiary.DEFAULT,
        'tertiary-container': tertiary.container,
        'on-tertiary': tertiary.onTertiary,
        'on-tertiary-container': tertiary.onContainer,
        'tertiary-fixed': tertiary.fixed,
        'tertiary-fixed-dim': tertiary.fixedDim,
        'on-tertiary-fixed': tertiary.onFixed,
        'on-tertiary-fixed-variant': tertiary.onFixedVariant,

        // Design System — Error
        error: errorColors.DEFAULT,
        'on-error': errorColors.onError,
        'error-container': errorColors.container,
        'on-error-container': errorColors.onContainer,

        // Design System — Background
        'on-background': onSurface.DEFAULT,

        // Shadcn token set — CSS-variable backed so the admin console can
        // redefine them locally (`.admin-console`) without touching the
        // student-facing light theme.
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        popover: 'hsl(var(--popover))',
        'popover-foreground': 'hsl(var(--popover-foreground))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        'secondary-foreground': 'hsl(var(--secondary-foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
        destructive: 'hsl(var(--destructive))',
        'destructive-foreground': 'hsl(var(--destructive-foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      spacing: {
        base: '4px',
        xs: '8px',
        sm: '16px',
        md: '24px',
        lg: '40px',
        xl: '64px',
        gutter: '24px',
        'margin-mobile': '16px',
        'margin-desktop': '48px',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm: '0.25rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      fontFamily: {
        sans: ['Cairo', 'sans-serif'],
        cairo: ['Cairo', 'sans-serif'],
        mono: ['Fira Code', 'Fira Sans', 'monospace'],
        code: ['Fira Code', 'Fira Sans', 'monospace'],
      },
      fontSize: {
        'headline-xl': ['48px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' }],
        'headline-xl-mobile': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '1.3', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'label-md': ['14px', { lineHeight: '1', fontWeight: '600', letterSpacing: '0.05em' }],
        caption: ['12px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      boxShadow: {
        'level-1': '0px 0px 0px 1px #E1E8F0',
        'level-2': '0px 4px 20px rgba(0, 0, 0, 0.04)',
        'level-3': '0px 12px 32px rgba(0, 0, 0, 0.08)',
        'primary-glow': '0px 4px 20px rgba(32, 123, 255, 0.3)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;