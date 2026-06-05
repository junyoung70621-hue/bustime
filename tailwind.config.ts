import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ATEC 모빌리티 브랜드 크림슨 (로고 추출색 #D60051 기준)
        brand: {
          50: "#FDE9F0",
          100: "#FBD0E0",
          200: "#F5A3C0",
          500: "#E5005A",
          600: "#D60051", // primary (로고 정확색)
          700: "#B00043", // hover
          800: "#8A0035",
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
