import type { Metadata } from "next";
import AppChrome from "@/components/AppChrome";
import GosiList from "./GosiList";

export const metadata: Metadata = {
  title: "대폐차(고속/시외) - ATEC",
};

export default function Page() {
  return (
    <AppChrome>
      <main className="safe-x safe-top safe-bottom mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col gap-3 pt-1">
        <GosiList />
      </main>
    </AppChrome>
  );
}
