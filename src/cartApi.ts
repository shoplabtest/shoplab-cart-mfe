import { ApiError } from '@shoplab/ui-kit';
import { authFetch, emitCartUpdated } from 'host/ui';
import type { Cart, ProductName } from './types.ts';

// This remote owns the guest cart id kept in localStorage under `shoplab.cartId`. The catalog remote also writes it and the host merges it on login.
const GUEST_CART_KEY = 'shoplab.cartId';

const readGuestId = () => {
  try { return localStorage.getItem(GUEST_CART_KEY); } catch { return null; }
};
const writeGuestId = (id: string) => {
  try { localStorage.setItem(GUEST_CART_KEY, id); } catch { /* private mode: the cart still works for this page view */ }
};

/** One call path for every cart operation: logged-in users use the host's authFetch, guests send `x-cart-id`. */
async function call(loggedIn: boolean, path: string, method = 'GET', payload?: unknown): Promise<Cart> {
  const body = payload === undefined ? undefined : JSON.stringify(payload);
  let cart: Cart;
  if (loggedIn) {
    cart = await authFetch<Cart>(path, { method, body });
  } else {
    const guestId = readGuestId();
    const res = await fetch(path, {
      method,
      headers: { 'content-type': 'application/json', ...(guestId ? { 'x-cart-id': guestId } : {}) },
      body,
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new ApiError(res.status, err.error ?? 'request_failed');
    }
    cart = (await res.json()) as Cart;
    writeGuestId(cart.id);
  }
  emitCartUpdated({ count: cart.lines.reduce((n, l) => n + l.quantity, 0) });
  return cart;
}

export const getCart = (loggedIn: boolean) => call(loggedIn, '/cart');
export const setQuantity = (loggedIn: boolean, productId: string, quantity: number) =>
  call(loggedIn, `/cart/items/${encodeURIComponent(productId)}`, 'PATCH', { quantity });
export const removeLine = (loggedIn: boolean, productId: string) =>
  call(loggedIn, `/cart/items/${encodeURIComponent(productId)}`, 'DELETE');
export const applyCoupon = (loggedIn: boolean, code: string) => call(loggedIn, '/cart/coupon', 'POST', { code });

/** Cart lines only carry product ids; names come from GET /products/:id. A failed lookup falls back to the id. */
export async function lookupNames(ids: string[]): Promise<ProductName[]> {
  return Promise.all(
    ids.map(async (id) => {
      try {
        const res = await fetch(`/products/${id}`);
        return res.ok ? ((await res.json()) as ProductName) : { id, name: id };
      } catch {
        return { id, name: id };
      }
    }),
  );
}
