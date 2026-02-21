import Link from "next/link";
import Image from "next/image";

const BIGA_LOGO =
  "https://bigapizzeria.it/wp-content/uploads/2025/05/logo-icona-quadrato.jpg";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <main className="w-full max-w-md text-center">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Ordina online
        </h1>
        <p className="mt-2 text-muted-foreground">
          Scegli il ristorante e inizia il tuo ordine.
        </p>
        <div className="mt-8 space-y-4">
          <Link
            href="/biga-villanova/order"
            className="flex items-center gap-4 rounded-2xl border-2 border-primary bg-primary/5 px-6 py-5 text-left transition hover:border-primary hover:bg-primary/10"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
              <Image
                src={BIGA_LOGO}
                alt="Biga Pizzeria"
                fill
                className="object-cover"
                sizes="64px"
                priority
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-heading font-semibold text-primary">
                Biga Pizzeria
              </span>
              <p className="mt-1 text-sm text-muted-foreground">
                Villanova d&apos;Asti · Pizza, focacce, fritti
              </p>
            </div>
          </Link>
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          <Link href="/account/login" className="underline hover:text-foreground">
            Accedi
          </Link>
          {" · "}
          <Link href="/account/orders" className="underline hover:text-foreground">
            I miei ordini
          </Link>
        </p>
      </main>
    </div>
  );
}
