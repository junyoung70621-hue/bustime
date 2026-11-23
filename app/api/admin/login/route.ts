import { NextRequest } from "next/server";
import { passwordLogin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export function POST(req: NextRequest) {
  return passwordLogin(req, "admin");
}
