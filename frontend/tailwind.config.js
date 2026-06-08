/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#152033",
        muted: "#64748b",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(79, 70, 229, 0.12)",
      },
    },
  },
  plugins: [],
};
