import type { Metadata } from "next";
import AppChrome from "@/components/AppChrome";
import DaepyechaList from "./DaepyechaList";

export const metadata: Metadata = {
  title: "대폐차 자재 지급확인서 - ATEC",
};

export default function Page() {
  return (
    <AppChrome>
      <DaepyechaList />
    </AppChrome>
  );
}
