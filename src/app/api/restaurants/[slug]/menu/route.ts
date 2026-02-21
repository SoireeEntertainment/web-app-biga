import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        address: true,
        city: true,
        cap: true,
        phone: true,
        deliveryFeeCents: true,
        minOrderCents: true,
        deliveryEnabled: true,
        deliveryRadiusKm: true,
        restaurantLat: true,
        restaurantLng: true,
      },
    });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const [categories, allActiveIngredients] = await Promise.all([
      prisma.category.findMany({
        where: { restaurantId: restaurant.id },
        orderBy: { sortOrder: "asc" },
        include: {
          products: {
            orderBy: { sortOrder: "asc" },
            include: {
              productIngredients: {
                orderBy: { sortOrder: "asc" },
                include: { ingredient: true },
              },
            },
          },
        },
      }),
      prisma.ingredient.findMany({
        where: { restaurantId: restaurant.id, isActive: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const nonCustomizableCategoryNames = new Set(["i fritti", "le bevande", "i dolci"]);

    return NextResponse.json({
      restaurant,
      categories: categories.map((c) => {
        const categoryKey = c.name.trim().toLowerCase();
        const isCustomizableByCategory = !nonCustomizableCategoryNames.has(categoryKey);
        return {
        id: c.id,
        name: c.name,
        sortOrder: c.sortOrder,
        products: c.products.map((p) => {
          // Derivato dalla categoria: Fritti/Bevande/Dolci = no, tutte le altre (La novità, Focacce, Pizze) = sì
          const isCustomizable = isCustomizableByCategory;
          const productIngredients = p.productIngredients ?? [];
          const defaultIngredients = productIngredients.filter((pi) => pi.isDefault && pi.ingredient);
          const defaultIdsSet = new Set(defaultIngredients.map((pi) => pi.ingredient!.id));
          const piByIngId = new Map(productIngredients.map((pi) => [pi.ingredient.id, pi]));

          const defaultIngredientIds = isCustomizable
            ? defaultIngredients.map((pi) => pi.ingredient!.id)
            : [];
          const defaultRemovableIngredients = isCustomizable
            ? productIngredients
                .filter((pi) => pi.isDefault && pi.allowRemove && pi.ingredient)
                .map((pi) => ({
                  id: pi.ingredient!.id,
                  name: pi.ingredient!.name,
                }))
            : [];
          const allAddableIngredients = isCustomizable
            ? allActiveIngredients.map((ing) => {
                const pi = piByIngId.get(ing.id);
                const addPriceCents = pi
                  ? (pi.addPriceCentsOverride ?? pi.ingredient.defaultAddPriceCents ?? 0)
                  : ing.defaultAddPriceCents ?? 0;
                return {
                  id: ing.id,
                  name: ing.name,
                  addPriceCents,
                  isAlreadyDefault: defaultIdsSet.has(ing.id),
                };
              })
            : [];

          return {
            id: p.id,
            name: p.name,
            description: p.description,
            basePriceCents: p.basePriceCents,
            imageUrl: p.imageUrl,
            sortOrder: p.sortOrder,
            isCustomizableIngredients: isCustomizable,
            defaultIngredientIds,
            defaultRemovableIngredients,
            allAddableIngredients,
          };
        }),
      };
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Menu load failed";
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[menu] GET error:", err);
    return NextResponse.json(
      {
        error: message,
        ...(process.env.NODE_ENV === "development" && stack && { details: stack }),
      },
      { status: 500 }
    );
  }
}
