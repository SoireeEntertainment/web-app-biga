"use client";

import { useEffect, useState } from "react";

type Delivery = {
  deliveryName: string | null;
  deliveryPhone: string | null;
  deliveryEmail: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  zip: string | null;
  notes: string | null;
};

const emptyForm: Record<string, string> = {
  deliveryName: "",
  deliveryPhone: "",
  deliveryEmail: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  zip: "",
  notes: "",
};

function toForm(d: Delivery | null, fallback: { fullName?: string | null; primaryEmail?: string | null; primaryPhone?: string | null }): Record<string, string> {
  if (d) {
    return {
      deliveryName: d.deliveryName ?? "",
      deliveryPhone: d.deliveryPhone ?? "",
      deliveryEmail: d.deliveryEmail ?? "",
      addressLine1: d.addressLine1 ?? "",
      addressLine2: d.addressLine2 ?? "",
      city: d.city ?? "",
      zip: d.zip ?? "",
      notes: d.notes ?? "",
    };
  }
  return {
    ...emptyForm,
    deliveryName: fallback.fullName ?? "",
    deliveryPhone: fallback.primaryPhone ?? "",
    deliveryEmail: fallback.primaryEmail ?? "",
  };
}

export function DeliveryForm() {
  const [form, setForm] = useState<Record<string, string>>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/account/clerk-profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setForm(toForm(d.delivery, { fullName: d.fullName, primaryEmail: d.primaryEmail, primaryPhone: d.primaryPhone }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/account/clerk-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryName: form.deliveryName || undefined,
          deliveryPhone: form.deliveryPhone || undefined,
          deliveryEmail: form.deliveryEmail || undefined,
          addressLine1: form.addressLine1 || undefined,
          addressLine2: form.addressLine2 || undefined,
          city: form.city || undefined,
          zip: form.zip || undefined,
          notes: form.notes || undefined,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="font-heading text-lg font-semibold">Dati di consegna</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Nome, telefono, email e indirizzo usati nel checkout. Modificali qui.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label className="block text-sm font-medium">Nome per consegna</label>
          <input
            type="text"
            value={form.deliveryName}
            onChange={(e) => setForm((f) => ({ ...f, deliveryName: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2"
            placeholder="Mario Rossi"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Telefono per consegna</label>
          <input
            type="tel"
            value={form.deliveryPhone}
            onChange={(e) => setForm((f) => ({ ...f, deliveryPhone: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2"
            placeholder="+39 333 1234567"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Email per notifiche</label>
          <input
            type="email"
            value={form.deliveryEmail}
            onChange={(e) => setForm((f) => ({ ...f, deliveryEmail: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2"
            placeholder="mario@email.it"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Indirizzo</label>
          <input
            type="text"
            value={form.addressLine1}
            onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2"
            placeholder="Via Roma 1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground">Indirizzo (seconda riga)</label>
          <input
            type="text"
            value={form.addressLine2}
            onChange={(e) => setForm((f) => ({ ...f, addressLine2: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2"
            placeholder="Interno 2, citofono Bianchi"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Città</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              placeholder="Villanova d'Asti"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">CAP</label>
            <input
              type="text"
              value={form.zip}
              onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              placeholder="14019"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground">Note (citofono, piano, ecc.)</label>
          <input
            type="text"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2"
            placeholder="Citofono Bianchi, 2° piano"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-primary py-3 font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Salvataggio..." : saved ? "Dati salvati per i prossimi ordini ✓" : "Salva per i prossimi ordini"}
        </button>
      </form>
    </section>
  );
}
