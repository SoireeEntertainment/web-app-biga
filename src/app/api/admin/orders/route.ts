import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const restaurantId = searchParams.get("restaurantId");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (restaurantId) where.restaurantId = restaurantId;
  if (from || to) {
    where.createdAt = {};
    if (from) (where.createdAt as Record<string, Date>).gte = new Date(from);
    if (to) (where.createdAt as Record<string, Date>).lte = new Date(to);
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      restaurant: { select: { slug: true, name: true } },
    },
    take: 200,
  });
  return NextResponse.json(orders);
}
