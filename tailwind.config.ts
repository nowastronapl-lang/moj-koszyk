import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: { light: '#F7F8FA', dark: '#111315' },
        card: { light: '#FFFFFF', dark: '#1A1D20' },
        border: { light: '#E6E8EC', dark: '#2A2D32' },
        txt: {
          primary: { light: '#17181A', dark: '#F5F5F5' },
          secondary: { light: '#737780', dark: '#9A9EA6' },
        },
        brand: {
          green: '#16A34A',
          warning: '#F59E0B',
          error: '#DC2626',
          info: '#2563EB',
        },
      },
      borderRadius: {
        card: '16px',
        btn: '12px',
        input: '12px',
        badge: '999px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;