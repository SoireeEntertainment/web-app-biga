import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { customerProfileSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

type DeliveryMetadata = {
  deliveryName?: string | null;
  deliveryPhone?: string | null;
  deliveryEmail?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  zip?: string | null;
  notes?: string | null;
};

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const delivery = (user.unsafeMetadata?.delivery as DeliveryMetadata | undefined) ?? null;

  return NextResponse.json({
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    fullName: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
    primaryEmail: user.primaryEmailAddress?.emailAddress ?? null,
    primaryPhone: user.primaryPhoneNumber?.phoneNumber ?? null,
    delivery: delivery
      ? {
          deliveryName: delivery.deliveryName ?? null,
          deliveryPhone: delivery.deliveryPhone ?? null,
          deliveryEmail: delivery.deliveryEmail ?? null,
          addressLine1: delivery.addressLine1 ?? null,
          addressLine2: delivery.addressLine2 ?? null,
          city: delivery.city ?? null,
          zip: delivery.zip ?? null,
          notes: delivery.notes ?? null,
        }
      : null,
  });
}

export async function PUT(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = customerProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dati non validi", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const trim = (s: string | undefined) => (s && s.trim()) || undefined;
  const emailVal = trim(data.deliveryEmail);
  const newDelivery: DeliveryMetadata = {
    deliveryName: trim(data.deliveryName) ?? null,
    deliveryPhone: trim(data.deliveryPhone) ?? null,
    deliveryEmail: emailVal ? emailVal.toLowerCase() : null,
    addressLine1: trim(data.addressLine1) ?? null,
    addressLine2: trim(data.addressLine2) ?? null,
    city: trim(data.city) ?? null,
    zip: trim(data.zip) ?? null,
    notes: trim(data.notes) ?? null,
  };

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const existing = (user.unsafeMetadata ?? {}) as Record<string, unknown>;

  await client.users.updateUserMetadata(userId, {
    unsafeMetadata: {
      ...existing,
      delivery: newDelivery,
    },
  });

  return NextResponse.json({
    delivery: newDelivery,
  });
}
