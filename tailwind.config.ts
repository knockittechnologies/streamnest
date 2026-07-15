import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#0A0908',
        surface: '#141210',
        'surface-2': '#1B1815',
        text: '#F3EFE8',
        'text-dim': '#A69E90',
        'text-faint': '#6E675C',
        bronze: '#C9A25D',
        'bronze-2': '#8C5A3C',
        ice: '#6FE3D6',
        'ice-2': '#35505A',
        live: '#E63946',
        hair: 'rgba(245,240,232,0.1)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
};
export default config;
