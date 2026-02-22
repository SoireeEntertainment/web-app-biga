import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Optional: run claim so orders are linked if user just signed in
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase();
  if (email) {
    await prisma.order.updateMany({
      where: {
        userId: null,
        customerEmail: { equals: email, mode: "insensitive" },
      },
      data: { userId },
    });
  }

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      restaurant: { select: { slug: true, name: true } },
    },
    take: 50,
  });

  return NextResponse.json(orders);
}
