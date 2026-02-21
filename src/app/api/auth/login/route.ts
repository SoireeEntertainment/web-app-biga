import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authLoginSchema } from "@/lib/validations";
import { createSession, verifyPassword } from "@/lib/auth";
import { getSessionCookieName, getSessionMaxAge } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = authLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Email e password richiesti" },
      { status: 400 }
    );
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json(
      { error: "Credenziali non valide" },
      { status: 401 }
    );
  }
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
