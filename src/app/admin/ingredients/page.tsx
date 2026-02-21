"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Ingredient = {
  id: string;
  name: string;
  defaultAddPriceCents: number;
  isActive: boolean;
  sortOrder: number;
};

function formatPrice(cents: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

/** Parse "1,50" or "1.50" or "1" -> cents (150, 150, 100) */
function parseEuroToCents(value: string): number {
  const normalized = value.trim().replace(",", ".");
  const num = parseFloat(normalized);
  if (Number.isNaN(num) || num < 0) return 0;
  return Math.round(num * 100);
}

/** Format cents to display string in € (e.g. "1,50") */
function formatCentsToEuroInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

const DEBOUNCE_MS = 300;

export default function AdminIngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [newName, setNewName] = useState("");
  const [newPriceCents, setNewPriceCents] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback((query?: string) => {
    const q = query !== undefined ? query : searchDebounced;
    const url = q ? `/api/admin/ingredients?q=${encodeURIComponent(q)}` : "/api/admin/ingredients";
    setLoading(true);
    fetch(url)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Ingredient[]) => setIngredients(list))
      .finally(() => setLoading(false));
  }, [searchDebounced]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/admin/restaurants")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: { id: string }[]) => {
        if (list[0]?.id) setRestaurantId(list[0].id);
      });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurantId ?? undefined,
          name: newName.trim(),
          defaultAddPriceCents: newPriceCents,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Errore creazione");
        return;
      }
      setNewName("");
      setNewPriceCents(0);
      load();
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (i: Ingredient) => {
    setEditingId(i.id);
    setEditValue(formatCentsToEuroInput(i.defaultAddPriceCents));
  };

  const saveEdit = async (id: string) => {
    const cents = parseEuroToCents(editValue);
    setEditingId(null);
    try {
      const res = await fetch(`/api/admin/ingredients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultAddPriceCents: cents }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Errore salvataggio");
        return;
      }
      const updated = await res.json();
      setIngredients((prev) => prev.map((x) => (x.id === id ? { ...x, ...updated } : x)));
      setError(null);
    } catch {
      setError("Errore di rete");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold">Ingredienti</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Catalogo ingredienti del ristorante. Ordine A-Z. Modifica il prezzo di aggiunta inline.
      </p>
      <Link href="/admin/menu" className="mt-2 inline-block text-sm text-primary hover:underline">
        ← Gestisci ingredienti per pizza (menu)
      </Link>

      <div className="mt-4">
        <label className="block text-sm font-medium">Cerca ingredienti</label>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca ingredienti…"
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <form onSubmit={handleCreate} className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <div>
          <label className="block text-sm font-medium">Nome</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="es. Mozzarella"
            className="mt-1 w-48 rounded-lg border border-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Prezzo aggiunta (€)</label>
          <input
            type="text"
            inputMode="decimal"
            value={newPriceCents === 0 ? "" : formatCentsToEuroInput(newPriceCents)}
            onChange={(e) => setNewPriceCents(parseEuroToCents(e.target.value))}
            placeholder="0,00"
            className="mt-1 w-24 rounded-lg border border-border px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={saving || !newName.trim() || !restaurantId}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Salvataggio..." : "Aggiungi"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      {loading ? (
        <p className="mt-6 text-muted-foreground">Caricamento...</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {ingredients.map((i) => (
            <li
              key={i.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3"
            >
              <span className={i.isActive ? "" : "text-muted-foreground line-through"}>
                {i.name.charAt(0).toUpperCase() + i.name.slice(1)}
              </span>
              <div className="flex items-center gap-2">
                {editingId === i.id ? (
                  <>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveEdit(i.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(i.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="w-20 rounded border border-border px-2 py-1 text-sm"
                      autoFocus
                    />
                    <span className="text-sm text-muted-foreground">€</span>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(i)}
                    className="text-sm text-primary hover:underline"
                  >
                    +{formatPrice(i.defaultAddPriceCents)}
                  </button>
                )}
              </div>
            </li>
          ))}
          {ingredients.length === 0 && (
            <li className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
              {searchDebounced ? "Nessun ingrediente trovato." : "Nessun ingrediente. Esegui l'import menu per pre-popolare."}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
