import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@shoplab/ui-kit';
import { authFetch, emitCartUpdated, hostState } from './stubs/host-ui.ts';
import { stubFetch } from './helpers.ts';
import Cart from '../src/Cart.tsx';

const line = (productId: string, quantity: number, unitPrice: number, latestUnitPrice?: number) => ({ productId, quantity, unitPrice, ...(latestUnitPrice ? { latestUnitPrice } : {}) });
const cart = (lines: ReturnType<typeof line>[], total: number, coupon: string | null = null) => ({ id: 'c-1', lines, coupon, total, currency: 'USD' });
const names = { 'GET /products/p-1': () => ({ body: { id: 'p-1', name: 'Studio Speaker' } }), 'GET /products/p-2': () => ({ body: { id: 'p-2', name: 'Everyday Cable' } }) };
const header = (init: RequestInit, k: string) => (init.headers as Record<string, string>)?.[k];

beforeEach(() => {
  hostState.user = null;
  vi.mocked(authFetch).mockReset();
  vi.mocked(emitCartUpdated).mockReset();
});

describe('guest cart', () => {
  it('loads with the saved x-cart-id, names the lines and shows totals', async () => {
    localStorage.setItem('cartId', 'c-1');
    const calls = stubFetch({ 'GET /cart': () => ({ body: cart([line('p-1', 2, 4500), line('p-2', 1, 1200)], 10200) }), ...names });
    render(<Cart />);
    expect(await screen.findByText('Studio Speaker')).toBeTruthy();
    expect(await screen.findByText('Everyday Cable')).toBeTruthy();
    expect(header(calls.find((c) => c.url === '/cart')!.init, 'x-cart-id')).toBe('c-1');
    expect(screen.getAllByText('$102.00')).toHaveLength(2); // subtotal and total
    expect(emitCartUpdated).toHaveBeenCalledWith({ count: 3 });
  });

  it('keeps localStorage.cartId in sync with the id the server returns', async () => {
    stubFetch({ 'GET /cart': () => ({ body: cart([], 0) }) });
    render(<Cart />);
    await screen.findByText('Your cart is empty.');
    expect(localStorage.getItem('cartId')).toBe('c-1');
  });

  it('falls back to the product id when the name lookup fails', async () => {
    stubFetch({ 'GET /cart': () => ({ body: cart([line('p-9', 1, 100)], 100) }), 'GET /products/p-9': () => ({ status: 500, body: {} }) });
    render(<Cart />);
    expect(await screen.findByText('p-9')).toBeTruthy();
  });

  it('asks guests to log in before checkout', async () => {
    stubFetch({ 'GET /cart': () => ({ body: cart([line('p-1', 1, 4500)], 4500) }), ...names });
    render(<Cart />);
    expect((await screen.findByText('Log in to check out')).getAttribute('href')).toBe('/account');
  });

  it('reports a load failure', async () => {
    stubFetch({ 'GET /cart': () => ({ status: 500, body: {} }) });
    render(<Cart />);
    expect((await screen.findByRole('alert')).textContent).toBe('Could not load your cart.');
  });
});

describe('editing', () => {
  const start = (lines = [line('p-1', 2, 4500)], total = 9000) =>
    stubFetch({
      'GET /cart': () => ({ body: cart(lines, total) }),
      'PATCH /cart/items/p-1': (init) => { const q = JSON.parse(init.body as string).quantity; return { body: cart([line('p-1', q, 4500)], q * 4500) }; },
      'DELETE /cart/items/p-1': () => ({ body: cart([], 0) }),
      ...names,
    });

  it('increase sends PATCH with the new quantity and updates the totals', async () => {
    const calls = start();
    render(<Cart />);
    fireEvent.click(await screen.findByLabelText('Increase Studio Speaker'));
    await waitFor(() => expect(screen.getByLabelText('Quantity of Studio Speaker').textContent).toBe('3'));
    expect(JSON.parse(calls.find((c) => c.init.method === 'PATCH')!.init.body as string)).toEqual({ quantity: 3 });
    expect(screen.getAllByText('$135.00')).toHaveLength(2);
    expect(emitCartUpdated).toHaveBeenLastCalledWith({ count: 3 });
  });

  it('decreasing to zero removes the line', async () => {
    start([line('p-1', 1, 4500)], 4500);
    render(<Cart />);
    fireEvent.click(await screen.findByLabelText('Decrease Studio Speaker'));
    expect(await screen.findByText('Your cart is empty.')).toBeTruthy();
    expect(emitCartUpdated).toHaveBeenLastCalledWith({ count: 0 });
  });

  it('remove button sends DELETE', async () => {
    const calls = start();
    render(<Cart />);
    fireEvent.click(await screen.findByLabelText('Remove Studio Speaker'));
    await screen.findByText('Your cart is empty.');
    expect(calls.some((c) => c.init.method === 'DELETE' && c.url === '/cart/items/p-1')).toBe(true);
  });

  it('shows an error when an edit fails and keeps the old cart', async () => {
    stubFetch({
      'GET /cart': () => ({ body: cart([line('p-1', 2, 4500)], 9000) }),
      'PATCH /cart/items/p-1': () => ({ status: 500, body: {} }),
      ...names,
    });
    render(<Cart />);
    fireEvent.click(await screen.findByLabelText('Increase Studio Speaker'));
    expect((await screen.findByRole('alert')).textContent).toBe('Could not update the quantity.');
    expect(screen.getByLabelText('Quantity of Studio Speaker').textContent).toBe('2');
  });
});

describe('coupon and price changes', () => {
  it('applies a coupon and shows the discount', async () => {
    const calls = stubFetch({
      'GET /cart': () => ({ body: cart([line('p-1', 2, 5000)], 10000) }),
      'POST /cart/coupon': () => ({ body: cart([line('p-1', 2, 5000)], 9000, 'WELCOME10') }),
      ...names,
    });
    render(<Cart />);
    await screen.findByText('Studio Speaker');
    fireEvent.change(screen.getByLabelText('Coupon code'), { target: { value: 'welcome10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByText('Coupon WELCOME10 applied')).toBeTruthy();
    expect(JSON.parse(calls.find((c) => c.url === '/cart/coupon')!.init.body as string)).toEqual({ code: 'welcome10' });
    expect(screen.getByText('Discount')).toBeTruthy();
    expect(screen.getByText('$90.00')).toBeTruthy();
  });

  it('an invalid coupon (422) shows a specific message', async () => {
    stubFetch({
      'GET /cart': () => ({ body: cart([line('p-1', 1, 5000)], 5000) }),
      'POST /cart/coupon': () => ({ status: 422, body: { error: 'invalid_coupon' } }),
      ...names,
    });
    render(<Cart />);
    await screen.findByText('Studio Speaker');
    fireEvent.change(screen.getByLabelText('Coupon code'), { target: { value: 'NOPE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect((await screen.findByRole('alert')).textContent).toBe('That coupon is not valid.');
  });

  it('shows the latest catalog price next to a stale snapshot', async () => {
    stubFetch({ 'GET /cart': () => ({ body: cart([line('p-1', 1, 4500, 5200)], 4500) }), ...names });
    render(<Cart />);
    expect(await screen.findByText(/now/)).toBeTruthy();
    expect(screen.getByText('$52.00')).toBeTruthy();
  });
});

describe('logged in', () => {
  beforeEach(() => { hostState.user = { id: 'u-1', role: 'customer' }; });

  it('uses the host authFetch and never touches localStorage.cartId', async () => {
    vi.mocked(authFetch).mockResolvedValue(cart([line('p-1', 1, 4500)], 4500));
    stubFetch({ ...names });
    render(<Cart />);
    expect(await screen.findByText('Studio Speaker')).toBeTruthy();
    expect(authFetch).toHaveBeenCalledWith('/cart', { method: 'GET', body: undefined });
    expect(localStorage.getItem('cartId')).toBeNull();
    expect(screen.getByText('Checkout').getAttribute('href')).toBe('/checkout');
  });

  it('a coupon rejected by the API surfaces the 422 message', async () => {
    vi.mocked(authFetch).mockImplementation(async (path: string) => {
      if (path === '/cart/coupon') throw new ApiError(422, 'invalid_coupon');
      return cart([line('p-1', 1, 4500)], 4500) as never;
    });
    stubFetch({ ...names });
    render(<Cart />);
    await screen.findByText('Studio Speaker');
    fireEvent.change(screen.getByLabelText('Coupon code'), { target: { value: 'X' } });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Apply' })));
    expect((await screen.findByRole('alert')).textContent).toBe('That coupon is not valid.');
  });
});
