import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f6f4ec",
        ink: "#112135",
        accent: {
          DEFAULT: "#0f766e",
          soft: "#d7f0eb"
        },
        coral: "#d97757",
        gold: "#e6b655",
        slate: "#5d6b7d"
      },
      boxShadow: {
        panel: "0 18px 60px rgba(17, 33, 53, 0.12)"
      },
      backgroundImage: {
        "hero-wash": "radial-gradient(circle at top left, rgba(230,182,85,0.22), transparent 34%), radial-gradient(circle at bottom right, rgba(15,118,110,0.18), transparent 36%)"
      }
    }
  },
  plugins: []
};

export default config;
