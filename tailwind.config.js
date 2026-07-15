/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        hull: {
          950: '#081522',
          900: '#0B1E33',
          800: '#122C48',
          700: '#1B3F63',
        },
        wake: {
          600: '#0F4C5C',
          500: '#146B7E',
          400: '#3E93A3',
        },
        brass: {
          600: '#8C6A1E',
          500: '#B8892B',
          400: '#D3A94F',
          200: '#F0DFB3',
        },
        foam: {
          50: '#FBFCFB',
          100: '#F4F7F6',
          200: '#E7ECEA',
        },
        slate: {
          600: '#3D4B54',
          500: '#57666F',
          400: '#7C8A92',
        },
        signal: {
          red: '#B3423B',
          green: '#2E7D5B',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        body: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        wake: "linear-gradient(90deg, transparent 0%, rgba(184,137,43,0.55) 20%, rgba(184,137,43,0.55) 80%, transparent 100%)",
      },
    },
  },
  plugins: [],
}
