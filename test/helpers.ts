import { vi } from 'vitest';

export const product = (id: string, name: string, amount: number) => ({ id, name, price: { amount, currency: 'USD' }, categoryId: 'audio' });

export const TREE = [{ id: 'electronics', name: 'Electronics', children: [{ id: 'audio', name: 'Audio', children: [] }] }];

type Handler = (init: RequestInit) => { status?: number; body?: unknown };

/** Stubs fetch. Keys are "METHOD /path?query" and may end in `*` to match any query string. */
export function stubFetch(routes: Record<string, Handler>) {
  const calls: { url: string; init: RequestInit }[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init });
    const exact = `${init.method ?? 'GET'} ${url}`;
    const key = Object.keys(routes).find((k) => k === exact || (k.endsWith('*') && exact.startsWith(k.slice(0, -1))));
    if (!key) throw new Error(`unexpected fetch ${exact}`);
    const { status = 200, body } = routes[key](init);
    return new Response(body === undefined ? null : JSON.stringify(body), { status });
  }));
  return calls;
}
