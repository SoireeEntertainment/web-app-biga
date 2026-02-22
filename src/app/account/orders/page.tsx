"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/account/claim-orders", { method: "POST" })
      .catch(() => {})
      .finally(() => {
        fetch("/api/account/orders")
          .then((r) => (r.ok ? r.json() : []))
          .then((data) => (Array.isArray(data) ? setOrders(data) : []))
          .finally(() => setLoading(false));
      });
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center text-muted-foreground">
        Caricamento...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">I tuoi ordini</h1>
        <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-9 w-9" } }} />
      </div>
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
        <Link href="/account" className="text-primary underline">
          ← Account
        </Link>
        {" · "}
        <Link href="/" className="text-primary underline">
          Torna alla home
        </Link>
      </p>
    </div>
  );
}
