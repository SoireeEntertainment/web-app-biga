export type CartItem = {
  productId: string;
  name: string;
  priceCents: number;
  quantity: number;
  notes?: string;
  imageUrl?: string | null;
  removedIngredientIds?: string[];
  addedIngredientIds?: string[];
};

export type Cart = {
  items: CartItem[];
  restaurantSlug?: string;
};

export const CART_STORAGE_KEY = "biga-cart";

export function getCart(): Cart {
  if (typeof window === "undefined") return { items: [] };
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw) as Cart;
    return Array.isArray(parsed?.items) ? parsed : { items: [] };
  } catch {
    return { items: [] };
  }
}

export function setCart(cart: Cart): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

export function cartSubtotalCents(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
}

export function cartTotalItems(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
