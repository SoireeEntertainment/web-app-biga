import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const productIngredientSchema = z.object({
  ingredientId: z.string().cuid(),
  isDefault: z.boolean(),
  allowRemove: z.boolean(),
  allowAdd: z.boolean(),
  addPriceCentsOverride: z.number().int().min(0).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const updateSchema = z.object({
  productIngredients: z.array(productIngredientSchema),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      productIngredients: { orderBy: { sortOrder: "asc" }, include: { ingredient: true } },
      category: true,
      restaurant: true,
    },
  });
  if (!product) {
    return NextResponse.json({ error: "Prodotto non trovato" }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return NextResponse.json({ error: "Prodotto non trovato" }, { status: 404 });
  }
  await prisma.productIngredient.deleteMany({ where: { productId: id } });
  if (parsed.data.productIngredients.length > 0) {
    await prisma.productIngredient.createMany({
      data: parsed.data.productIngredients.map((pi, i) => ({
        productId: id,
        ingredientId: pi.ingredientId,
        isDefault: pi.isDefault,
        allowRemove: pi.allowRemove,
        allowAdd: pi.allowAdd,
        addPriceCentsOverride: pi.addPriceCentsOverride ?? null,
        sortOrder: pi.sortOrder ?? i,
      })),
    });
  }
  const updated = await prisma.product.findUnique({
    where: { id },
    include: {
      productIngredients: { orderBy: { sortOrder: "asc" }, include: { ingredient: true } },
    },
  });
  return NextResponse.json(updated);
}
