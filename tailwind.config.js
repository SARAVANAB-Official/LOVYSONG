/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#050607',
          900: '#0a0b0d',
          850: '#0e1013',
          800: '#121417',
          700: '#191c20',
          600: '#22262c',
          500: '#2f343b',
        },
        brand: {
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          dim: 'rgba(16,185,129,0.14)',
          fog: 'rgba(16,185,129,0.08)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 24px 70px -24px rgba(16,185,129,0.5)',
        soft: '0 24px 60px -28px rgba(0,0,0,0.85)',
        card: '0 12px 40px -20px rgba(0,0,0,0.9)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        eq: {
          '0%,100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.3s ease both',
        eq: 'eq 0.9s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
