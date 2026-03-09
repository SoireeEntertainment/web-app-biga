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
  const [orderTypeFilter, setOrderTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const q = orderTypeFilter ? `?orderType=${orderTypeFilter}` : "";
    fetch(`/api/admin/customers${q}`)
      .then((r) => r.json())
      .then(setCustomers)
      .finally(() => setLoading(false));
  }, [orderTypeFilter]);

  const toggle = (phone: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(phone)) next.delete(phone);
      else next.add(phone);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === customers.length) setSelected(new Set());
    else setSelected(new Set(customers.map((c) => c.phone)));
  };

  const selectedCustomers = customers.filter((c) => selected.has(c.phone));
  const mailto = selectedCustomers
    .filter((c) => c.email)
    .map((c) => c.email)
    .filter(Boolean) as string[];
  const emailHref = mailto.length ? `mailto:${mailto.join(",")}` : undefined;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Clienti</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Raggruppati per telefono (chiave traccia ordine)
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select
          value={orderTypeFilter}
          onChange={(e) => setOrderTypeFilter(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          <option value="">Tutti</option>
          <option value="DELIVERY">Solo consegna a domicilio</option>
          <option value="PICKUP">Solo ritiro al ristorante</option>
        </select>
        {selected.size > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
            <span>{selected.size} selezionati</span>
            {emailHref && (
              <a
                href={emailHref}
                className="text-primary hover:underline"
              >
                Invia email
              </a>
            )}
            <a
              href={`https://wa.me/?text=${encodeURIComponent("Messaggio per i clienti selezionati")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              WhatsApp (apre chat)
            </a>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-muted-foreground hover:text-foreground"
            >
              Annulla selezione
            </button>
          </div>
        )}
      </div>
      {loading ? (
        <p className="mt-6 text-muted-foreground">Caricamento...</p>
      ) : (
        <ul className="mt-6 space-y-4">
          <li className="flex items-center gap-2 rounded-xl border border-border bg-card p-2">
            <input
              type="checkbox"
              checked={customers.length > 0 && selected.size === customers.length}
              onChange={selectAll}
              className="rounded border-border"
            />
            <span className="text-sm font-medium">Seleziona tutti visibili</span>
          </li>
          {customers.map((c) => (
            <li
              key={c.phone}
              className="flex gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <input
                type="checkbox"
                checked={selected.has(c.phone)}
                onChange={() => toggle(c.phone)}
                className="mt-1 rounded border-border"
              />
              <div className="min-w-0 flex-1">
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
                      · {c.deliveryCount} consegna a domicilio / {c.pickupCount} ritiro al ristorante
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
