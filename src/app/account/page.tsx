"use client";

import { useEffect } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function AccountPage() {
  useEffect(() => {
    fetch("/api/account/claim-orders", { method: "POST" }).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Il tuo account</h1>
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "h-9 w-9",
            },
          }}
        />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Qui puoi gestire il tuo profilo e vedere lo storico ordini.
      </p>
      <nav className="mt-8 flex flex-col gap-2">
        <Link
          href="/account/orders"
          className="rounded-xl border border-border bg-card p-4 font-medium text-foreground shadow-sm transition hover:border-primary/30 hover:bg-muted/30"
        >
          I tuoi ordini
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-border bg-card p-4 text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
        >
          Torna al sito
        </Link>
      </nav>
    </div>
  );
}
