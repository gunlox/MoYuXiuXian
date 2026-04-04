/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'xian': {
          gold: '#d4a843',
          darkgold: '#b8860b',
          purple: '#8b5cf6',
          jade: '#2dd4bf',
          ink: '#1a1a2e',
          paper: '#16213e',
          scroll: '#0f3460',
        }
      },
      fontFamily: {
        'kai': ['Microsoft YaHei', '\u5fae\u8f6f\u96c5\u9ed1', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
