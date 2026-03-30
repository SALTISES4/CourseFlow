import { apiUrl } from '@cf/api/apiBaseUrl'

/**
 * CourseFlow v2 auth API — matches Django Ninja routes in course_flow_v2.api.routers.auth
 * (see tests: POST /api/auth/login, GET /api/auth/me).
 * Full URLs use `VITE_API_BASE_URL` via `apiUrl()`.
 */

/** Mirrors UserSummaryOut from the backend. */
export type CurrentUser = {
  id: number
  uuid: string
  email: string
  first_name: string
  last_name: string
}

export type LoginResponse = {
  access_token: string
  token_type: string
  expires_at: string
  user: CurrentUser
}

export class AuthRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown
  ) {
    super(message)
    this.name = 'AuthRequestError'
  }
}

function parseDetail(body: unknown): string {
  if (body && typeof body === 'object' && 'detail' in body) {
    const d = (body as { detail?: unknown }).detail
    if (typeof d === 'string') {
      return d
    }
  }
  return 'Request failed'
}

export async function loginRequest(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })

  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new AuthRequestError(parseDetail(body), response.status, body)
  }

  return body as LoginResponse
}

export async function fetchCurrentUser(
  accessToken: string
): Promise<CurrentUser> {
  const response = await fetch(apiUrl('/api/auth/me'), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    }
  })

  const body = await response.json().catch(() => ({}))

  if (response.status === 401) {
    throw new AuthRequestError(parseDetail(body), response.status, body)
  }

  if (!response.ok) {
    throw new AuthRequestError(parseDetail(body), response.status, body)
  }

  return body as CurrentUser
}
