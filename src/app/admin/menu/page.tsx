"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  defaultIngredientIds?: string[];
  allAddableIngredients?: { id: string; name: string }[];
};

type Category = {
  id: string;
  name: string;
  products: Product[];
};

type Menu = {
  restaurant: { slug: string; name: string };
  categories: Category[];
};

export default function AdminMenuPage() {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [slug, setSlug] = useState("biga-villanova");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setError(null);
    setLoading(true);
    fetch(`/api/restaurants/${slug}/menu`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          const msg = data.error || data.message || `Errore ${r.status}`;
          const details = data.details;
          throw new Error(details ? `${msg}\n\n${details}` : msg);
        }
        return data;
      })
      .then(setMenu)
      .catch((e) => setError(e instanceof Error ? e.message : "Errore di caricamento"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading && !menu) return <p className="text-muted-foreground">Caricamento...</p>;
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="font-medium text-destructive">Errore caricamento menu</p>
        <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap break-words text-sm text-muted-foreground">
          {error}
        </pre>
      </div>
    );
  }
  if (!menu) return null;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Menu · Ingredienti per pizza</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Clicca su un prodotto per gestire ingredienti (default, removibile, aggiungibile, prezzo extra).
      </p>
      <div className="mt-6 space-y-6">
        {menu.categories.map((cat) => (
          <section key={cat.id}>
            <h2 className="mb-2 font-medium text-muted-foreground">
              {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
            </h2>
            <ul className="space-y-2">
              {cat.products.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/menu/${p.id}`}
                    className="block rounded-lg border border-border bg-card p-3 hover:border-primary/30"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {(p.defaultIngredientIds?.length ?? 0)} default · {(p.allAddableIngredients?.length ?? 0)} aggiungibili
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
