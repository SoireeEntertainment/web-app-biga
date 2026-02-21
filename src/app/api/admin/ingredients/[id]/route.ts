import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  defaultAddPriceCents: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await _request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const ingredient = await prisma.ingredient.findUnique({ where: { id } });
    if (!ingredient) {
      return NextResponse.json({ error: "Ingrediente non trovato" }, { status: 404 });
    }
    const updated = await prisma.ingredient.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name.trim() }),
        ...(parsed.data.defaultAddPriceCents !== undefined && {
          defaultAddPriceCents: parsed.data.defaultAddPriceCents,
        }),
        ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
        ...(parsed.data.sortOrder !== undefined && { sortOrder: parsed.data.sortOrder }),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[admin/ingredients/:id] PATCH error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ingredient = await prisma.ingredient.findUnique({ where: { id } });
  if (!ingredient) {
    return NextResponse.json({ error: "Ingrediente non trovato" }, { status: 404 });
  }
  await prisma.ingredient.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
