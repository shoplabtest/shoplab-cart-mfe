import { ApiError } from '@shoplab/ui-kit';
import { useCallback, useEffect, useState } from 'react';
import { applyCoupon, getCart, lookupNames, removeLine, setQuantity } from './cartApi.ts';
import type { Cart } from './types.ts';

export type CartState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; cart: Cart };

export function useCart(loggedIn: boolean) {
  const [state, setState] = useState<CartState>({ status: 'loading' });
  const [names, setNames] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const adopt = useCallback((cart: Cart) => setState({ status: 'ready', cart }), []);

  useEffect(() => {
    let current = true;
    setState({ status: 'loading' });
    getCart(loggedIn).then((c) => current && adopt(c), () => current && setState({ status: 'error' }));
    return () => { current = false; };
  }, [loggedIn, adopt]);

  const ids = state.status === 'ready' ? state.cart.lines.map((l) => l.productId).filter((id) => !(id in names)) : [];
  const missing = ids.join(',');
  useEffect(() => {
    if (!missing) return;
    let current = true;
    lookupNames(missing.split(',')).then((found) => current && setNames((n) => ({ ...n, ...Object.fromEntries(found.map((p) => [p.id, p.name])) })));
    return () => { current = false; };
  }, [missing]);

  const run = useCallback(async (op: () => Promise<Cart>, failure: (e: unknown) => string) => {
    setMessage(null);
    try {
      adopt(await op());
    } catch (e) {
      setMessage(failure(e));
    }
  }, [adopt]);

  return {
    state,
    names,
    message,
    setQuantity: (id: string, q: number) => run(() => (q <= 0 ? removeLine(loggedIn, id) : setQuantity(loggedIn, id, q)), () => 'Could not update the quantity.'),
    remove: (id: string) => run(() => removeLine(loggedIn, id), () => 'Could not remove that item.'),
    applyCoupon: (code: string) =>
      run(() => applyCoupon(loggedIn, code), (e) => (e instanceof ApiError && e.status === 422 ? 'That coupon is not valid.' : 'Could not apply the coupon.')),
  };
}
