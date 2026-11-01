import { Money } from '@shoplab/ui-kit';
import type { Cart } from '../types.ts';

/** Total comes from cart-api (it applies the coupon); the subtotal is summed from the price snapshots. */
export function Totals({ cart }: { cart: Cart }) {
  const currency = cart.currency as 'USD';
  const subtotal = cart.lines.reduce((n, l) => n + l.quantity * l.unitPrice, 0);
  const discount = subtotal - cart.total;
  return (
    <dl>
      <dt>Subtotal</dt><dd><Money amount={subtotal} currency={currency} /></dd>
      {discount > 0 && (<><dt>Discount</dt><dd>−<Money amount={discount} currency={currency} /></dd></>)}
      <dt>Total</dt><dd><Money amount={cart.total} currency={currency} /></dd>
    </dl>
  );
}
