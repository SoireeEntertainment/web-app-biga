"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Errore registrazione");
        setLoading(false);
        return;
      }
      router.push("/account/orders");
      router.refresh();
    } catch {
      setError("Errore di rete");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold">Registrati</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Crea un account per salvare lo storico ordini.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && (
          <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Password (min. 8 caratteri)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Nome (opzionale)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-primary py-3 font-medium text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Registrazione..." : "Registrati"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Hai già un account?{" "}
        <Link href="/account/login" className="text-primary underline">
          Accedi
        </Link>
      </p>
      <p className="mt-4 text-center">
        <Link href="/" className="text-sm text-muted-foreground underline">
          ← Torna alla home
        </Link>
      </p>
    </div>
  );
}
