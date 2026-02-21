"use client";

import { useEffect, useState } from "react";

type Customer = {
  phone: string;
  name: string;
  email: string | null;
  orderCount: number;
  totalSpentCents: number;
  lastOrderAt: string | null;
  recency: { label: string; type: "never" | "today" | "recent" | "stale" };
  deliveryCount: number;
  pickupCount: number;
  orders: { id: string; totalCents: number; createdAt: string; status: string; type: string }[];
};

function formatPrice(cents: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function formatDate(s: string) {
  return new Date(s).toLocaleString("it-IT");
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then(setCustomers)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Clienti</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Raggruppati per telefono (chiave traccia ordine)
      </p>
      {loading ? (
        <p className="mt-6 text-muted-foreground">Caricamento...</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {customers.map((c) => (
            <li
              key={c.phone}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{c.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    c.recency.type === "today"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : c.recency.type === "stale"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {c.recency.label}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {c.phone}
                {c.email && ` · ${c.email}`}
              </div>
              <div className="mt-2 text-sm">
                {c.orderCount} ordini · Totale {formatPrice(c.totalSpentCents)}
                {c.orderCount > 0 && (
                  <span className="text-muted-foreground">
                    {" "}
                    · {c.deliveryCount} delivery / {c.pickupCount} pickup
                  </span>
                )}
              </div>
              {(c.phone || c.email) && (
                <div className="mt-2 flex gap-2 text-sm">
                  {c.phone && (
                    <a
                      href={`https://wa.me/${c.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      WhatsApp
                    </a>
                  )}
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="text-primary hover:underline">
                      Email
                    </a>
                  )}
                </div>
              )}
              <ul className="mt-2 space-y-1 border-t border-border pt-2 text-sm">
                {c.orders.slice(0, 5).map((o) => (
                  <li key={o.id}>
                    #{o.id.slice(-8)} — {formatDate(o.createdAt)} — {formatPrice(o.totalCents)} — {o.status}
                  </li>
                ))}
                {c.orders.length > 5 && (
                  <li className="text-muted-foreground">... e altri {c.orders.length - 5}</li>
                )}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
