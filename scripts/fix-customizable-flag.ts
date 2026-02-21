/**
 * Imposta isCustomizableIngredients in base alla categoria:
 * - false (niente togliere/aggiungere ingredienti): "i fritti", "le bevande", "i dolci"
 * - true (togliere e aggiungere ingredienti): La novità, Le focacce, Le pizze classiche,
 *   Le pizze speciali, Le pizze contemporanee e ogni altra categoria non nella lista sopra.
 * Esegui: npx tsx scripts/fix-customizable-flag.ts
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

/** Solo queste categorie NON hanno personalizzazione ingredienti; tutte le altre sì. */
const NON_CUSTOMIZABLE_NAMES = new Set(["i fritti", "le bevande", "i dolci"]);

async function main() {
  const categories = await prisma.category.findMany({
    include: { products: true },
  });

  for (const cat of categories) {
    const key = cat.name.trim().toLowerCase();
    const isCustomizable = !NON_CUSTOMIZABLE_NAMES.has(key);
    const updated = await prisma.product.updateMany({
      where: { categoryId: cat.id },
      data: { isCustomizableIngredients: isCustomizable },
    });
    if (updated.count > 0) {
      console.log(
        `Categoria "${cat.name}": ${updated.count} prodotti → isCustomizableIngredients = ${isCustomizable}`
      );
    }
  }
  console.log("Fatto.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
