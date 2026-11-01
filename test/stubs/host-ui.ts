// Stands in for the host's `./ui` module in unit tests. Tests set `hostState` to control it.
import { vi } from 'vitest';

export const hostState: { user: { id: string; role: 'customer' | 'staff' | 'admin' } | null } = { user: null };
export const useAuth = () => ({ user: hostState.user });
export const authFetch = vi.fn();
export const emitCartUpdated = vi.fn();
