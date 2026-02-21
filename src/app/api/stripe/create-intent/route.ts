import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }
  const body = await request.json();
  const orderId = body.orderId as string;
  const amountCents = Number(body.amountCents);

  if (!orderId || !amountCents || amountCents <= 0) {
    return NextResponse.json(
      { error: "orderId and amountCents required" },
      { status: 400 }
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { restaurant: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.paymentMethod === "cash") {
    return NextResponse.json(
      { error: "Order is cash payment" },
      { status: 400 }
    );
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "eur",
    metadata: { orderId },
    automatic_payment_methods: { enabled: true },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: {
      stripePaymentIntentId: paymentIntent.id,
      stripePaymentIntentStatus: paymentIntent.status,
    },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    orderId,
  });
}
