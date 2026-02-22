"use client";

import { useEffect } from "react";
import Link from "next/link";
import { UserButton, useUser, useClerk } from "@clerk/nextjs";

const MENU_URL = "/biga-villanova/order";

export default function AccountPage() {
  const { user } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    fetch("/api/account/claim-orders", { method: "POST" }).catch(() => {});
  }, []);

  const handleSignOut = () => {
    if (typeof window !== "undefined" && !window.confirm("Vuoi uscire dall'account?")) return;
    signOut({ redirectUrl: MENU_URL });
  };

  const fullName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || null : null;
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const phone = user?.primaryPhoneNumber?.phoneNumber ?? null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Il tuo account</h1>
        <UserButton
          afterSignOutUrl={MENU_URL}
          appearance={{ elements: { avatarBox: "h-9 w-9" } }}
        />
      </div>

      <section className="mt-8 rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Profilo</h2>
        {(fullName ?? email ?? phone) && (
          <dl className="mt-3 space-y-1 text-sm">
            <div>
              <dt className="text-muted-foreground">Nome</dt>
              <dd className="font-medium">{fullName || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{email || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Telefono</dt>
              <dd className="font-medium">{phone || "—"}</dd>
            </div>
          </dl>
        )}
        <Link
          href="/account/manage"
          className="mt-4 inline-block rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Gestisci account e dati di consegna
        </Link>
      </section>

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
