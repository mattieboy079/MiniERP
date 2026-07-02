// The API base URL is injected by Aspire (see AppHost). Falls back to the
// default API port for a plain `npm run dev` outside of Aspire.
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5215'

// Raised when a call to a protected endpoint comes back 401 — the session is
// missing or has expired.
export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized')
    this.name = 'UnauthorizedError'
  }
}

let onUnauthorized: (() => void) | null = null

// Lets the auth layer react to an expired session (e.g. clear the current user
// so the app falls back to the login screen).
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

// Low-level fetch that always sends the auth cookie. Callers that treat a 401 as
// a normal outcome (login, session probe) use this directly.
export function apiRaw(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_URL}${path}`, { ...init, credentials: 'include' })
}

// Fetch wrapper for protected endpoints: sends the cookie and turns a 401 into a
// typed error after notifying the auth layer, so the app can drop to login.
export async function api(path: string, init?: RequestInit): Promise<Response> {
  const res = await apiRaw(path, init)
  if (res.status === 401) {
    onUnauthorized?.()
    throw new UnauthorizedError()
  }
  return res
}
