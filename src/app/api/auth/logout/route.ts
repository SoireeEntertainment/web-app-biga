import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession, getSessionCookieName } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (token) await deleteSession(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(getSessionCookieName(), "", { maxAge: 0, path: "/" });
  return res;
}
