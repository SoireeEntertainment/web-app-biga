import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { ingredientChanges: true } },
      restaurant: true,
    },
  });
  if (!order) notFound();

  const statusLabel: Record<string, string> = {
    NEW: "Ordine ricevuto",
    ACCEPTED: "Ordine accettato",
    PREPARING: "In preparazione",
    READY: "Pronto per il ritiro",
    COMPLETED: "Completato",
    CANCELED: "Annullato",
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="font-heading text-xl font-semibold text-primary">
            Ordine confermato
          </h1>
          <p className="mt-2 text-muted-foreground">
            Il tuo ordine <strong>#{orderId.slice(-8)}</strong> è stato ricevuto.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Telefono per tracciare l&apos;ordine: <strong>{order.customerPhone}</strong>
          </p>
          <p className="mt-2 font-medium">
            Stato: {statusLabel[order.status] ?? order.status}
          </p>
          {order.paymentMethod === "cash" && (
            <p className="mt-2 text-sm text-muted-foreground">
              Pagamento in contanti al ritiro/consegna.
            </p>
          )}
          <ul className="mt-6 space-y-2 border-t border-border pt-4">
            {order.items.map((i) => {
              const removed = i.ingredientChanges.filter((c) => c.type === "REMOVE").map((c) => c.ingredientNameSnapshot).filter(Boolean);
              const added = i.ingredientChanges.filter((c) => c.type === "ADD");
              return (
                <li key={i.id} className="flex flex-wrap justify-between gap-x-2 text-sm">
                  <span>
                    {i.name} × {i.quantity}
                    {removed.length > 0 && (
                      <span className="text-muted-foreground"> · Senza: {removed.join(", ")}</span>
                    )}
                    {added.length > 0 && (
                      <span className="text-muted-foreground">
                        {" "}
                        {added.map((c) => `+ ${c.ingredientNameSnapshot}`).join(" ")}
                      </span>
                    )}
                    {i.notes && <span className="text-muted-foreground"> ({i.notes})</span>}
                  </span>
                  <span>{formatPrice(i.priceCents * i.quantity)}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex justify-between border-t border-border pt-4 font-medium">
            <span>Totale</span>
            <span>{formatPrice(order.totalCents)}</span>
          </div>
          {order.type === "DELIVERY" && order.deliveryAddress && (
            <p className="mt-4 text-sm text-muted-foreground">
              Consegna: {order.deliveryAddress}, {order.deliveryCity} {order.deliveryCap}
            </p>
          )}
          {order.type === "PICKUP" && (
            <p className="mt-4 text-sm text-muted-foreground">
              Ritiro: {order.restaurant.address}, {order.restaurant.city}. Tel. {order.restaurant.phone}
            </p>
          )}
        </div>
        <div className="mt-6 text-center">
          <Link
            href={`/${order.restaurant.slug}/order`}
            className="text-primary font-medium underline"
          >
            Torna al menù
          </Link>
        </div>
      </main>
    </div>
  );
}
