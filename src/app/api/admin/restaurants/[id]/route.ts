import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const deliverySchema = z.object({
  deliveryEnabled: z.boolean().optional(),
  deliveryRadiusKm: z.number().min(0).optional().nullable(),
  restaurantLat: z.number().optional().nullable(),
  restaurantLng: z.number().optional().nullable(),
});

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await _request.json();
    const parsed = deliverySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const restaurant = await prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) {
      return NextResponse.json({ error: "Ristorante non trovato" }, { status: 404 });
    }
    const updated = await prisma.restaurant.update({
      where: { id },
      data: {
        ...(parsed.data.deliveryEnabled !== undefined && {
          deliveryEnabled: parsed.data.deliveryEnabled,
        }),
        ...(parsed.data.deliveryRadiusKm !== undefined && {
          deliveryRadiusKm: parsed.data.deliveryRadiusKm,
        }),
        ...(parsed.data.restaurantLat !== undefined && {
          restaurantLat: parsed.data.restaurantLat,
        }),
        ...(parsed.data.restaurantLng !== undefined && {
          restaurantLng: parsed.data.restaurantLng,
        }),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[admin/restaurants/:id] PATCH error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}
