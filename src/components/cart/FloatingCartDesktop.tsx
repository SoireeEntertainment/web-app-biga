"use client";

import { CartSummary } from "./CartSummary";
import type { CartItem } from "@/lib/cart";

type ProductLike = {
  id: string;
  defaultIngredientIds?: string[];
  defaultRemovableIngredients?: { id: string; name: string }[];
  allAddableIngredients?: { id: string; name: string }[];
};

type FloatingCartDesktopProps = {
  items: CartItem[];
  restaurantSlug: string;
  getProductById: (id: string) => ProductLike | undefined;
  deliveryFeeCents: number;
  onRemoveItem?: (index: number) => void;
  onClearCart?: () => void;
};

export function FloatingCartDesktop({
  items,
  restaurantSlug,
  getProductById,
  deliveryFeeCents,
  onRemoveItem,
  onClearCart,
}: FloatingCartDesktopProps) {
  return (
    <aside
      className="fixed bottom-4 right-4 z-30 hidden w-[320px] max-h-[min(60vh,480px)] overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-lg lg:block"
      aria-label="Carrello"
    >
      {items.length === 0 ? (
        <div className="py-2 text-center text-sm text-muted-foreground">
          Il tuo carrello è vuoto.
          <br />
          Aggiungi qualcosa per vedere il riepilogo qui.
        </div>
      ) : (
        <CartSummary
          items={items}
          restaurantSlug={restaurantSlug}
          getProductById={getProductById}
          deliveryFeeCents={deliveryFeeCents}
          onRemoveItem={onRemoveItem}
          onClearCart={onClearCart}
        />
      )}
    </aside>
  );
}
