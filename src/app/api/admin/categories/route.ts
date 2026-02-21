import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");
    const where = restaurantId ? { restaurantId } : {};
    const categories = await prisma.category.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      include: { products: { orderBy: { sortOrder: "asc" } } },
    });
    return NextResponse.json(categories);
  } catch (err) {
    console.error("[admin/categories] GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load categories" },
      { status: 500 }
    );
  }
}
