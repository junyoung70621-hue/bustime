import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "버스 종점 도착 대시보드",
  description: "차량번호 기반 종점 도착 시간(ETA) 계산 - 티머니 A/S용",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
