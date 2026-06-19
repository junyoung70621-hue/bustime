import type { Metadata } from "next";
import AppChrome from "@/components/AppChrome";
import RegionTabs from "./RegionTabs";

export const metadata: Metadata = {
  title: "대폐차(지역) - ATEC",
};

export default function Page() {
  return (
    <AppChrome>
      <RegionTabs />
    </AppChrome>
  );
}
