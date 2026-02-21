import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeCustomerRecencyBadge } from "@/lib/recency";

export async function GET() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      customerPhone: true,
      customerName: true,
      customerEmail: true,
      id: true,
      totalCents: true,
      createdAt: true,
      status: true,
      type: true,
      restaurant: { select: { name: true } },
    },
  });
  const byPhone = new Map<
    string,
    { phone: string; name: string; email: string | null; orders: typeof orders }
  >();
  for (const o of orders) {
    const key = o.customerPhone;
    if (!byPhone.has(key)) {
      byPhone.set(key, {
        phone: o.customerPhone,
        name: o.customerName,
        email: o.customerEmail,
        orders: [],
      });
    }
    byPhone.get(key)!.orders.push(o);
  }
  const customers = Array.from(byPhone.values()).map((c) => {
    const lastOrder = c.orders[0] ?? null;
    const lastOrderAt = lastOrder ? lastOrder.createdAt : null;
    const recency = computeCustomerRecencyBadge(lastOrderAt);
    const deliveryCount = c.orders.filter((o) => o.type === "DELIVERY").length;
    const pickupCount = c.orders.length - deliveryCount;
    return {
      ...c,
      orderCount: c.orders.length,
      totalSpentCents: c.orders.reduce((s, o) => s + o.totalCents, 0),
      lastOrderAt: lastOrderAt ? lastOrderAt.toISOString() : null,
      recency,
      deliveryCount,
      pickupCount,
    };
  });
  return NextResponse.json(customers);
}
