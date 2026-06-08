import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

// 한글 폰트 self-host (PDF 캡처 시 글자 결정성 + 기기 무관 동일 렌더링)
const noto = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto",
  display: "swap",
});

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
  themeColor: "#D60051",
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
    <html lang="ko" className={noto.variable}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
