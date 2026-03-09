/**
 * Invio email conferma ordine.
 * Con RESEND_API_KEY configurato usa Resend; altrimenti solo log (ordine viene comunque creato).
 */

export type OrderConfirmationData = {
  customerName: string;
  orderId: string;
  type: "DELIVERY" | "PICKUP";
  items: { name: string; quantity: number; priceCents: number }[];
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  deliveryAddress?: string | null;
  deliverySlot?: string | null;
  orderNotes?: string | null;
};

function formatPrice(cents: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function buildOrderConfirmationHtml(data: OrderConfirmationData): string {
  const typeLabel = data.type === "DELIVERY" ? "Consegna a domicilio" : "Ritiro al ristorante";
  const itemsList = data.items
    .map((i) => `<tr><td>${i.name} × ${i.quantity}</td><td>${formatPrice(i.priceCents * i.quantity)}</td></tr>`)
    .join("");
  const deliveryBlock =
    data.type === "DELIVERY" && data.deliveryAddress
      ? `
    <p><strong>Indirizzo:</strong> ${data.deliveryAddress}</p>
    ${data.deliverySlot ? `<p><strong>Slot orario:</strong> ${data.deliverySlot}</p>` : ""}
  `
      : "";
  const notesBlock = data.orderNotes ? `<p><strong>Note ordine:</strong> ${data.orderNotes}</p>` : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Conferma ordine</title></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2>Conferma ordine</h2>
  <p>Ciao ${data.customerName},</p>
  <p>Il tuo ordine <strong>#${data.orderId.slice(-8)}</strong> è stato ricevuto.</p>
  <p><strong>Tipo:</strong> ${typeLabel}</p>
  ${deliveryBlock}
  ${notesBlock}
  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    <thead>
      <tr style="border-bottom: 1px solid #ddd;"><th style="text-align: left;">Prodotto</th><th style="text-align: right;">Totale</th></tr>
    </thead>
    <tbody>${itemsList}</tbody>
  </table>
  <p>Subtotale: ${formatPrice(data.subtotalCents)}</p>
  ${data.deliveryFeeCents > 0 ? `<p>Consegna: ${formatPrice(data.deliveryFeeCents)}</p>` : ""}
  <p><strong>Totale: ${formatPrice(data.totalCents)}</strong></p>
  <p style="margin-top: 24px; color: #666;">Grazie per aver ordinato da Biga Pizzeria.</p>
</body>
</html>
  `.trim();
}

export async function sendOrderConfirmationEmail(
  to: string,
  data: OrderConfirmationData
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.log("[email] RESEND_API_KEY non impostata, skip invio conferma a", to);
    }
    return { ok: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? "Biga Pizzeria <onboarding@resend.dev>",
        to: [to],
        subject: `Conferma ordine #${data.orderId.slice(-8)} - Biga Pizzeria`,
        html: buildOrderConfirmationHtml(data),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = (err as { message?: string })?.message ?? res.statusText;
      if (process.env.NODE_ENV === "development") console.error("[email] Resend error:", msg);
      return { ok: false, error: msg };
    }
    return { ok: true };
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.error("[email]", e);
    return { ok: false, error: String(e) };
  }
}
