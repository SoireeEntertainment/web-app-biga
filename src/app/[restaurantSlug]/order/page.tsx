"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { getCart, setCart, cartTotalItems, cartSubtotalCents, type CartItem } from "@/lib/cart";
import { FloatingCartDesktop } from "@/components/cart/FloatingCartDesktop";
import { FloatingCartMobileFab } from "@/components/cart/FloatingCartMobileFab";

type AddableIngredient = {
  id: string;
  name: string;
  addPriceCents: number;
  isAlreadyDefault: boolean;
};
type DefaultRemovable = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  description: string | null;
  basePriceCents: number;
  imageUrl: string | null;
  isCustomizableIngredients?: boolean;
  defaultIngredientIds?: string[];
  defaultRemovableIngredients?: DefaultRemovable[];
  allAddableIngredients?: AddableIngredient[];
};
type Category = {
  id: string;
  name: string;
  sortOrder: number;
  products: Product[];
};
type Menu = {
  restaurant: { id: string; slug: string; name: string; deliveryFeeCents: number };
  categories: Category[];
};

const BIGA_LOGO =
  "https://bigapizzeria.it/wp-content/uploads/2025/05/logo-icona-quadrato.jpg";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export default function OrderPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>;
}) {
  const [slug, setSlug] = useState<string>("");
  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCartState] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [productModal, setProductModal] = useState<{ product: Product; categoryName: string } | null>(null);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    params.then((p) => setSlug(p.restaurantSlug));
  }, [params]);

  const loadMenu = useCallback(async () => {
    if (!slug) return;
    const res = await fetch(`/api/restaurants/${slug}/menu`);
    if (res.ok) {
      const data = await res.json();
      setMenu(data);
    } else setMenu(null);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  useEffect(() => {
    const sync = () => {
      const c = getCart();
      if (c.restaurantSlug === slug) setCartState(c.items);
      else setCartState([]);
    };
    sync();
    const onVisibility = () => {
      if (document.visibilityState === "visible") sync();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [slug]);

  useEffect(() => {
    if (!productModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProductModal(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [productModal]);

  const addToCart = useCallback(
    (
      product: Product,
      quantity: number,
      itemNotes?: string,
      removedIngredientIds?: string[],
      addedIngredientIds?: string[],
      extraCents?: number
    ) => {
      const removed = removedIngredientIds ?? [];
      const added = addedIngredientIds ?? [];
      const priceCents = product.basePriceCents + (extraCents ?? 0);
      const item: CartItem = {
        productId: product.id,
        name: product.name,
        priceCents,
        quantity,
        notes: itemNotes || undefined,
        imageUrl: product.imageUrl,
        removedIngredientIds: removed.length ? removed : undefined,
        addedIngredientIds: added.length ? added : undefined,
      };
      const current = getCart();
      const items =
        current.restaurantSlug !== slug ? [item] : [...current.items];
      if (current.restaurantSlug === slug) {
        const sameLine = (i: CartItem) =>
          i.productId === product.id &&
          i.notes === (itemNotes || "") &&
          JSON.stringify((i.removedIngredientIds ?? []).sort()) === JSON.stringify([...removed].sort()) &&
          JSON.stringify((i.addedIngredientIds ?? []).sort()) === JSON.stringify([...added].sort());
        const idx = items.findIndex(sameLine);
        if (idx >= 0) {
          items[idx].quantity += quantity;
        } else {
          items.push(item);
        }
      }
      setCart({ items, restaurantSlug: slug });
      setCartState(items);
      setProductModal(null);
      setQty(1);
      setNotes("");
      setRemovedIds(new Set());
      setAddedIds(new Set());
    },
    [slug]
  );

  const openModal = (product: Product, categoryName: string) => {
    setProductModal({ product, categoryName });
    setQty(1);
    setNotes("");
    setRemovedIds(new Set());
    setAddedIds(new Set());
  };

  const categories = menu?.categories ?? [];
  const filteredCategories = search.trim()
    ? categories.map((cat) => {
        const searchLower = search.trim().toLowerCase();
        const categoryMatches = cat.name.toLowerCase().includes(searchLower);
        return {
          ...cat,
          products: categoryMatches
            ? cat.products
            : cat.products.filter(
                (p) =>
                  p.name.toLowerCase().includes(searchLower) ||
                  (p.description?.toLowerCase().includes(searchLower) ?? false)
              ),
        };
      }).filter((cat) => cat.products.length > 0)
    : categories;

  const getProductById = useCallback(
    (id: string) => categories.flatMap((c) => c.products).find((p) => p.id === id),
    [categories]
  );

  const removeItemAt = useCallback(
    (index: number) => {
      const current = getCart();
      if (current.restaurantSlug !== slug) return;
      const items = current.items.filter((_, i) => i !== index);
      setCart({ items, restaurantSlug: slug });
      setCartState(items);
    },
    [slug]
  );

  const clearCart = useCallback(() => {
    setCart({ items: [], restaurantSlug: slug });
    setCartState([]);
  }, [slug]);

  const totalItems = cartTotalItems(cart);
  const subtotal = cartSubtotalCents(cart);
  const deliveryFee = menu?.restaurant.deliveryFeeCents ?? 0;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-4">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={BIGA_LOGO}
                alt=""
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
            <span className="font-heading font-semibold text-primary truncate">
              {menu?.restaurant.name ?? slug}
            </span>
          </Link>
          <SignedOut>
            <Link
              href="/account/sign-in"
              className="text-sm text-muted-foreground hover:text-foreground shrink-0"
            >
              Accedi
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
          </SignedIn>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-2">
          <input
            type="search"
            placeholder="Cerca nel menù..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Cerca prodotti"
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : !menu ? (
          <p className="py-8 text-center text-muted-foreground">
            Ristorante non trovato.
          </p>
        ) : (
          <div className="space-y-8">
            {filteredCategories.map((cat) => (
              <section
                key={cat.id}
                id={`cat-${cat.id}`}
                className="scroll-mt-24"
              >
                <h2 className="font-heading mb-3 text-lg font-semibold text-foreground">
                  {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                </h2>
                <ul className="space-y-2">
                  {cat.products.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => openModal(p, cat.name)}
                        className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-3 text-left transition hover:border-primary/30 hover:bg-muted/30"
                      >
                        {p.imageUrl ? (
                          <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg">
                            <Image
                              src={p.imageUrl}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          </div>
                        ) : (
                          <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl text-muted-foreground">
                            —
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-foreground">
                            {p.name}
                          </span>
                          {p.description && (
                            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                              {p.description}
                            </p>
                          )}
                          <p className="mt-1 text-sm font-medium text-primary">
                            {formatPrice(p.basePriceCents)}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>

      <FloatingCartDesktop
        items={cart}
        restaurantSlug={slug}
        getProductById={getProductById}
        deliveryFeeCents={deliveryFee}
        onRemoveItem={removeItemAt}
        onClearCart={clearCart}
      />

      <FloatingCartMobileFab
        items={cart}
        restaurantSlug={slug}
        getProductById={getProductById}
        deliveryFeeCents={deliveryFee}
        onRemoveItem={removeItemAt}
        onClearCart={clearCart}
      />

      {/* Product modal */}
      {productModal && (() => {
        const p = productModal.product;
        // API imposta isCustomizableIngredients in base alla categoria; fallback: se arrivano liste ingredienti mostriamo (tranne se esplicitamente false)
        const hasLists = (p.defaultRemovableIngredients?.length ?? 0) > 0 || (p.allAddableIngredients?.length ?? 0) > 0;
        const isCustomizable = p.isCustomizableIngredients === true || (p.isCustomizableIngredients !== false && hasLists);
        const defaultRemovable = isCustomizable ? (p.defaultRemovableIngredients ?? []) : [];
        const allAddable = isCustomizable ? (p.allAddableIngredients ?? []) : [];
        const extraCents = allAddable
          .filter((i) => addedIds.has(i.id))
          .reduce((s, i) => s + i.addPriceCents, 0);
        const unitTotal = p.basePriceCents + extraCents;
        const lineTotal = unitTotal * qty;
        return (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 md:items-center md:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) setProductModal(null);
            }}
          >
            <div
              className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-card p-4 shadow-xl md:rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setProductModal(null)}
                className="absolute top-3 right-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Chiudi"
              >
                <span className="text-xl font-bold leading-none">×</span>
              </button>
              <h3 id="product-modal-title" className="pr-12 text-lg font-semibold">
                {p.name}
              </h3>
              <p className="mt-1 text-primary">
                {formatPrice(p.basePriceCents)}
                {extraCents > 0 && (
                  <span className="ml-1 text-sm text-muted-foreground">
                    + {formatPrice(extraCents)} extra
                  </span>
                )}
              </p>
              {p.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {p.description}
                </p>
              )}

              {defaultRemovable.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium">Ingredienti di base</p>
                  <p className="mb-2 text-xs text-muted-foreground">Togli gli ingredienti che non desideri (gratis)</p>
                  <ul className="space-y-1.5">
                    {defaultRemovable.map((i) => {
                      const isRemoved = removedIds.has(i.id);
                      return (
                        <li key={i.id} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setRemovedIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(i.id)) next.delete(i.id);
                                else next.add(i.id);
                                return next;
                              });
                            }}
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-lg font-medium transition-colors ${
                              isRemoved
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-muted/50 hover:border-primary/50"
                            }`}
                            aria-label={isRemoved ? `Mantieni ${i.name}` : `Togli ${i.name}`}
                          >
                            −
                          </button>
                          <span className="text-sm">{i.name}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {allAddable.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium">Aggiungi ingredienti</p>
                  <p className="mb-2 text-xs text-muted-foreground">Seleziona gli extra a pagamento</p>
                  <ul className="space-y-1.5">
                    {allAddable.map((i) => {
                      const isAdded = addedIds.has(i.id);
                      return (
                        <li key={i.id} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAddedIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(i.id)) next.delete(i.id);
                                else next.add(i.id);
                                return next;
                              });
                            }}
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-lg font-medium transition-colors ${
                              isAdded
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-muted/50 hover:border-primary/50"
                            }`}
                            aria-label={isAdded ? `Rimuovi extra ${i.name}` : `Aggiungi ${i.name}`}
                          >
                            +
                          </button>
                          <span className="text-sm">
                            {i.name}
                            {i.isAlreadyDefault && (
                              <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                                Già presente (extra se selezionato)
                              </span>
                            )}
                            <span className="ml-1 text-primary">
                              +{formatPrice(i.addPriceCents)}
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className="mt-4 space-y-3">
                <label className="block text-sm font-medium">Quantità</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQty((n) => Math.max(1, n - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted text-lg"
                    aria-label="Diminuisci quantità"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-medium">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((n) => n + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted text-lg"
                    aria-label="Aumenta quantità"
                  >
                    +
                  </button>
                </div>
                <label className="block text-sm font-medium">Note (opzionale)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Es. ben cotta"
                  maxLength={300}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setProductModal(null)}
                  className="flex-1 rounded-full border border-border py-2.5 font-medium"
                >
                  Indietro
                </button>
                <button
                  type="button"
                  onClick={() =>
                    addToCart(
                      p,
                      qty,
                      notes.trim() || undefined,
                      isCustomizable ? [...removedIds] : [],
                      isCustomizable ? [...addedIds] : [],
                      isCustomizable ? extraCents : 0
                    )
                  }
                  className="flex-1 rounded-full bg-primary py-2.5 font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Aggiungi · {formatPrice(lineTotal)}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
