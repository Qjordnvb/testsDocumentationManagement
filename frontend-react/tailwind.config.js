/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#667eea',
          purple: '#764ba2',
        },
        status: {
          success: '#10b981',
          warning: '#fbbf24',
          error: '#ef4444',
          info: '#3b82f6',
        },
        priority: {
          critical: '#dc2626',
          high: '#f97316',
          medium: '#eab308',
          low: '#6b7280',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
