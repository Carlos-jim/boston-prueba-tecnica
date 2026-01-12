/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Mapeando variables anteriores a Tailwind extended colors
        "bg-main": "#f3f4f6", // var(--bg-main)
        "bg-card": "#ffffff", // var(--bg-card)
        "text-primary": "#111827", // var(--text-primary)
        "text-secondary": "#6b7280", // var(--text-secondary)
        "border-color": "#e5e7eb", // var(--border-color)
        primary: {
          DEFAULT: "#3b82f6", // var(--primary)
          light: "#60a5fa",
        },
        success: "#10b981", // var(--success)
        danger: "#ef4444", // var(--danger)
        warning: "#f59e0b", // var(--warning)
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)", // var(--shadow-sm)
      },
    },
  },
  plugins: [],
};
