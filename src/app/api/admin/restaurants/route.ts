import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const restaurants = await prisma.restaurant.findMany({
      select: { id: true, slug: true, name: true, deliveryEnabled: true, deliveryRadiusKm: true, restaurantLat: true, restaurantLng: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(restaurants);
  } catch (err) {
    console.error("[admin/restaurants] GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load restaurants" },
      { status: 500 }
    );
  }
}
