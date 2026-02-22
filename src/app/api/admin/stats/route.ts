import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "7"; // 1, 7, 30
  const days = parseInt(period, 10) || 7;
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since }, status: { not: "CANCELED" } },
    select: {
      totalCents: true,
      paymentMethod: true,
      paymentStatus: true,
      items: { select: { name: true, quantity: true } },
    },
  });

  const totalCents = orders.reduce((s: number, o: { totalCents: number }) => s + o.totalCents, 0);
  const count = orders.length;
  const aov = count > 0 ? Math.round(totalCents / count) : 0;

  const byPayment: Record<string, { count: number; cents: number }> = {};
  for (const o of orders) {
    const k = o.paymentMethod;
    if (!byPayment[k]) byPayment[k] = { count: 0, cents: 0 };
    byPayment[k].count += 1;
    byPayment[k].cents += o.totalCents;
  }

  const productCount: Record<string, number> = {};
  for (const o of orders) {
    for (const i of o.items) {
      productCount[i.name] = (productCount[i.name] ?? 0) + i.quantity;
    }
  }
  const topProducts = Object.entries(productCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, qty]) => ({ name, quantity: qty }));

  return NextResponse.json({
    period: days,
    orderCount: count,
    totalCents,
    aovCents: aov,
    byPaymentMethod: byPayment,
    topProducts,
  });
}
