/**
 * Opaque Bearer token persistence for CourseFlow v2 headless auth.
 * Backend stores token hash only; the raw token lives client-side between sessions.
 */
const STORAGE_KEY = 'cf2_access_token'

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function setAccessToken(token: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, token)
  } catch {
    // ignore quota / private mode
  }
}

export function clearAccessToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
