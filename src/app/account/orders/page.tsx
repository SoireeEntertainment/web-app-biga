"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Order = {
  id: string;
  status: string;
  type: string;
  totalCents: number;
  createdAt: string;
  restaurant: { slug: string; name: string };
};

function formatPrice(cents: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function formatDate(s: string) {
  return new Date(s).toLocaleString("it-IT");
}

export default function AccountOrdersPage() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user);
        if (!data.user) return;
        return fetch("/api/account/orders");
      })
      .then((r) => (r && r.ok ? r.json() : []))
      .then((data) => (Array.isArray(data) ? setOrders(data) : null))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setOrders([]);
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center text-muted-foreground">
        Caricamento...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <p className="text-muted-foreground">Devi accedere per vedere i tuoi ordini.</p>
        <Link href="/account/login" className="mt-4 inline-block text-primary underline">
          Accedi
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">I tuoi ordini</h1>
        <button
          type="button"
          onClick={logout}
          className="text-sm text-muted-foreground underline"
        >
          Esci
        </button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
      {orders.length === 0 ? (
        <p className="mt-8 text-muted-foreground">Nessun ordine ancora.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((o) => (
            <li
              key={o.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <Link href={`/order/${o.id}/confirmation`} className="block">
                <span className="font-medium">#{o.id.slice(-8)}</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  {formatDate(o.createdAt)}
                </span>
                <p className="text-sm">
                  {o.restaurant.name} · {o.type} · {formatPrice(o.totalCents)}
                </p>
                <p className="text-sm text-muted-foreground">Stato: {o.status}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-8">
        <Link href="/" className="text-primary underline">
          ← Torna alla home
        </Link>
      </p>
    </div>
  );
}
