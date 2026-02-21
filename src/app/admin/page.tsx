import Link from "next/link";

const cards = [
  {
    href: "/admin/orders",
    title: "Ordini",
    description: "Lista ordini, filtri e cambio stato",
  },
  {
    href: "/admin/customers",
    title: "Clienti",
    description: "Raggruppati per telefono, storico ordini",
  },
  {
    href: "/admin/stats",
    title: "Statistiche",
    description: "KPI, fatturato, top prodotti",
  },
  {
    href: "/admin/ingredients",
    title: "Ingredienti",
    description: "Catalogo e prezzo aggiunta",
  },
  {
    href: "/admin/menu",
    title: "Menu",
    description: "Ingredienti per pizza (default, removibile, aggiungibile)",
  },
  {
    href: "/admin/delivery",
    title: "Consegna",
    description: "Raggio (km), coordinate, attiva",
  },
];

export default function AdminHome() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Gestione ordini e clienti per Biga Pizzeria e altri ristoranti.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group flex flex-col rounded-xl border border-border bg-card p-6 text-left shadow-sm transition hover:border-primary/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <h2 className="text-lg font-semibold text-foreground group-hover:text-primary">
              {card.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {card.description}
            </p>
            <span className="mt-4 text-sm font-medium text-primary opacity-0 transition group-hover:opacity-100">
              Vai alla sezione →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
