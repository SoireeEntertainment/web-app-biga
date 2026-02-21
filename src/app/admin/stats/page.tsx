"use client";

import { useEffect, useState } from "react";

type Stats = {
  period: number;
  orderCount: number;
  totalCents: number;
  aovCents: number;
  byPaymentMethod: Record<string, { count: number; cents: number }>;
  topProducts: { name: string; quantity: number }[];
};

function formatPrice(cents: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [period, setPeriod] = useState("7");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/stats?period=${period}`)
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Statistiche</h1>
      <div className="mt-4 flex gap-2">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          <option value="1">Oggi</option>
          <option value="7">Ultimi 7 giorni</option>
          <option value="30">Ultimi 30 giorni</option>
        </select>
      </div>
      {loading ? (
        <p className="mt-6 text-muted-foreground">Caricamento...</p>
      ) : stats ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-medium">KPI</h2>
            <dl className="mt-4 space-y-2">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Ordini</dt>
                <dd className="font-medium">{stats.orderCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Fatturato</dt>
                <dd className="font-medium">{formatPrice(stats.totalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">AOV</dt>
                <dd className="font-medium">{formatPrice(stats.aovCents)}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-medium">Per metodo pagamento</h2>
            <ul className="mt-4 space-y-2">
              {Object.entries(stats.byPaymentMethod || {}).map(([method, v]) => (
                <li key={method} className="flex justify-between text-sm">
                  <span>{method}</span>
                  <span>
                    {v.count} ordini · {formatPrice(v.cents)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 md:col-span-2">
            <h2 className="text-lg font-medium">Top prodotti</h2>
            <ul className="mt-4 space-y-1">
              {stats.topProducts?.map((p, i) => (
                <li key={p.name} className="flex justify-between text-sm">
                  <span>
                    {i + 1}. {p.name}
                  </span>
                  <span>{p.quantity} pz</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
