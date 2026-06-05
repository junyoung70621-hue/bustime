import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ATEC 모빌리티 브랜드 크림슨
        brand: {
          50: "#FBEEF1",
          100: "#F5DCE2",
          200: "#E9B9C5",
          500: "#B23A52",
          600: "#A2324A", // primary
          700: "#88293D", // hover
          800: "#6F2233",
        },
        // 연한 라벤더-그레이 캔버스
        canvas: "#F4F3F8",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
