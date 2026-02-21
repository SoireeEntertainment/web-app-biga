/**
 * Server-side pricing logic. Never trust client totals.
 * - Base price = Product.basePriceCents (ingredienti default non alterano).
 * - Extra = solo da addedIngredientIds (ogni aggiunta costa addPriceCents).
 * - Removed ingredients: delta 0.
 */

export type AddedIngredientPrice = {
  ingredientId: string;
  addPriceCents: number;
};

/**
 * Calcola il prezzo di una singola linea ordine (una quantità di un prodotto).
 * basePriceCents = prezzo base pizza.
 * addedPrices = prezzo da applicare per ogni ingrediente in addedIngredientIds
 *   (usa ProductIngredient.addPriceCentsOverride ?? Ingredient.defaultAddPriceCents).
 */
export function computeItemPriceCents(
  basePriceCents: number,
  addedIngredientIds: string[],
  addedPrices: AddedIngredientPrice[]
): number {
  const priceMap = new Map(addedPrices.map((p) => [p.ingredientId, p.addPriceCents]));
  let extra = 0;
  for (const id of addedIngredientIds) {
    extra += priceMap.get(id) ?? 0;
  }
  return basePriceCents + extra;
}
