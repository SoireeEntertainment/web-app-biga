"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { UserButton, useClerk } from "@clerk/nextjs";

type ProfileData = {
  deliveryName: string | null;
  deliveryPhone: string | null;
  deliveryEmail: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  zip: string | null;
  notes: string | null;
};

type AccountData = {
  clerk: {
    id: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  profile: ProfileData | null;
};

const MENU_URL = "/biga-villanova/order";

function toForm(p: ProfileData | null, clerk: AccountData["clerk"]): Record<keyof ProfileData, string> {
  if (p) {
    return {
      deliveryName: p.deliveryName ?? "",
      deliveryPhone: p.deliveryPhone ?? "",
      deliveryEmail: p.deliveryEmail ?? "",
      addressLine1: p.addressLine1 ?? "",
      addressLine2: p.addressLine2 ?? "",
      city: p.city ?? "",
      zip: p.zip ?? "",
      notes: p.notes ?? "",
    };
  }
  return {
    deliveryName: clerk?.fullName ?? "",
    deliveryPhone: clerk?.phone ?? "",
    deliveryEmail: clerk?.email ?? "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    zip: "",
    notes: "",
  };
}

export default function AccountPage() {
  const [data, setData] = useState<AccountData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<Record<keyof ProfileData, string>>({
    deliveryName: "",
    deliveryPhone: "",
    deliveryEmail: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    zip: "",
    notes: "",
  });
  const { signOut } = useClerk();

  const loadProfile = useCallback(async () => {
    const r = await fetch("/api/account/profile");
    if (!r.ok) return;
    const d = await r.json();
    setData(d);
    setForm(toForm(d.profile ?? null, d.clerk));
  }, []);

  useEffect(() => {
    fetch("/api/account/claim-orders", { method: "POST" }).catch(() => {});
    loadProfile();
  }, [loadProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/account/profile", {
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
        const json = await res.json();
        if (json.profile) setForm(toForm(json.profile, data?.clerk ?? null));
        await loadProfile();
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    if (typeof window !== "undefined" && !window.confirm("Vuoi uscire dall'account?")) return;
    signOut({ redirectUrl: MENU_URL });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Il tuo account</h1>
        <UserButton
          afterSignOutUrl={MENU_URL}
          appearance={{ elements: { avatarBox: "h-9 w-9" } }}
        />
      </div>

      {/* Sezione 1 — Profilo (sola lettura + Gestisci account) */}
      <section className="mt-8 rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Profilo</h2>
        {data?.clerk && (
          <dl className="mt-3 space-y-1 text-sm">
            <div>
              <dt className="text-muted-foreground">Nome</dt>
              <dd className="font-medium">{data.clerk.fullName || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{data.clerk.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Telefono</dt>
              <dd className="font-medium">{data.clerk.phone || "—"}</dd>
            </div>
          </dl>
        )}
        <Link
          href="/account/manage"
          className="mt-4 inline-block rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Gestisci account
        </Link>
      </section>

      {/* Sezione 2 — Dati per ordini (unica sorgente per checkout) */}
      <section className="mt-6 rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Dati per le consegne</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Nome, telefono, email e indirizzo usati nel checkout. Modificali qui.
        </p>
        <form onSubmit={handleSaveProfile} className="mt-4 space-y-3">
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
            {saving ? "Salvataggio..." : saved ? "Salvato ✓" : "Salva per i prossimi ordini"}
          </button>
        </form>
      </section>

      {/* Sezione 3 — Ordini */}
      <section className="mt-6 rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Ordini</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Visualizza lo storico e lo stato dei tuoi ordini.
        </p>
        <Link
          href="/account/orders"
          className="mt-4 inline-flex w-full items-center justify-center rounded-full border-2 border-primary bg-primary/5 py-3 font-medium text-primary hover:bg-primary/10"
        >
          I tuoi ordini
        </Link>
      </section>

      <p className="mt-8 text-center">
        <Link href="/" className="text-sm text-muted-foreground underline hover:text-foreground">
          ← Torna al sito
        </Link>
      </p>

      <div className="mt-8 border-t border-border pt-6">
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full rounded-full border-2 border-destructive/50 py-3 text-sm font-medium text-destructive hover:bg-destructive/10"
        >
          Esci dall&apos;account
        </button>
      </div>
    </div>
  );
}
