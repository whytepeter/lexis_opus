import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,html}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        s2: "var(--surface2)",
        s3: "var(--surface3)",
        b1: "var(--border)",
        b2: "var(--border2)",
        t1: "var(--text)",
        t2: "var(--text2)",
        t3: "var(--text3)",
        amber: "var(--amber)",
        amber2: "var(--amber2)",
        green: "var(--green)",
        red: "var(--red)",
        blue: "var(--blue)",
        purple: "var(--purple)",
      },
      fontFamily: {
        serif: ["Lora", "serif"],
        mono: ["IBM Plex Mono", "monospace"],
        sans: ["Lato", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
