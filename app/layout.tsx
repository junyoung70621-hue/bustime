import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ATEC 종점 도착 대시보드",
  description: "차량번호 기반 종점 도착 시간(ETA) 계산 - 티머니 단말기 A/S 지원",
  applicationName: "ATEC 종점도착",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ATEC 종점도착",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#A2324A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // 노치/세이프에어리어 대응
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
