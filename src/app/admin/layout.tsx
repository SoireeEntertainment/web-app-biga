import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="sticky top-0 z-10 border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <Link href="/admin" className="font-semibold text-primary">
            Admin
          </Link>
          <Link href="/admin/orders" className="text-sm text-muted-foreground hover:text-foreground">
            Ordini
          </Link>
          <Link href="/admin/customers" className="text-sm text-muted-foreground hover:text-foreground">
            Clienti
          </Link>
          <Link href="/admin/stats" className="text-sm text-muted-foreground hover:text-foreground">
            Statistiche
          </Link>
          <Link href="/admin/ingredients" className="text-sm text-muted-foreground hover:text-foreground">
            Ingredienti
          </Link>
          <Link href="/admin/menu" className="text-sm text-muted-foreground hover:text-foreground">
            Menu
          </Link>
          <Link href="/admin/delivery" className="text-sm text-muted-foreground hover:text-foreground">
            Consegna
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
