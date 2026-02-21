"use client";

import { useEffect, useState } from "react";

type Restaurant = {
  id: string;
  slug: string;
  name: string;
  deliveryEnabled: boolean;
  deliveryRadiusKm: number | null;
  restaurantLat: number | null;
  restaurantLng: number | null;
};

export default function AdminDeliveryPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, Partial<Restaurant>>>({});

  useEffect(() => {
    fetch("/api/admin/restaurants")
      .then((r) => (r.ok ? r.json() : []))
      .then(setRestaurants)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setForm((prev) => {
      const next = { ...prev };
      for (const r of restaurants) {
        next[r.id] = {
          deliveryEnabled: r.deliveryEnabled,
          deliveryRadiusKm: r.deliveryRadiusKm ?? undefined,
          restaurantLat: r.restaurantLat ?? undefined,
          restaurantLng: r.restaurantLng ?? undefined,
        };
      }
      return next;
    });
  }, [restaurants]);

  const save = async (id: string) => {
    const data = form[id];
    if (!data) return;
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/restaurants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryEnabled: data.deliveryEnabled,
          deliveryRadiusKm: data.deliveryRadiusKm,
          restaurantLat: data.restaurantLat,
          restaurantLng: data.restaurantLng,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setRestaurants((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
      }
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <p className="text-muted-foreground">Caricamento...</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Consegna a domicilio</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Raggio di consegna (km) e coordinate ristorante per il controllo distanza (Haversine). Se il cliente invia lat/lng in checkout, l&apos;ordine viene bloccato se fuori raggio.
      </p>
      <div className="mt-6 space-y-6">
        {restaurants.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-medium">{r.name}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form[r.id]?.deliveryEnabled ?? r.deliveryEnabled}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [r.id]: { ...prev[r.id], deliveryEnabled: e.target.checked },
                    }))
                  }
                />
                Consegna attiva
              </label>
              <div>
                <label className="block text-sm font-medium">Raggio (km)</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form[r.id]?.deliveryRadiusKm ?? r.deliveryRadiusKm ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [r.id]: {
                        ...prev[r.id],
                        deliveryRadiusKm: e.target.value ? parseFloat(e.target.value) : undefined,
                      },
                    }))
                  }
                  className="mt-1 w-24 rounded-lg border border-border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Latitudine ristorante</label>
                <input
                  type="number"
                  step="any"
                  value={form[r.id]?.restaurantLat ?? r.restaurantLat ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [r.id]: {
                        ...prev[r.id],
                        restaurantLat: e.target.value ? parseFloat(e.target.value) : undefined,
                      },
                    }))
                  }
                  className="mt-1 w-32 rounded-lg border border-border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Longitudine ristorante</label>
                <input
                  type="number"
                  step="any"
                  value={form[r.id]?.restaurantLng ?? r.restaurantLng ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [r.id]: {
                        ...prev[r.id],
                        restaurantLng: e.target.value ? parseFloat(e.target.value) : undefined,
                      },
                    }))
                  }
                  className="mt-1 w-32 rounded-lg border border-border px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => save(r.id)}
              disabled={saving === r.id}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving === r.id ? "Salvataggio..." : "Salva"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
