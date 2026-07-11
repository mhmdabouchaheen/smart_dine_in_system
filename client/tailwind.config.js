/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        noir: {
          950: '#0a0a0a',
          900: '#111110',
          850: '#161615',
          800: '#1c1c1a',
          700: '#2a2a27',
          600: '#3d3d38',
        },
        ember: {
          DEFAULT: '#E55A2B',
          light: '#F17A4E',
          dark: '#C2481F',
        },
        bone: {
          DEFAULT: '#F5F3EE',
          dim: '#B8B5AC',
          faint: '#7A7872',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.25em',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        emberPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(229,90,43,0.35)' },
          '50%': { boxShadow: '0 0 0 10px rgba(229,90,43,0)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both',
        emberPulse: 'emberPulse 2.4s ease-out infinite',
      },
    },
  },
  plugins: [],
}
