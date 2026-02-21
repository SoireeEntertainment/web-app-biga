"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function PaymentForm({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements) return;
      setError(null);
      setLoading(true);
      try {
        const { error: submitError } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/order/${orderId}/confirmation`,
          },
        });
        if (submitError) {
          setError(submitError.message ?? "Pagamento non riuscito");
          setLoading(false);
        }
      } catch {
        setError("Errore durante il pagamento");
        setLoading(false);
      }
    },
    [stripe, elements, orderId]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: "tabs",
          paymentMethodOrder: ["card", "apple_pay"],
        }}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full rounded-full bg-primary py-3 font-medium text-primary-foreground disabled:opacity-50"
      >
        {loading ? "Elaborazione..." : "Paga ora"}
      </button>
    </form>
  );
}

function PayPageContent({
  orderId,
  clientSecret,
}: {
  orderId: string;
  clientSecret: string;
}) {
  const options = { clientSecret, appearance: { theme: "stripe" as const } };
  return (
    <div className="min-h-screen bg-background py-8">
      <main className="mx-auto max-w-md px-4">
        <h1 className="mb-6 text-xl font-semibold">Completa il pagamento</h1>
        {stripePromise && (
          <Elements stripe={stripePromise} options={options}>
            <PaymentForm orderId={orderId} />
          </Elements>
        )}
      </main>
    </div>
  );
}

function PayPageInner({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const [orderId, setOrderId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientSecret = searchParams.get("client_secret");

  useEffect(() => {
    params.then((p) => setOrderId(p.orderId));
  }, [params]);

  useEffect(() => {
    if (orderId && !clientSecret) {
      router.replace(`/order/${orderId}/confirmation`);
    }
  }, [orderId, clientSecret, router]);

  if (!orderId || !clientSecret) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  return <PayPageContent orderId={orderId} clientSecret={clientSecret} />;
}

export default function PayPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      }
    >
      <PayPageInner params={params} />
    </Suspense>
  );
}
