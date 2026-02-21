import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json([], { status: 200 });
  }
  const orders = await prisma.order.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: { restaurant: { select: { slug: true, name: true } } },
    take: 50,
  });
  return NextResponse.json(orders);
}
