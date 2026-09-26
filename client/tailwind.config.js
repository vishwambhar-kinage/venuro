/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bms: {
          red: '#f84464',
          redHover: '#e23754',
          redLight: '#fff0f2',
          header: '#333545',
          dark: '#22243a',
          bg: '#f5f5f7',
          card: '#ffffff',
          border: '#e5e7eb',
          text: '#222222',
          muted: '#666666',
          yellow: '#fbbf24',
          green: '#10b981',
        },
        brand: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f84464',
          600: '#e23754',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        }
      },
      fontFamily: {
        sans: ['Roboto', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'bms': '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
        'bms-lg': '0 8px 24px 0 rgba(0, 0, 0, 0.12)',
        'bms-card': '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
