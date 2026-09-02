export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8100';

export async function api(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
    cache: 'no-store',
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error?.message || 'Request failed');
  return data;
}
