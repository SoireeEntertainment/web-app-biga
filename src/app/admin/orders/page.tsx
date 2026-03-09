"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Order = {
  id: string;
  status: string;
  type: string;
  source?: string;
  deliverySlot?: string | null;
  customerName: string;
  customerPhone: string;
  totalCents: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: { name: string; quantity: number; priceCents: number }[];
  restaurant: { slug: string; name: string; phone?: string | null };
};

const STATUSES = ["NEW", "ACCEPTED", "PREPARING", "READY", "COMPLETED", "CANCELED"];

function formatPrice(cents: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function formatDate(s: string) {
  return new Date(s).toLocaleString("it-IT");
}

function typeLabel(type: string) {
  return type === "DELIVERY" ? "Consegna a domicilio" : "Ritiro al ristorante";
}

function sourceLabel(source: string) {
  return source === "MANUAL" ? "Manuale" : "Web";
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [slotRangeFilter, setSlotRangeFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (typeFilter) params.set("type", typeFilter);
    if (sourceFilter) params.set("source", sourceFilter);
    if (slotRangeFilter) params.set("slotRange", slotRangeFilter);
    const q = params.toString() ? `?${params}` : "";
    fetch(`/api/admin/orders${q}`)
      .then((r) => r.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [statusFilter, typeFilter, sourceFilter, slotRangeFilter]);

  const updateStatus = async (orderId: string, status: string) => {
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Ordini</h1>
        <Link
          href="/admin/orders/new"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Nuovo ordine manuale
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          <option value="">Tutti gli stati</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          <option value="">Tutti i tipi</option>
          <option value="DELIVERY">Consegna a domicilio</option>
          <option value="PICKUP">Ritiro al ristorante</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          <option value="">Tutte le origini</option>
          <option value="WEB">Web</option>
          <option value="MANUAL">Manuale</option>
        </select>
        <select
          value={slotRangeFilter}
          onChange={(e) => setSlotRangeFilter(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          <option value="">Tutte le fasce</option>
          <option value="19">19:00–19:45</option>
          <option value="20">20:00–20:45</option>
        </select>
      </div>
      {loading ? (
        <p className="mt-6 text-muted-foreground">Caricamento...</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((o) => (
            <li
              key={o.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-medium">#{o.id.slice(-8)}</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {formatDate(o.createdAt)}
                  </span>
                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs">
                    {sourceLabel(o.source ?? "WEB")}
                  </span>
                  <p className="text-sm">
                    {o.customerName} · {o.customerPhone}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {typeLabel(o.type)}
                    {o.deliverySlot && ` · Slot ${o.deliverySlot}`}
                    {" · "}
                    {o.restaurant.name} · {formatPrice(o.totalCents)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    className="rounded-lg border border-border px-2 py-1 text-sm"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <ul className="mt-2 border-t border-border pt-2 text-sm">
                {o.items.map((i) => (
                  <li key={i.name}>
                    {i.name} × {i.quantity} — {formatPrice(i.priceCents * i.quantity)}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
      {!loading && orders.length === 0 && (
        <p className="mt-6 text-muted-foreground">Nessun ordine.</p>
      )}
    </div>
  );
}
