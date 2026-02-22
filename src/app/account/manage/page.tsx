"use client";

import Link from "next/link";
import { UserProfile, useClerk } from "@clerk/nextjs";
import { DeliveryForm } from "./DeliveryForm";

const MENU_URL = "/biga-villanova/order";

export default function AccountManagePage() {
  const { signOut } = useClerk();

  const handleSignOut = () => {
    if (typeof window !== "undefined" && !window.confirm("Vuoi uscire dall'account?")) return;
    signOut({ redirectUrl: MENU_URL });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center px-4">
          <Link
            href={MENU_URL}
            className="text-primary font-medium hover:underline"
          >
            ← Torna al menù
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        <DeliveryForm />
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Gestisci account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Email, password e sicurezza.
          </p>
          <div className="mt-4">
            <UserProfile
              routing="path"
              path="/account/manage"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-0",
                },
              }}
            />
          </div>
        </section>
        <div className="border-t border-border pt-6">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-full border-2 border-destructive/50 py-3 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            Esci dall&apos;account
          </button>
        </div>
      </div>
    </div>
  );
}
