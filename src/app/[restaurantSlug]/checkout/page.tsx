"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import { getCart, type CartItem } from "@/lib/cart";
import { checkoutCustomerSchema, checkoutDeliverySchema } from "@/lib/validations";
import {
  getAvailableDeliverySlots,
  isDeliveryOrderingAvailable,
  getDeliveryOrderingMessage,
} from "@/lib/delivery-slots";

type Restaurant = { id: string; slug: string; name: string; address: string | null; city: string | null; phone: string | null; deliveryFeeCents: number };

function formatPrice(cents: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

type Step = "customer" | "orderType" | "payment";

type MenuProduct = {
  id: string;
  defaultIngredientIds?: string[];
  defaultRemovableIngredients?: { id: string; name: string }[];
  allAddableIngredients?: { id: string; name: string }[];
};

function getRemovableNamesMap(product: unknown): Map<string, string> {
  const arr = (product as { defaultRemovableIngredients?: { id: string; name: string }[] } | null | undefined)?.defaultRemovableIngredients;
  return new Map(Array.isArray(arr) ? arr.map((r) => [r.id, r.name]) : []);
}

export default function CheckoutPage({ params }: { params: Promise<{ restaurantSlug: string }> }) {
  const [slug, setSlug] = useState("");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<{
    restaurant: Restaurant;
    categories: { products: MenuProduct[] }[];
  } | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<Step>("customer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [orderType, setOrderType] = useState<"DELIVERY" | "PICKUP">("PICKUP");
  const [deliverySlot, setDeliverySlot] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [cap, setCap] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [deliveryLat, setDeliveryLat] = useState<number | null>(null);
  const [deliveryLng, setDeliveryLng] = useState<number | null>(null);
  const [orderNotes, setOrderNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "apple_pay">("cash");
  const [checkingAddress, setCheckingAddress] = useState(false);
  const [profilePrefillDone, setProfilePrefillDone] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const router = useRouter();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    params.then((p) => setSlug(p.restaurantSlug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    const c = getCart();
    if (c.restaurantSlug !== slug || c.items.length === 0) {
      router.replace(`/${slug}/order`);
      return;
    }
    setCart(c.items);
    fetch(`/api/restaurants/${slug}/menu`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setRestaurant(data.restaurant);
          setMenu(data as { restaurant: Restaurant; categories: { products: MenuProduct[] }[] });
        }
      });
  }, [slug, router]);

  useEffect(() => {
    if (profilePrefillDone) return;
    setProfileLoading(true);
    fetch("/api/account/clerk-profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          const delivery = d.delivery;
          const hasDelivery = delivery && (delivery.deliveryName ?? delivery.deliveryPhone ?? delivery.deliveryEmail ?? delivery.addressLine1);
          if (hasDelivery) {
            setName(delivery.deliveryName ?? "");
            setPhone(delivery.deliveryPhone ?? "");
            setEmail(delivery.deliveryEmail ?? "");
            setAddress(delivery.addressLine1 ?? "");
            setCity(delivery.city ?? "");
            setCap(delivery.zip ?? "");
            setDeliveryNotes(delivery.notes ?? "");
          } else {
            setName(d.fullName ?? "");
            setPhone(d.primaryPhone ?? "");
            setEmail(d.primaryEmail ?? "");
          }
        }
      })
      .finally(() => {
        setProfilePrefillDone(true);
        setProfileLoading(false);
      });
  }, [profilePrefillDone]);

  useEffect(() => {
    setDeliveryLat(null);
    setDeliveryLng(null);
  }, [address, city, cap]);

  const subtotal = cart.reduce((s, i) => s + i.priceCents * i.quantity, 0);
  const deliveryFee = orderType === "DELIVERY" && restaurant ? restaurant.deliveryFeeCents : 0;
  const total = subtotal + deliveryFee;

  const validateStep1 = useCallback(() => {
    const r = checkoutCustomerSchema.safeParse({ name, phone, email: email || undefined });
    if (!r.success) {
      setError(r.error.issues[0]?.message ?? "Controlla i dati");
      return false;
    }
    setError(null);
    return true;
  }, [name, phone, email]);

  const validateStep2 = useCallback(() => {
    if (orderType === "DELIVERY") {
      if (!isDeliveryOrderingAvailable(new Date())) {
        setError(getDeliveryOrderingMessage(new Date()) ?? "Ordini consegna non disponibili.");
        return false;
      }
      if (!deliverySlot.trim()) {
        setError("Seleziona uno slot orario per la consegna.");
        return false;
      }
      const r = checkoutDeliverySchema.safeParse({ address, city, cap, deliveryNotes });
      if (!r.success) {
        setError(r.error.issues[0]?.message ?? "Controlla indirizzo");
        return false;
      }
    }
    setError(null);
    return true;
  }, [orderType, address, city, cap, deliveryNotes, deliverySlot]);

  const handleNext = async () => {
    if (step === "customer") {
      if (validateStep1()) setStep("orderType");
      return;
    }
    if (step === "orderType") {
      if (!validateStep2()) return;
      if (orderType === "DELIVERY" && slug) {
        setCheckingAddress(true);
        setError(null);
        try {
          const params = new URLSearchParams({
            address,
            city,
            cap,
          });
          const res = await fetch(`/api/restaurants/${slug}/check-delivery?${params}`);
          const data = await res.json();
          if (!data.inRange) {
            setError(data.error ?? "Indirizzo fuori dall'area di consegna");
            setDeliveryLat(null);
            setDeliveryLng(null);
            return;
          }
          setDeliveryLat(data.deliveryLat ?? null);
          setDeliveryLng(data.deliveryLng ?? null);
          setStep("payment");
        } catch {
          setError("Errore durante la verifica dell'indirizzo. Riprova.");
        } finally {
          setCheckingAddress(false);
        }
      } else {
        setStep("payment");
      }
    }
  };

  const handleSubmit = async () => {
    if (!restaurant) return;
    if (orderType === "DELIVERY") {
      if (deliveryLat == null || deliveryLng == null) {
        setError("Verifica l'indirizzo di consegna prima di continuare.");
        return;
      }
      if (!deliverySlot.trim()) {
        setError("Seleziona uno slot orario per la consegna.");
        return;
      }
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          type: orderType,
          source: "WEB",
          customerName: name,
          customerPhone: phone,
          customerEmail: email || null,
          deliverySlot: orderType === "DELIVERY" ? deliverySlot || null : null,
          deliveryAddress: orderType === "DELIVERY" ? address : null,
          deliveryCity: orderType === "DELIVERY" ? city : null,
          deliveryCap: orderType === "DELIVERY" ? cap : null,
          deliveryNotes: orderType === "DELIVERY" ? deliveryNotes : null,
          pickupAt: null,
          paymentMethod,
          orderNotes: orderNotes || null,
          items: cart.map((i) => ({
            productId: i.productId,
            name: i.name,
            priceCents: i.priceCents,
            quantity: i.quantity,
            notes: i.notes,
            removedIngredientIds: i.removedIngredientIds ?? [],
            addedIngredientIds: i.addedIngredientIds ?? [],
          })),
          deliveryLat: orderType === "DELIVERY" ? deliveryLat ?? undefined : undefined,
          deliveryLng: orderType === "DELIVERY" ? deliveryLng ?? undefined : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Errore durante la creazione dell'ordine. Riprova.");
        return;
      }
      if (paymentMethod === "cash") {
        localStorage.removeItem("biga-cart");
        router.push(`/order/${data.orderId}/confirmation`);
        return;
      }
      const intentRes = await fetch("/api/stripe/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.orderId, amountCents: data.totalCents }),
      });
      const intentData = await intentRes.json().catch(() => ({}));
      if (!intentRes.ok) {
        setError(typeof intentData?.error === "string" ? intentData.error : "Errore durante il pagamento. Riprova.");
        return;
      }
      localStorage.setItem("biga-payment-order-id", data.orderId);
      router.push(`/order/${data.orderId}/pay?client_secret=${encodeURIComponent(intentData.clientSecret)}`);
    } catch (e) {
      if (process.env.NODE_ENV === "development") console.error(e);
      setError("Si è verificato un problema di connessione. Riprova tra qualche istante.");
    } finally {
      setLoading(false);
    }
  };

  if (!slug || cart.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-10 border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link href={`/${slug}/order`} className="text-primary font-medium">
              ← Indietro
            </Link>
            <span className="ml-2 font-semibold">Checkout</span>
          </div>
          <SignedOut>
            <Link href="/account/sign-in" className="text-sm text-muted-foreground hover:text-foreground">
              Accedi
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
          </SignedIn>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* Step indicator */}
        <div className="mb-6 flex gap-2">
          {(["customer", "orderType", "payment"] as Step[]).map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(s)}
              className={`h-2 flex-1 rounded-full ${step === s ? "bg-primary" : "bg-muted"}`}
              aria-current={step === s ? "step" : undefined}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {step === "customer" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-heading text-lg font-semibold">I tuoi dati</h2>
              {isSignedIn && (
                <Link
                  href="/account/manage"
                  className="text-sm text-primary underline hover:no-underline"
                >
                  Modifica dati di consegna
                </Link>
              )}
            </div>
            {isSignedIn && profileLoading && (
              <p className="text-sm text-muted-foreground">Caricamento dati...</p>
            )}
            <div>
              <label className="block text-sm font-medium">Nome *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                placeholder="Mario Rossi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Telefono *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                placeholder="+39 333 1234567"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Necessario per tracciare l&apos;ordine
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium">Email (opzionale)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                placeholder="mario@email.it"
              />
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="w-full rounded-full bg-primary py-3 font-medium text-primary-foreground"
            >
              Continua
            </button>
          </section>
        )}

        {step === "orderType" && (
          <section className="space-y-4">
            <h2 className="font-heading text-lg font-semibold">Tipo di ordine</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setOrderType("PICKUP");
                  setDeliverySlot("");
                }}
                className={`rounded-xl border-2 p-4 text-left ${orderType === "PICKUP" ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <span className="font-medium">Ritiro al ristorante</span>
                <p className="mt-1 text-sm text-muted-foreground">
                  {restaurant?.address}, {restaurant?.city}
                </p>
              </button>
              <button
                type="button"
                onClick={() => setOrderType("DELIVERY")}
                className={`rounded-xl border-2 p-4 text-left ${orderType === "DELIVERY" ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <span className="font-medium">Consegna a domicilio</span>
                <p className="mt-1 text-sm text-muted-foreground">
                  +{formatPrice(restaurant?.deliveryFeeCents ?? 0)}
                </p>
              </button>
            </div>
            {orderType === "DELIVERY" && (
              <div className="space-y-3 pt-2">
                {(() => {
                  const slots = getAvailableDeliverySlots(new Date());
                  const unavailable = !isDeliveryOrderingAvailable(new Date());
                  const message = getDeliveryOrderingMessage(new Date());
                  if (unavailable) {
                    return (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                        <p className="text-sm text-amber-800 dark:text-amber-200">{message}</p>
                        {restaurant?.phone && (
                          <a
                            href={`tel:${restaurant.phone.replace(/\s/g, "")}`}
                            className="mt-3 inline-block rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                          >
                            Chiama il ristorante
                          </a>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div>
                      <label className="block text-sm font-medium">Slot orario consegna *</label>
                      <select
                        value={deliverySlot}
                        onChange={(e) => setDeliverySlot(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                      >
                        <option value="">Seleziona orario</option>
                        {slots.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })()}
                <div>
                  <label className="block text-sm font-medium">Indirizzo *</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                    placeholder="Via Roma 1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium">Città *</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                      placeholder="Villanova d'Asti"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">CAP *</label>
                    <input
                      type="text"
                      value={cap}
                      onChange={(e) => setCap(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                      placeholder="14019"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium">Note consegna</label>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                    placeholder="Citofono, piano..."
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium">Note ordine</label>
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                placeholder="Opzionale"
              />
            </div>
            <button
              type="button"
              onClick={handleNext}
              disabled={
                checkingAddress ||
                (orderType === "DELIVERY" && (!isDeliveryOrderingAvailable(new Date()) || !deliverySlot.trim()))
              }
              className="w-full rounded-full bg-primary py-3 font-medium text-primary-foreground disabled:opacity-70"
            >
              {checkingAddress ? "Verifica indirizzo..." : "Continua"}
            </button>
          </section>
        )}

        {step === "payment" && (
          <section className="space-y-4">
            <h2 className="font-heading text-lg font-semibold">Pagamento</h2>
            <div className="space-y-2">
              {[
                { id: "cash" as const, label: "Contanti", desc: "Paga al ritiro o alla consegna" },
                { id: "card" as const, label: "Carta", desc: "Pagamento sicuro con Stripe" },
                { id: "apple_pay" as const, label: "Apple Pay", desc: "Pagamento rapido" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`w-full rounded-xl border-2 p-4 text-left ${paymentMethod === m.id ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <span className="font-medium">{m.label}</span>
                  <p className="text-sm text-muted-foreground">{m.desc}</p>
                </button>
              ))}
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="mb-2 text-sm font-medium">Riepilogo ordine</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {cart.map((item, idx) => {
                  const product = menu?.categories.flatMap((c) => c.products).find((p) => p.id === item.productId) as MenuProduct | undefined;
                  const defaultIds = new Set(product?.defaultIngredientIds ?? []);
                  const addableNames = new Map(product?.allAddableIngredients?.map((a) => [a.id, a.name]) ?? []);
                  const removableNames = getRemovableNamesMap(product);
                  const added = item.addedIngredientIds ?? [];
                  const removed = item.removedIngredientIds ?? [];
                  const removedNames = removed.map((id) => removableNames.get(id) ?? "—");
                  return (
                    <li key={idx}>
                      {item.name} × {item.quantity}
                      {removedNames.length > 0 && (
                        <> Senza: {removedNames.join(", ")}</>
                      )}
                      {added.length > 0 && (
                        <>
                          {" "}
                          {added.map((id) => (
                            <span key={id}>
                              + {addableNames.get(id) ?? "extra"}
                              {defaultIds.has(id) ? " (extra)" : ""}
                              {" "}
                            </span>
                          ))}
                        </>
                      )}
                      {" · "}
                      {formatPrice(item.priceCents * item.quantity)}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-sm text-muted-foreground">Subtotale {formatPrice(subtotal)}</p>
              {deliveryFee > 0 && (
                <p className="text-sm text-muted-foreground">Consegna {formatPrice(deliveryFee)}</p>
              )}
              <p className="mt-2 font-semibold">Totale {formatPrice(total)}</p>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full rounded-full bg-primary py-3 font-medium text-primary-foreground disabled:opacity-50"
            >
              {loading ? "Attendere..." : paymentMethod === "cash" ? "Conferma ordine" : "Paga con carta / Apple Pay"}
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
