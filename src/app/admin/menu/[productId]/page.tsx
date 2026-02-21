"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Ingredient = {
  id: string;
  name: string;
  defaultAddPriceCents: number;
};

type ProductIngredient = {
  id: string;
  ingredientId: string;
  ingredient: Ingredient;
  isDefault: boolean;
  allowRemove: boolean;
  allowAdd: boolean;
  addPriceCentsOverride: number | null;
  sortOrder: number;
};

type Product = {
  id: string;
  name: string;
  category: { name: string };
  restaurant?: { id: string };
  productIngredients: ProductIngredient[];
};

export default function AdminProductIngredientsPage() {
  const params = useParams();
  const productId = params?.productId as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [addIngredientId, setAddIngredientId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!productId) return;
    setLoading(true);
    fetch(`/api/admin/products/${productId}/ingredients`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setProduct)
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!product?.restaurant?.id) return;
    const url = `/api/admin/ingredients?restaurantId=${encodeURIComponent(product.restaurant.id)}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Ingredient[]) => setAllIngredients(list));
  }, [product?.restaurant?.id]);

  const [edits, setEdits] = useState<Record<string, { isDefault: boolean; allowRemove: boolean; allowAdd: boolean; addPriceCentsOverride: number | null }>>({});

  useEffect(() => {
    if (!product) return;
    const next: typeof edits = {};
    for (const pi of product.productIngredients) {
      next[pi.id] = {
        isDefault: pi.isDefault,
        allowRemove: pi.allowRemove,
        allowAdd: pi.allowAdd,
        addPriceCentsOverride: pi.addPriceCentsOverride,
      };
    }
    setEdits(next);
  }, [product]);

  const updateEdit = (piId: string, key: string, value: boolean | number | null) => {
    setEdits((prev) => ({
      ...prev,
      [piId]: { ...prev[piId], [key]: value },
    }));
  };

  const buildPayload = useCallback(
    (productIngredients: ProductIngredient[]) =>
      productIngredients.map((pi, i) => ({
        ingredientId: pi.ingredientId ?? pi.ingredient?.id,
        isDefault: (edits[pi.id] ?? pi).isDefault,
        allowRemove: (edits[pi.id] ?? pi).allowRemove,
        allowAdd: (edits[pi.id] ?? pi).allowAdd,
        addPriceCentsOverride: (edits[pi.id] ?? pi).addPriceCentsOverride,
        sortOrder: i,
      })),
    [edits]
  );

  const save = async () => {
    if (!product) return;
    setError(null);
    setSaving(true);
    try {
      const productIngredients = buildPayload(product.productIngredients);
      const res = await fetch(`/api/admin/products/${productId}/ingredients`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIngredients }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Errore salvataggio");
        return;
      }
      setProduct(data);
    } finally {
      setSaving(false);
    }
  };

  const addIngredient = async () => {
    if (!product || !addIngredientId.trim()) return;
    const already = product.productIngredients.some((pi) => pi.ingredient.id === addIngredientId);
    if (already) return;
    setError(null);
    setSaving(true);
    try {
      const newItem = {
        ingredientId: addIngredientId,
        isDefault: true,
        allowRemove: true,
        allowAdd: true,
        addPriceCentsOverride: null as number | null,
        sortOrder: product.productIngredients.length,
      };
      const productIngredients = [
        ...buildPayload(product.productIngredients),
        newItem,
      ];
      const res = await fetch(`/api/admin/products/${productId}/ingredients`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIngredients }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Errore aggiunta ingrediente");
        return;
      }
      setProduct(data);
      setAddIngredientId("");
    } finally {
      setSaving(false);
    }
  };

  const removeIngredient = async (pi: ProductIngredient) => {
    if (!product) return;
    setError(null);
    setSaving(true);
    try {
      const remaining = product.productIngredients.filter((x) => x.id !== pi.id);
      const productIngredients = buildPayload(remaining);
      const res = await fetch(`/api/admin/products/${productId}/ingredients`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIngredients }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Errore rimozione ingrediente");
        return;
      }
      setProduct(data);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !product) {
    return (
      <div>
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  return (
    <div>
      <Link href="/admin/menu" className="text-sm text-primary hover:underline">
        ← Menu
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{product.name}</h1>
      <p className="text-sm text-muted-foreground">
        {product.category?.name
          ? product.category.name.charAt(0).toUpperCase() + product.category.name.slice(1)
          : ""}
      </p>

      {product.restaurant && (
        <div className="mt-6 flex flex-wrap items-end gap-2 rounded-lg border border-border bg-muted/30 p-3">
          <div className="min-w-0 flex-1">
            <label className="block text-sm font-medium">Aggiungi ingrediente</label>
            <select
              value={addIngredientId}
              onChange={(e) => setAddIngredientId(e.target.value)}
              className="mt-1 w-full max-w-xs rounded-lg border border-border px-3 py-2 text-sm"
            >
              <option value="">Seleziona ingrediente...</option>
              {allIngredients
                .filter(
                  (ing) =>
                    !product.productIngredients.some(
                      (pi) => (pi.ingredientId ?? pi.ingredient?.id) === ing.id
                    )
                )
                .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "it", { sensitivity: "base" }))
                .map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name ? ing.name.charAt(0).toUpperCase() + ing.name.slice(1) : ing.id}
                  </option>
                ))}
            </select>
          </div>
          <button
            type="button"
            onClick={addIngredient}
            disabled={saving || !addIngredientId}
            className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Aggiungi ingrediente
          </button>
        </div>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2 text-left font-medium">Ingrediente</th>
              <th className="pb-2 text-left font-medium">Default</th>
              <th className="pb-2 text-left font-medium">Rimuovibile</th>
              <th className="pb-2 text-left font-medium">Aggiungibile</th>
              <th className="pb-2 text-left font-medium">Prezzo extra (€)</th>
              <th className="pb-2 text-right font-medium">Rimuovi</th>
            </tr>
          </thead>
          <tbody>
            {product.productIngredients.map((pi) => {
              const e = edits[pi.id] ?? pi;
              const ingredientName = pi.ingredient?.name ?? "";
              const displayName = ingredientName ? ingredientName.charAt(0).toUpperCase() + ingredientName.slice(1) : "—";
              return (
                <tr key={pi.id} className="border-b border-border">
                  <td className="py-2">
                    {displayName}
                  </td>
                  <td className="py-2">
                    <input
                      type="checkbox"
                      checked={e.isDefault}
                      onChange={(ev) => updateEdit(pi.id, "isDefault", ev.target.checked)}
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="checkbox"
                      checked={e.allowRemove}
                      onChange={(ev) => updateEdit(pi.id, "allowRemove", ev.target.checked)}
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="checkbox"
                      checked={e.allowAdd}
                      onChange={(ev) => updateEdit(pi.id, "allowAdd", ev.target.checked)}
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={e.addPriceCentsOverride != null ? e.addPriceCentsOverride / 100 : ""}
                      onChange={(ev) =>
                        updateEdit(
                          pi.id,
                          "addPriceCentsOverride",
                          ev.target.value !== "" ? Math.round(parseFloat(ev.target.value) * 100) : null
                        )
                      }
                      className="w-20 rounded border border-border px-2 py-1"
                    />
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeIngredient(pi)}
                      disabled={saving}
                      className="text-destructive hover:underline disabled:opacity-50"
                    >
                      Rimuovi
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? "Salvataggio..." : "Salva"}
      </button>
    </div>
  );
}
