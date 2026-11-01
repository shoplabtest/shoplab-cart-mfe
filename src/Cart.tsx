import { useAuth } from 'host/ui';
import { CartLines } from './components/CartLines.tsx';
import { CouponBox } from './components/CouponBox.tsx';
import { Totals } from './components/Totals.tsx';
import { useCart } from './useCart.ts';

export default function Cart() {
  const { user } = useAuth();
  const { state, names, message, setQuantity, remove, applyCoupon } = useCart(!!user);

  if (state.status === 'loading') return <p>Loading your cart…</p>;
  if (state.status === 'error') return <p role="alert">Could not load your cart.</p>;
  const { cart } = state;

  return (
    <section>
      <h2>Your cart</h2>
      {message && <p role="alert">{message}</p>}
      {cart.lines.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <CartLines lines={cart.lines} currency={cart.currency} names={names} onQuantity={setQuantity} onRemove={remove} />
          <CouponBox applied={cart.coupon} onApply={applyCoupon} />
          <Totals cart={cart} />
          {user ? <a href="/checkout">Checkout</a> : <a href="/account">Log in to check out</a>}
        </>
      )}
    </section>
  );
}
