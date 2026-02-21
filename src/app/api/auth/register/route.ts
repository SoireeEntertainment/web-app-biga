import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authRegisterSchema } from "@/lib/validations";
import { createSession, hashPassword } from "@/lib/auth";
import { getSessionCookieName, getSessionMaxAge } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = authRegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
      { status: 400 }
    );
  }
  const { email, password, name } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Email già registrata" },
      { status: 409 }
    );
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name: name ?? null },
  });
  const token = await createSession(user.id);
  const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  res.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: getSessionMaxAge(),
    path: "/",
  });
  return res;
}
