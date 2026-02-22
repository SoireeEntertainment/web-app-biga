import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ updatedCount: 0 });
  }

  const result = await prisma.order.updateMany({
    where: {
      userId: null,
      customerEmail: { equals: email, mode: "insensitive" },
    },
    data: { userId },
  });

  return NextResponse.json({ updatedCount: result.count });
}
