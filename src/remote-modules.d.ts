declare module 'host/ui' {
  export interface User { id: string; role: 'customer' | 'staff' | 'admin' }
  export function useAuth(): { user: User | null };
  export function authFetch<T>(path: string, init?: RequestInit): Promise<T>;
  export function emitCartUpdated(detail: { count: number }): void;
}
