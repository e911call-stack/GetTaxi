/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        taxi: {
          yellow: '#FFD700',
          'yellow-deep': '#F5C000',
          'yellow-glow': '#FFE55C',
          black: '#0A0A0A',
          'black-soft': '#1A1A1A',
          'black-mid': '#2A2A2A',
          gray: '#3A3A3A',
          'gray-light': '#888888',
          white: '#F8F4E8',
          'white-pure': '#FFFFFF',
          red: '#E63946',
          green: '#2DC653',
        },
      },
      fontFamily: {
        arabic: ['"Cairo"', '"Noto Kufi Arabic"', 'sans-serif'],
        latin: ['"Bebas Neue"', '"Barlow Condensed"', 'sans-serif'],
        body: ['"IBM Plex Sans Arabic"', '"IBM Plex Sans"', 'sans-serif'],
      },
      backgroundImage: {
        'taxi-gradient': 'linear-gradient(135deg, #FFD700 0%, #F5C000 50%, #E6A800 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0A0A0A 0%, #1A1A0A 100%)',
        'checker': 'repeating-conic-gradient(#FFD700 0% 25%, #0A0A0A 0% 50%)',
      },
      animation: {
        'pulse-yellow': 'pulse-yellow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.6s ease-out',
        'checker-scroll': 'checker-scroll 20s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'pulse-yellow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255,215,0,0.3)' },
          '50%': { boxShadow: '0 0 60px rgba(255,215,0,0.8), 0 0 100px rgba(255,215,0,0.3)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'slide-up': {
          from: { transform: 'translateY(30px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'glow': {
          from: { textShadow: '0 0 10px rgba(255,215,0,0.5)' },
          to: { textShadow: '0 0 30px rgba(255,215,0,1), 0 0 60px rgba(255,215,0,0.5)' },
        },
      },
      boxShadow: {
        'yellow-sm': '0 2px 10px rgba(255,215,0,0.2)',
        'yellow-md': '0 4px 20px rgba(255,215,0,0.4)',
        'yellow-lg': '0 8px 40px rgba(255,215,0,0.6)',
        'yellow-xl': '0 0 80px rgba(255,215,0,0.4)',
      },
    },
  },
  plugins: [],
}
