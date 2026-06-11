/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1A5DC8',
          dark: '#12489E',
          soft: '#EAF2FC',
        },
        accent: {
          DEFAULT: '#D41876',
          dark: '#B01262',
          soft: '#FDEEF5',
        },
        dark: '#16243A',
        light: '#EFF5FB',
        sand: '#FAF4EA',
        teal: '#0D9488',
        success: '#16A34A',
      },
      fontSize: {
        body: ['18px', { lineHeight: '1.8' }],
      },
      spacing: {
        touch: '48px',
        'touch-lg': '56px',
      },
      boxShadow: {
        card: '0 1px 2px rgb(22 36 58 / 0.04), 0 8px 24px -8px rgb(22 36 58 / 0.10)',
        'card-hover': '0 2px 4px rgb(22 36 58 / 0.05), 0 24px 48px -16px rgb(22 36 58 / 0.22)',
        cta: '0 8px 24px -8px rgb(212 24 118 / 0.45)',
        'cta-blue': '0 8px 24px -8px rgb(26 93 200 / 0.45)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
