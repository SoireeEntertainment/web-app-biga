"use client";

import Link from "next/link";
import type { CartItem } from "@/lib/cart";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

type ProductLike = {
  id: string;
  defaultIngredientIds?: string[];
  defaultRemovableIngredients?: { id: string; name: string }[];
  allAddableIngredients?: { id: string; name: string }[];
};

type CartSummaryProps = {
  items: CartItem[];
  restaurantSlug: string;
  getProductById: (id: string) => ProductLike | undefined;
  deliveryFeeCents: number;
  className?: string;
  onRemoveItem?: (index: number) => void;
  onClearCart?: () => void;
};

export function CartSummary({
  items,
  restaurantSlug,
  getProductById,
  deliveryFeeCents,
  className = "",
  onRemoveItem,
  onClearCart,
}: CartSummaryProps) {
  const subtotal = items.reduce((s, i) => s + i.priceCents * i.quantity, 0);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className={`flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm ${className}`}>
      <p className="text-sm font-medium">
        Carrello · {totalItems} {totalItems === 1 ? "articolo" : "articoli"}
      </p>
      <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
        {items.map((item, idx) => {
          const product = getProductById(item.productId ?? "");
          const defaultIds = new Set(product?.defaultIngredientIds ?? []);
          const addableNames = new Map(product?.allAddableIngredients?.map((a) => [a.id, a.name]) ?? []);
          const removableNames = new Map(product?.defaultRemovableIngredients?.map((r) => [r.id, r.name]) ?? []);
          const added = item.addedIngredientIds ?? [];
          const removed = item.removedIngredientIds ?? [];
          const removedNames = removed.map((id) => removableNames.get(id) ?? id.slice(0, 8));
          return (
            <li key={idx} className="flex items-start gap-2 border-b border-border pb-2 last:border-0">
              <div className="min-w-0 flex-1">
                <span className="font-medium">{item.name}</span>
                {item.quantity > 1 && (
                  <span className="text-muted-foreground"> × {item.quantity}</span>
                )}
                {removedNames.length > 0 && (
                  <span className="block text-muted-foreground text-xs">
                    Senza: {removedNames.join(", ")}
                  </span>
                )}
                {added.length > 0 && (
                  <span className="block text-muted-foreground text-xs">
                    {added.map((id) => (
                      <span key={id}>
                        + {addableNames.get(id) ?? id.slice(0, 8)}
                        {defaultIds.has(id) ? " (extra)" : ""}
                        {" "}
                      </span>
                    ))}
                  </span>
                )}
                <span className="mt-1 block text-primary">{formatPrice(item.priceCents * item.quantity)}</span>
              </div>
              {onRemoveItem && (
                <button
                  type="button"
                  onClick={() => onRemoveItem(idx)}
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label={`Rimuovi ${item.name} dal carrello`}
                >
                  <span className="text-lg leading-none">×</span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {onClearCart && items.length > 0 && (
        <button
          type="button"
          onClick={onClearCart}
          className="mt-2 text-sm text-muted-foreground underline hover:text-foreground"
        >
          Svuota carrello
        </button>
      )}
      <div className="mt-3 rounded-full border-2 border-primary bg-white py-2.5 text-center font-medium text-primary">
        {formatPrice(subtotal)}
        {deliveryFeeCents > 0 && " + consegna"}
      </div>
      <Link
        href={`/${restaurantSlug}/checkout`}
        className="mt-4 rounded-full bg-primary py-2.5 text-center font-medium text-primary-foreground shadow hover:bg-primary/90"
      >
        Vai al checkout
      </Link>
    </div>
  );
}
