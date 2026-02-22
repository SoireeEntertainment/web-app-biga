import Link from "next/link";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";

const adminNavItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Ordini", href: "/admin/orders" },
  { label: "Clienti", href: "/admin/customers" },
  { label: "Statistiche", href: "/admin/stats" },
  { label: "Ingredienti", href: "/admin/ingredients" },
  { label: "Menu", href: "/admin/menu" },
  { label: "Consegna", href: "/admin/delivery" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="sticky top-0 z-10 border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <AdminMobileNav items={adminNavItems} />
          <Link
            href="/admin"
            className="font-semibold text-primary hidden md:inline-block"
          >
            Admin
          </Link>
          <div className="hidden md:flex md:items-center md:gap-6">
            {adminNavItems.map((item) => (
              <AdminNavLink key={item.href} href={item.href}>
                {item.label}
              </AdminNavLink>
            ))}
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

function AdminNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-muted-foreground hover:text-foreground"
    >
      {children}
    </Link>
  );
}
