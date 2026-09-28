import type { Config } from 'tailwindcss';

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
        primary: '#207bff',
        secondary: '#4ea5ff',

        // Design System — Surface
        background: '#f7f9fc',
        surface: '#f7f9fc',
        'surface-dim': '#d8dadd',
        'surface-bright': '#f7f9fc',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f2f4f7',
        'surface-container': '#eceef1',
        'surface-container-high': '#e6e8eb',
        'surface-container-highest': '#e0e3e6',
        'surface-variant': '#e0e3e6',

        // Design System — On-Surface
        'on-surface': '#191c1e',
        'on-surface-variant': '#414754',
        'inverse-surface': '#2d3133',
        'inverse-on-surface': '#eff1f4',

        // Design System — Outline
        outline: '#727786',
        'outline-variant': '#c1c6d7',

        // Design System — Primary
        'primary-color': '#207bff',
        'on-primary': '#ffffff',
        'primary-container': '#006ff0',
        'on-primary-container': '#fefcff',
        'inverse-primary': '#aec6ff',
        'primary-fixed': '#d8e2ff',
        'primary-fixed-dim': '#aec6ff',
        'on-primary-fixed': '#001a43',
        'on-primary-fixed-variant': '#004397',
        'surface-tint': '#005ac5',

        // Design System — Secondary
        'secondary-color': '#0061a7',
        'secondary-container': '#4da4fe',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#003965',
        'secondary-fixed': '#d2e4ff',
        'secondary-fixed-dim': '#a1c9ff',
        'on-secondary-fixed': '#001c37',
        'on-secondary-fixed-variant': '#00487f',

        // Design System — Tertiary
        tertiary: '#1a59b6',
        'tertiary-container': '#3d72d0',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#fefcff',
        'tertiary-fixed': '#d8e2ff',
        'tertiary-fixed-dim': '#aec6ff',
        'on-tertiary-fixed': '#001a42',
        'on-tertiary-fixed-variant': '#004395',

        // Design System — Error
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',

        // Design System — Background
        'on-background': '#191c1e',
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