import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  restaurantId: z.string().cuid(),
  name: z.string().min(1).max(200),
  defaultAddPriceCents: z.number().int().min(0).default(0),
  sortOrder: z.number().int().min(0).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let restaurantId: string | null = searchParams.get("restaurantId");
    if (!restaurantId) {
      const first = await prisma.restaurant.findFirst({ select: { id: true } });
      if (!first) return NextResponse.json({ error: "No restaurant" }, { status: 404 });
      restaurantId = first.id;
    }
    const rid = restaurantId as string;
    const q = searchParams.get("q")?.trim() ?? "";
    const where: { restaurantId: string; name?: { contains: string } } = { restaurantId: rid };
    if (q.length > 0) {
      where.name = { contains: q };
    }
    const ingredients = await prisma.ingredient.findMany({
      where,
      orderBy: { name: "asc" },
    });
    // Case-insensitive filter (SQLite doesn't support mode: 'insensitive')
    const filtered =
      q.length > 0
        ? ingredients.filter((i: { name: string }) => i.name.toLowerCase().includes(q.toLowerCase()))
        : ingredients;
    // Sort A-Z case-insensitive
    filtered.sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "it", { sensitivity: "base" }));
    return NextResponse.json(filtered);
  } catch (err) {
    console.error("[admin/ingredients] GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load ingredients" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { restaurantId, name, defaultAddPriceCents, sortOrder } = parsed.data;
  const exists = await prisma.ingredient.findUnique({
    where: { restaurantId_name: { restaurantId, name: name.trim() } },
  });
  if (exists) {
    return NextResponse.json(
      { error: "Ingrediente già presente con questo nome" },
      { status: 409 }
    );
  }
  const maxOrder = await prisma.ingredient
    .aggregate({ where: { restaurantId }, _max: { sortOrder: true } })
    .then((r) => r._max.sortOrder ?? -1);
  const ingredient = await prisma.ingredient.create({
    data: {
      restaurantId,
      name: name.trim(),
      defaultAddPriceCents,
      sortOrder: sortOrder ?? maxOrder + 1,
      isActive: true,
    },
  });
  return NextResponse.json(ingredient);
}
