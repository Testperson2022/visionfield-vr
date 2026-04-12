/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        triage: {
          normal: "#22c55e",
          borderline: "#eab308",
          abnormal: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};
