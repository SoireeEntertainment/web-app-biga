import { z } from "zod";

const phoneRegex = /^\+?[0-9]{9,15}$/;

export const checkoutCustomerSchema = z.object({
  name: z.string().min(1, "Nome obbligatorio").max(100),
  phone: z.string().regex(phoneRegex, "Telefono non valido (es. +39 333 1234567)"),
  email: z.string().email().optional().or(z.literal("")),
});

export const checkoutDeliverySchema = z.object({
  address: z.string().min(1, "Indirizzo obbligatorio").max(200),
  city: z.string().min(1, "Città obbligatoria").max(100),
  cap: z.string().min(1, "CAP obbligatorio").max(10),
  deliveryNotes: z.string().max(500).optional(),
});

export const checkoutPickupSchema = z.object({
  pickupAt: z.string().optional(), // ISO date or "asap"
});

export const orderCreateSchema = z.object({
  restaurantId: z.string().cuid(),
  type: z.enum(["DELIVERY", "PICKUP"]),
  customerName: z.string().min(1).max(100),
  customerPhone: z.string().regex(phoneRegex),
  customerEmail: z.string().email().optional().nullable(),
  deliveryAddress: z.string().max(200).optional().nullable(),
  deliveryCity: z.string().max(100).optional().nullable(),
  deliveryCap: z.string().max(10).optional().nullable(),
  deliveryNotes: z.string().max(500).optional().nullable(),
  pickupAt: z.string().optional().nullable(),
  paymentMethod: z.enum(["cash", "card", "apple_pay"]),
  orderNotes: z.string().max(1000).optional().nullable(),
  items: z.array(
    z.object({
      productId: z.string().cuid().optional(),
      name: z.string(),
      priceCents: z.number().int().min(0),
      quantity: z.number().int().min(1),
      notes: z.string().max(300).optional(),
      removedIngredientIds: z.array(z.string().cuid()).optional().default([]),
      addedIngredientIds: z.array(z.string().cuid()).optional().default([]),
    })
  ),
  deliveryLat: z.number().optional().nullable(),
  deliveryLng: z.number().optional().nullable(),
});

export const authRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Minimo 8 caratteri"),
  name: z.string().max(100).optional(),
});

export const authLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const customerProfileSchema = z.object({
  deliveryName: z.string().max(100).optional(),
  deliveryPhone: z.string().max(20).optional(),
  deliveryEmail: z.string().email().optional().or(z.literal("")),
  addressLine1: z.string().max(200).optional(),
  addressLine2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  zip: z.string().max(10).optional(),
  notes: z.string().max(500).optional(),
});

export const adminOrderStatusSchema = z.object({
  status: z.enum([
    "NEW",
    "PAID",
    "ACCEPTED",
    "PREPARING",
    "READY",
    "OUT_FOR_DELIVERY",
    "COMPLETED",
    "CANCELED",
  ]),
});

export type CheckoutCustomer = z.infer<typeof checkoutCustomerSchema>;
export type CheckoutDelivery = z.infer<typeof checkoutDeliverySchema>;
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
