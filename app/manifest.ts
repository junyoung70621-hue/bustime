import type { MetadataRoute } from "next";

// 홈 화면에 추가 시 전체화면(standalone)으로 실행되도록 하는 웹앱 매니페스트.
// 현장 기사님이 앱처럼 바로 띄워 쓸 수 있게 함.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ATEC 종점 도착 대시보드",
    short_name: "ATEC 종점도착",
    description: "차량번호 기반 종점 도착 시간(ETA) - 티머니 단말기 A/S 지원",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F4F3F8",
    theme_color: "#D60051",
    lang: "ko",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
