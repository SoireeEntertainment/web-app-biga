"use client";

import { useState, useEffect } from "react";
import { CartSummary } from "./CartSummary";
import type { CartItem } from "@/lib/cart";

type ProductLike = {
  id: string;
  defaultIngredientIds?: string[];
  defaultRemovableIngredients?: { id: string; name: string }[];
  allAddableIngredients?: { id: string; name: string }[];
};

type FloatingCartMobileFabProps = {
  items: CartItem[];
  restaurantSlug: string;
  getProductById: (id: string) => ProductLike | undefined;
  deliveryFeeCents: number;
  onRemoveItem?: (index: number) => void;
  onClearCart?: () => void;
};

export function FloatingCartMobileFab({
  items,
  restaurantSlug,
  getProductById,
  deliveryFeeCents,
  onRemoveItem,
  onClearCart,
}: FloatingCartMobileFabProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (items.length === 0) return null;

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 lg:hidden"
        aria-label="Apri carrello"
      >
        <span className="text-2xl">🛒</span>
        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background text-xs font-bold text-primary shadow">
          {totalItems}
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-card p-4 shadow-xl animate-in slide-in-from-bottom duration-200 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Carrello"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Carrello</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-lg font-bold hover:bg-muted/80"
                aria-label="Chiudi"
              >
                ×
              </button>
            </div>
            <CartSummary
              items={items}
              restaurantSlug={restaurantSlug}
              getProductById={getProductById}
              deliveryFeeCents={deliveryFeeCents}
              onRemoveItem={onRemoveItem}
              onClearCart={onClearCart}
            />
          </div>
        </>
      )}
    </>
  );
}
