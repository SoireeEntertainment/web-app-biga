"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getAvailableDeliverySlots,
  isDeliveryOrderingAvailable,
  getDeliveryOrderingMessage,
} from "@/lib/delivery-slots";

const RESTAURANT_SLUG = "biga-villanova";

type Product = {
  id: string;
  name: string;
  basePriceCents: number;
};
type Menu = {
  restaurant: { id: string; name: string; deliveryFeeCents: number };
  categories: { name: string; products: Product[] }[];
};

function formatPrice(cents: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export default function AdminOrdersNewPage() {
  const router = useRouter();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [cart, setCart] = useState<{ productId: string; name: string; priceCents: number; quantity: number }[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [orderType, setOrderType] = useState<"DELIVERY" | "PICKUP">("PICKUP");
  const [deliverySlot, setDeliverySlot] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [cap, setCap] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/restaurants/${RESTAURANT_SLUG}/menu`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setMenu);
  }, []);

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const i = prev.find((x) => x.productId === p.id);
      if (i) return prev.map((x) => (x.productId === p.id ? { ...x, quantity: x.quantity + 1 } : x));
      return [...prev, { productId: p.id, name: p.name, priceCents: p.basePriceCents, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((x) => (x.productId === productId ? { ...x, quantity: Math.max(0, x.quantity + delta) } : x))
        .filter((x) => x.quantity > 0)
    );
  };

  const subtotal = cart.reduce((s, i) => s + i.priceCents * i.quantity, 0);
  const deliveryFee = orderType === "DELIVERY" && menu ? menu.restaurant.deliveryFeeCents : 0;
  const total = subtotal + deliveryFee;

  const slots = getAvailableDeliverySlots(new Date());
  const deliveryUnavailable = orderType === "DELIVERY" && !isDeliveryOrderingAvailable(new Date());
  const deliveryMessage = getDeliveryOrderingMessage(new Date());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!menu) return;
    if (cart.length === 0) {
      setError("Aggiungi almeno un prodotto.");
      return;
    }
    if (orderType === "DELIVERY") {
      if (deliveryUnavailable) {
        setError(deliveryMessage ?? "Ordini consegna non disponibili.");
        return;
      }
      if (!deliverySlot.trim()) {
        setError("Seleziona uno slot orario.");
        return;
      }
    }
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: menu.restaurant.id,
          type: orderType,
          source: "MANUAL",
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerEmail: email.trim() || null,
          deliverySlot: orderType === "DELIVERY" ? deliverySlot : null,
          deliveryAddress: orderType === "DELIVERY" ? address.trim() || null : null,
          deliveryCity: orderType === "DELIVERY" ? city.trim() || null : null,
          deliveryCap: orderType === "DELIVERY" ? cap.trim() || null : null,
          deliveryNotes: orderType === "DELIVERY" ? deliveryNotes.trim() || null : null,
          pickupAt: null,
          paymentMethod: "cash",
          orderNotes: orderNotes.trim() || null,
          items: cart.map((i) => ({
            productId: i.productId,
            name: i.name,
            priceCents: i.priceCents,
            quantity: i.quantity,
            notes: null,
            removedIngredientIds: [],
            addedIngredientIds: [],
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Errore creazione ordine.");
        return;
      }
      router.push("/admin/orders");
    } catch {
      setError("Errore di connessione. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  if (!menu) return <p className="p-4 text-muted-foreground">Caricamento...</p>;

  return (
    <div className="max-w-2xl space-y-6 p-4">
      <div className="flex items-center gap-2">
        <Link href="/admin/orders" className="text-primary hover:underline">
          ← Ordini
        </Link>
        <h1 className="text-2xl font-semibold">Nuovo ordine manuale</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-heading text-lg font-semibold">Prodotti</h2>
          <p className="text-sm text-muted-foreground">Clicca per aggiungere al carrello</p>
          <ul className="mt-2 space-y-1">
            {menu.categories.map((cat) =>
              cat.products.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => addToCart(p)}
                    className="flex-1 rounded-lg border border-border p-2 text-left text-sm hover:bg-muted/50"
                  >
                    {p.name} — {formatPrice(p.basePriceCents)}
                  </button>
                  {cart.find((x) => x.productId === p.id) && (
                    <span className="text-sm font-medium">
                      × {cart.find((x) => x.productId === p.id)!.quantity}
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
          {cart.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-sm font-medium">Nel carrello</p>
              <ul className="mt-1 space-y-1">
                {cart.map((i) => (
                  <li key={i.productId} className="flex items-center gap-2 text-sm">
                    {i.name} × {i.quantity}
                    <button
                      type="button"
                      onClick={() => updateQty(i.productId, -1)}
                      className="rounded border px-1 text-xs"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => updateQty(i.productId, 1)}
                      className="rounded border px-1 text-xs"
                    >
                      +
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm">Subtotale {formatPrice(subtotal)}</p>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-heading text-lg font-semibold">Cliente</h2>
          <div className="mt-3 space-y-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome *"
              required
              className="w-full rounded-lg border border-border px-3 py-2"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Telefono *"
              required
              className="w-full rounded-lg border border-border px-3 py-2"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (opzionale)"
              className="w-full rounded-lg border border-border px-3 py-2"
            />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-heading text-lg font-semibold">Tipo ordine</h2>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setOrderType("PICKUP")}
              className={`rounded-xl border-2 px-4 py-2 text-sm ${orderType === "PICKUP" ? "border-primary bg-primary/5" : "border-border"}`}
            >
              Ritiro al ristorante
            </button>
            <button
              type="button"
              onClick={() => setOrderType("DELIVERY")}
              className={`rounded-xl border-2 px-4 py-2 text-sm ${orderType === "DELIVERY" ? "border-primary bg-primary/5" : "border-border"}`}
            >
              Consegna a domicilio (+{formatPrice(menu.restaurant.deliveryFeeCents)})
            </button>
          </div>

          {orderType === "DELIVERY" && (
            <div className="mt-4 space-y-2">
              {deliveryUnavailable ? (
                <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                  {deliveryMessage}
                </p>
              ) : (
                <>
                  <label className="block text-sm font-medium">Slot orario *</label>
                  <select
                    value={deliverySlot}
                    onChange={(e) => setDeliverySlot(e.target.value)}
                    required={orderType === "DELIVERY"}
                    className="w-full rounded-lg border border-border px-3 py-2"
                  >
                    <option value="">Seleziona</option>
                    {slots.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Indirizzo *"
                    className="w-full rounded-lg border border-border px-3 py-2"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Città *"
                      className="rounded-lg border border-border px-3 py-2"
                    />
                    <input
                      type="text"
                      value={cap}
                      onChange={(e) => setCap(e.target.value)}
                      placeholder="CAP *"
                      className="rounded-lg border border-border px-3 py-2"
                    />
                  </div>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Note consegna"
                    className="w-full rounded-lg border border-border px-3 py-2"
                  />
                </>
              )}
            </div>
          )}

          <div className="mt-4">
            <input
              type="text"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Note ordine"
              className="w-full rounded-lg border border-border px-3 py-2"
            />
          </div>
        </section>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || cart.length === 0 || (orderType === "DELIVERY" && deliveryUnavailable)}
            className="rounded-full bg-primary px-6 py-2 font-medium text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Salvataggio..." : "Crea ordine"}
          </button>
          <Link
            href="/admin/orders"
            className="rounded-full border border-border px-6 py-2 font-medium"
          >
            Annulla
          </Link>
        </div>
      </form>
    </div>
  );
}
