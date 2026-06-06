export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: 'var(--bg-main)',
          surface: 'var(--bg-card)',
          surfaceHighlight: '#2A303F',
          border: 'var(--border)',
          primary: 'var(--primary)',
          text: 'var(--text-main)',
          textMuted: 'var(--text-secondary)',
          success: 'var(--success)'
        }
      }
    },
  },
  plugins: [],
}
