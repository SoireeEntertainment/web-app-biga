"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Order = {
  id: string;
  status: string;
  type: string;
  customerName: string;
  customerPhone: string;
  totalCents: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: { name: string; quantity: number; priceCents: number }[];
  restaurant: { slug: string; name: string };
};

const STATUSES = ["NEW", "ACCEPTED", "PREPARING", "READY", "COMPLETED", "CANCELED"];

function formatPrice(cents: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function formatDate(s: string) {
  return new Date(s).toLocaleString("it-IT");
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = statusFilter ? `?status=${statusFilter}` : "";
    fetch(`/api/admin/orders${q}`)
      .then((r) => r.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [statusFilter]);

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
      <h1 className="text-2xl font-semibold">Ordini</h1>
      <div className="mt-4 flex gap-2">
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
                  <p className="text-sm">
                    {o.customerName} · {o.customerPhone}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {o.type} · {o.restaurant.name} · {formatPrice(o.totalCents)}
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
