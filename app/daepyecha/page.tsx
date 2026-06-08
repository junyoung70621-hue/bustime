import type { Metadata } from "next";
import AppChrome from "@/components/AppChrome";
import DaepyechaTabs from "./DaepyechaTabs";

export const metadata: Metadata = {
  title: "대폐차 - ATEC",
};

export default function Page() {
  return (
    <AppChrome>
      <DaepyechaTabs />
    </AppChrome>
  );
}
