import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import AdminPanel from "./AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAuthed())) redirect("/admin/login");
  return <AdminPanel />;
}
