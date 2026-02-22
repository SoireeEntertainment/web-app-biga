import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { customerProfileSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  const profile = await prisma.customerProfile.findUnique({
    where: { clerkUserId: userId },
  });

  return NextResponse.json({
    clerk: user
      ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
          email: user.primaryEmailAddress?.emailAddress ?? null,
          phone: user.primaryPhoneNumber?.phoneNumber ?? null,
        }
      : null,
    profile: profile
      ? {
          deliveryName: profile.deliveryName,
          deliveryPhone: profile.deliveryPhone,
          deliveryEmail: profile.deliveryEmail,
          addressLine1: profile.addressLine1,
          addressLine2: profile.addressLine2,
          city: profile.city,
          zip: profile.zip,
          notes: profile.notes,
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
  const profile = await prisma.customerProfile.upsert({
    where: { clerkUserId: userId },
    create: {
      clerkUserId: userId,
      deliveryName: data.deliveryName ?? null,
      deliveryPhone: data.deliveryPhone ?? null,
      deliveryEmail: (data.deliveryEmail && data.deliveryEmail.trim()) ? data.deliveryEmail.trim() : null,
      addressLine1: data.addressLine1 ?? null,
      addressLine2: data.addressLine2 ?? null,
      city: data.city ?? null,
      zip: data.zip ?? null,
      notes: data.notes ?? null,
    },
    update: {
      deliveryName: data.deliveryName ?? null,
      deliveryPhone: data.deliveryPhone ?? null,
      deliveryEmail: (data.deliveryEmail && data.deliveryEmail.trim()) ? data.deliveryEmail.trim() : null,
      addressLine1: data.addressLine1 ?? null,
      addressLine2: data.addressLine2 ?? null,
      city: data.city ?? null,
      zip: data.zip ?? null,
      notes: data.notes ?? null,
    },
  });

  return NextResponse.json({
    profile: {
      deliveryName: profile.deliveryName,
      deliveryPhone: profile.deliveryPhone,
      deliveryEmail: profile.deliveryEmail,
      addressLine1: profile.addressLine1,
      addressLine2: profile.addressLine2,
      city: profile.city,
      zip: profile.zip,
      notes: profile.notes,
    },
  });
}
