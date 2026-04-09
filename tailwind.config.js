/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        card: 'var(--color-card)',
        'card-highlight': 'var(--color-card-highlight)',
        border: 'var(--color-border)',
        'border-accent': 'var(--color-border-accent)',
        teal: 'var(--color-teal)',
        emerald: 'var(--color-emerald)',
        red: 'var(--color-red)',
        amber: 'var(--color-amber)',
        text: 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
        'text-dim': 'var(--color-text-dim)',
      },
    },
  },
  plugins: [],
}
