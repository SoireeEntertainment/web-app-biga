# Biga Order – Web App ordini (stile Flipdish)

Web app di food ordering multi-tenant, configurata per **Biga Pizzeria – Villanova d'Asti**.

## Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS** (tema brand Biga)
- **Prisma** + PostgreSQL (Neon)
- **Stripe** (Payment Element: Carta + Apple Pay)
- **Zod** + **bcryptjs** (validazione e auth)

## Setup rapido

1. **Dipendenze**
   ```bash
   npm install
   ```

2. **Variabili d'ambiente**
   - Copia `.env.example` in `.env`
   - **DATABASE_URL**: connection string Postgres (es. [Neon](https://neon.tech))
   - **STRIPE_SECRET_KEY** / **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**: da Stripe Dashboard
   - **STRIPE_WEBHOOK_SECRET**: da `stripe listen` (vedi sotto)
   - **ADMIN_USER** / **ADMIN_PASSWORD**: Basic Auth per `/admin`

3. **Database**
   ```bash
   npm run db:push
   npm run import-menu
   ```
   (`import-menu` legge `data/menu.json` e crea il ristorante `biga-villanova` con categorie e prodotti.)

4. **Avvio**
   ```bash
   npm run dev
   ```
   Apri [http://localhost:3000](http://localhost:3000).

## Scraping menu da bigapizzeria.it (opzionale)

Per rigenerare `data/menu.json` dal sito:

```bash
npx playwright install chromium
npm run scrape
npm run import-menu
```

## Pagamenti Stripe (test)

- **Webhook in locale**: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Copia il **webhook signing secret** in `.env` come `STRIPE_WEBHOOK_SECRET`.
- **Apple Pay**: in dev va testato su Safari con Wallet configurato; in produzione serve HTTPS e dominio verificato.

## Route principali

| Route | Descrizione |
|-------|-------------|
| `/` | Home – link al ristorante |
| `/[restaurantSlug]/order` | Menù e carrello |
| `/[restaurantSlug]/checkout` | Checkout (dati, tipo ordine, pagamento) |
| `/order/[orderId]/confirmation` | Conferma ordine |
| `/order/[orderId]/pay` | Pagamento Stripe (Payment Element) |
| `/account/login`, `/account/register`, `/account/orders` | Auth cliente (opzionale) |
| `/admin`, `/admin/orders`, `/admin/customers`, `/admin/stats` | Dashboard admin (Basic Auth) |

## Scripts

- `npm run dev` – dev server
- `npm run build` / `npm run start` – build e avvio produzione
- `npm run scrape` – scrape menu Biga → `data/menu.json`
- `npm run import-menu` – import menu da `data/menu.json` nel DB
- `npm run db:generate` – genera Prisma Client
- `npm run db:push` – applica schema al DB (no migration files)
- `npm run db:migrate` – crea/applica migration
