/**
 * Django API origin for all browser-side fetches.
 * Set `VITE_API_BASE_URL` in `react/.env` (see `.env.example`).
 *
 * Example: `http://127.0.0.1:8000` or `https://api.example.com`
 * Empty / unset: same origin as the SPA (relative `/api/...` URLs).
 */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (raw == null || String(raw).trim() === '') {
    return ''
  }
  return String(raw).trim().replace(/\/+$/, '')
}

/**
 * Full URL for an API path that starts with `/` (e.g. `/api/auth/me`).
 */
export function apiUrl(path: string): string {
  if (!path.startsWith('/')) {
    throw new Error(`apiUrl: path must start with /, got: ${path}`)
  }
  const base = getApiBaseUrl()
  if (!base) {
    return path
  }
  return `${base}${path}`
}
