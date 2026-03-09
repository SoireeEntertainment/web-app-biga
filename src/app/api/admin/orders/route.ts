import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const source = searchParams.get("source");
  const deliverySlot = searchParams.get("deliverySlot");
  const slotRange = searchParams.get("slotRange");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const restaurantId = searchParams.get("restaurantId");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (source) where.source = source;
  if (restaurantId) where.restaurantId = restaurantId;
  if (deliverySlot) where.deliverySlot = deliverySlot;
  if (slotRange === "19") {
    where.deliverySlot = { startsWith: "19:" };
  } else if (slotRange === "20") {
    where.deliverySlot = { startsWith: "20:" };
  }
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
      restaurant: { select: { slug: true, name: true, phone: true } },
    },
    take: 200,
  });
  return NextResponse.json(orders);
}
