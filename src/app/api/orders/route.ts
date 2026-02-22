import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderCreateSchema } from "@/lib/validations";
import { getSession } from "@/lib/auth";
import { haversineKm } from "@/lib/geo";
import { computeItemPriceCents } from "@/lib/pricing";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = orderCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: data.restaurantId },
  });
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  // Delivery radius check (when coords available)
  if (
    data.type === "DELIVERY" &&
    restaurant.deliveryEnabled &&
    restaurant.deliveryRadiusKm != null &&
    restaurant.restaurantLat != null &&
    restaurant.restaurantLng != null &&
    data.deliveryLat != null &&
    data.deliveryLng != null
  ) {
    const distanceKm = haversineKm(
      restaurant.restaurantLat,
      restaurant.restaurantLng,
      data.deliveryLat,
      data.deliveryLng
    );
    if (distanceKm > restaurant.deliveryRadiusKm) {
      return NextResponse.json(
        {
          error: "Indirizzo fuori dall'area di consegna",
          code: "DELIVERY_OUT_OF_RANGE",
        },
        { status: 400 }
      );
    }
  }

  const productIds = data.items
    .map((i) => i.productId)
    .filter((id): id is string => !!id);

  const [products, activeIngredients] = await Promise.all([
    productIds.length > 0
      ? prisma.product.findMany({
          where: { id: { in: productIds }, restaurantId: restaurant.id },
          include: {
            productIngredients: { include: { ingredient: true } },
          },
        })
      : [],
    prisma.ingredient.findMany({
      where: { restaurantId: restaurant.id, isActive: true },
      select: { id: true, name: true, defaultAddPriceCents: true },
    }),
  ]);
  const productMap = new Map(products.map((p) => [p.id, p]));
  const activeIngredientIds = new Set(activeIngredients.map((i) => i.id));
  const ingredientByName = new Map(activeIngredients.map((i) => [i.id, i]));

  const validatedItems: {
    productId: string | null;
    name: string;
    priceCents: number;
    quantity: number;
    notes: string | null;
    removedIngredientIds: string[];
    addedIngredientIds: string[];
  }[] = [];

  for (const item of data.items) {
    const removed = item.removedIngredientIds ?? [];
    const added = item.addedIngredientIds ?? [];

    if (item.productId) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Prodotto non trovato: ${item.name}` },
          { status: 400 }
        );
      }
      // Solo Fritti/Bevande/Dolci hanno isCustomizableIngredients === false; per true o undefined (client vecchio) consentiamo personalizzazione
      const isNonCustomizable = product.isCustomizableIngredients === false;
      if (isNonCustomizable) {
        if (removed.length > 0 || added.length > 0) {
          return NextResponse.json(
            { error: `Il prodotto ${item.name} non prevede personalizzazione ingredienti` },
            { status: 400 }
          );
        }
        validatedItems.push({
          productId: product.id,
          name: product.name,
          priceCents: product.basePriceCents,
          quantity: item.quantity,
          notes: item.notes ?? null,
          removedIngredientIds: [],
          addedIngredientIds: [],
        });
      } else {
        const defaultIds = product.productIngredients
          .filter((pi) => pi.isDefault)
          .map((pi) => pi.ingredientId);
        const allowRemoveSet = new Set(
          product.productIngredients.filter((pi) => pi.allowRemove).map((pi) => pi.ingredientId)
        );
        const productIngredientByIngId = new Map(
          product.productIngredients.map((pi) => [pi.ingredientId, pi])
        );

        for (const id of removed) {
          if (!defaultIds.includes(id) || !allowRemoveSet.has(id)) {
            return NextResponse.json(
              { error: `Ingrediente non removibile per ${item.name}` },
              { status: 400 }
            );
          }
        }
        for (const id of added) {
          if (!activeIngredientIds.has(id)) {
            return NextResponse.json(
              { error: `Ingrediente non valido o non attivo per ${item.name}` },
              { status: 400 }
            );
          }
        }

        const addedPrices = added.map((ingredientId) => {
          const pi = productIngredientByIngId.get(ingredientId);
          const ing = ingredientByName.get(ingredientId);
          const addPriceCents = pi
            ? (pi.addPriceCentsOverride ?? pi.ingredient.defaultAddPriceCents ?? 0)
            : (ing?.defaultAddPriceCents ?? 0);
          return { ingredientId, addPriceCents };
        });
        const itemPriceCents = computeItemPriceCents(
          product.basePriceCents,
          added,
          addedPrices
        );
        validatedItems.push({
          productId: product.id,
          name: product.name,
          priceCents: itemPriceCents,
          quantity: item.quantity,
          notes: item.notes ?? null,
          removedIngredientIds: removed,
          addedIngredientIds: added,
        });
      }
    } else {
      validatedItems.push({
        productId: null,
        name: item.name,
        priceCents: item.priceCents,
        quantity: item.quantity,
        notes: item.notes ?? null,
        removedIngredientIds: [],
        addedIngredientIds: [],
      });
    }
  }

  const subtotalCents = validatedItems.reduce(
    (s, i) => s + i.priceCents * i.quantity,
    0
  );
  const deliveryFeeCents =
    data.type === "DELIVERY" ? restaurant.deliveryFeeCents : 0;
  const totalCents = subtotalCents + deliveryFeeCents;

  const session = await getSession();
  const userId = session?.userId ?? null;

  const paymentMethodDb =
    data.paymentMethod === "cash" ? PaymentMethod.cash : PaymentMethod.stripe;

  const order = await prisma.order.create({
    data: {
      restaurantId: restaurant.id,
      userId,
      status: OrderStatus.NEW,
      type: data.type,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail || null,
      deliveryAddress: data.deliveryAddress ?? null,
      deliveryCity: data.deliveryCity ?? null,
      deliveryCap: data.deliveryCap ?? null,
      deliveryNotes: data.deliveryNotes ?? null,
      pickupAt: data.pickupAt ? new Date(data.pickupAt) : null,
      paymentMethod: paymentMethodDb,
      paymentStatus:
        data.paymentMethod === "cash"
          ? PaymentStatus.unpaid
          : PaymentStatus.pending,
      subtotalCents,
      deliveryFeeCents,
      totalCents,
      orderNotes: data.orderNotes ?? null,
      items: {
        create: validatedItems.map((i) => ({
          productId: i.productId,
          name: i.name,
          priceCents: i.priceCents,
          quantity: i.quantity,
          notes: i.notes,
        })),
      },
    },
    include: { items: true },
  });

  const itemIdByIndex = order.items.map((it) => it.id);
  const productMapForChanges = new Map(products.map((p) => [p.id, p]));

  for (let idx = 0; idx < validatedItems.length; idx++) {
    const vi = validatedItems[idx];
    const orderItemId = itemIdByIndex[idx];
    if (!orderItemId) continue;
    const product = vi.productId ? productMapForChanges.get(vi.productId) : null;
    const changes: { orderItemId: string; ingredientId: string | null; ingredientNameSnapshot: string; type: "ADD" | "REMOVE"; priceDeltaCents: number }[] = [];
    if (product) {
      const byIngredientId = new Map(
        product.productIngredients.map((pi) => [pi.ingredient.id, pi])
      );
      for (const ingId of vi.removedIngredientIds) {
        const pi = byIngredientId.get(ingId);
        const ing = ingredientByName.get(ingId);
        changes.push({
          orderItemId,
          ingredientId: ingId,
          ingredientNameSnapshot: pi?.ingredient.name ?? ing?.name ?? "",
          type: "REMOVE",
          priceDeltaCents: 0,
        });
      }
      for (const ingId of vi.addedIngredientIds) {
        const pi = byIngredientId.get(ingId);
        const ing = ingredientByName.get(ingId);
        const addCents = pi
          ? (pi.addPriceCentsOverride ?? pi.ingredient.defaultAddPriceCents ?? 0)
          : (ing?.defaultAddPriceCents ?? 0);
        changes.push({
          orderItemId,
          ingredientId: ingId,
          ingredientNameSnapshot: pi?.ingredient.name ?? ing?.name ?? "",
          type: "ADD",
          priceDeltaCents: addCents,
        });
      }
    }
    if (changes.length > 0) {
      await prisma.orderItemIngredientChange.createMany({
        data: changes,
      });
    }
  }

  return NextResponse.json({
    orderId: order.id,
    totalCents: order.totalCents,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
  });
}
