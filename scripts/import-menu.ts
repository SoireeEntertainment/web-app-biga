/**
 * Import menu from data/menu.json into DB (restaurant biga-villanova).
 * Parses product descriptions into ingredients and creates Ingredient + ProductIngredient (isDefault=true).
 * Run: npx tsx scripts/import-menu.ts
 */
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { prisma } from "../src/lib/prisma";

const MENU_PATH = path.join(process.cwd(), "data", "menu.json");

/** Normalize ingredient name for deduplication: trim, lowercase. */
function normalizeKey(s: string): string {
  return s.trim().toLowerCase();
}

/** Display name: trim only (keep original casing from menu). */
function displayName(s: string): string {
  return s.trim();
}

/**
 * Parse comma-separated description into list of ingredient names (trimmed, deduplicated in order).
 */
function parseIngredientsFromDescription(description: string | undefined): string[] {
  if (!description || !description.trim()) return [];
  const parts = description.split(",").map((s) => displayName(s)).filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const key = normalizeKey(p);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(p);
    }
  }
  return out;
}

async function main() {
  const raw = fs.readFileSync(MENU_PATH, "utf8");
  const data = JSON.parse(raw) as {
    restaurant: { name: string; slug: string };
    categories: {
      name: string;
      sortOrder: number;
      products: { name: string; description?: string; priceEur: number; imageUrl?: string }[];
    }[];
  };

  const slug = data.restaurant.slug;
  // Coordinate Biga Pizzeria: Piazza Alfieri 32, Villanova d'Asti (centro paese)
  const bigaVillanovaLat = 44.9422651;
  const bigaVillanovaLng = 7.9373876;
  const restaurant = await prisma.restaurant.upsert({
    where: { slug },
    create: {
      slug,
      name: data.restaurant.name,
      address: "Piazza Alfieri 32",
      city: "Villanova d'Asti",
      cap: "14019",
      phone: "0141 450 340",
      deliveryFeeCents: 150,
      restaurantLat: slug === "biga-villanova" ? bigaVillanovaLat : null,
      restaurantLng: slug === "biga-villanova" ? bigaVillanovaLng : null,
    },
    update: {
      name: data.restaurant.name,
      ...(slug === "biga-villanova" && {
        restaurantLat: bigaVillanovaLat,
        restaurantLng: bigaVillanovaLng,
      }),
    },
  });

  // Delete in order: product ingredients (via product delete), then products, categories, then ingredients
  await prisma.productIngredient.deleteMany({
    where: { product: { restaurantId: restaurant.id } },
  });
  await prisma.product.deleteMany({ where: { restaurantId: restaurant.id } });
  await prisma.category.deleteMany({ where: { restaurantId: restaurant.id } });
  await prisma.ingredient.deleteMany({ where: { restaurantId: restaurant.id } });

  // Collect all unique ingredient names (key = normalized, value = display name) across all products
  const ingredientNamesByKey = new Map<string, string>();
  const productDescriptions: { productKey: string; description: string }[] = [];

  for (const cat of data.categories) {
    for (const p of cat.products) {
      if (p.description?.trim()) {
        const names = parseIngredientsFromDescription(p.description);
        for (const name of names) {
          const key = normalizeKey(name);
          if (!ingredientNamesByKey.has(key)) ingredientNamesByKey.set(key, name);
        }
        productDescriptions.push({
          productKey: `${cat.name}|${p.name}`,
          description: p.description,
        });
      }
    }
  }

  // Create all Ingredient rows (unique per restaurant by name)
  const ingredientIdByKey = new Map<string, string>();
  let sortOrder = 0;
  for (const [key, displayNameVal] of ingredientNamesByKey) {
    const ing = await prisma.ingredient.create({
      data: {
        restaurantId: restaurant.id,
        name: displayNameVal,
        defaultAddPriceCents: 0,
        isActive: true,
        sortOrder: sortOrder++,
      },
    });
    ingredientIdByKey.set(key, ing.id);
  }

  // Solo Fritti, Bevande, Dolci: niente ingredienti. La novità, Focacce, Pizze classiche/speciali/contemporanee: sì.
  const nonCustomizableCategoryNames = new Set(["i fritti", "le bevande", "i dolci"]);
  let catIndex = 0;
  for (const cat of data.categories) {
    const category = await prisma.category.create({
      data: {
        restaurantId: restaurant.id,
        name: cat.name,
        sortOrder: catIndex++,
      },
    });
    const isCustomizable = !nonCustomizableCategoryNames.has(cat.name.trim().toLowerCase());
    let prodOrder = 0;
    for (const p of cat.products) {
      const product = await prisma.product.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: category.id,
          name: p.name,
          description: p.description ?? null,
          basePriceCents: Math.round(p.priceEur * 100),
          imageUrl: p.imageUrl ?? null,
          sortOrder: prodOrder++,
          isCustomizableIngredients: isCustomizable,
        },
      });

      const ingredientNames = parseIngredientsFromDescription(p.description);
      let piSort = 0;
      for (const name of ingredientNames) {
        const key = normalizeKey(name);
        const ingredientId = ingredientIdByKey.get(key);
        if (!ingredientId) continue;
        await prisma.productIngredient.create({
          data: {
            productId: product.id,
            ingredientId,
            isDefault: true,
            allowRemove: true,
            allowAdd: true,
            addPriceCentsOverride: null,
            sortOrder: piSort++,
          },
        });
      }
    }
  }

  const totalProducts = data.categories.reduce((s, c) => s + c.products.length, 0);
  console.log(
    "Import done. Restaurant:",
    restaurant.slug,
    "Categories:",
    data.categories.length,
    "Products:",
    totalProducts,
    "Ingredients:",
    ingredientNamesByKey.size
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
