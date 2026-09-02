/**
 * Auth helpers built on the Hey API generated client (`sdk.gen` + configured `client`).
 * HTTP paths remain Django Ninja `course_flow_v2.api.routers.auth`.
 */
import { login, logout, me, register } from './gen/sdk.gen'
import type {
  LoginIn,
  LoginOut,
  LogoutOut,
  RegisterIn,
  UserSummaryOut
} from './gen/types.gen'

export type LoginResponse = LoginOut
export type UserLoginPayload = LoginIn
export type UserRegisterPayload = RegisterIn

export class AuthRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
    readonly code?: string
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
  if (typeof body === 'string' && body.length > 0) {
    return body
  }
  return 'Request failed'
}

function parseCode(body: unknown): string | undefined {
  if (body && typeof body === 'object' && 'code' in body) {
    const code = (body as { code?: unknown }).code
    return typeof code === 'string' ? code : undefined
  }
  return undefined
}

export async function loginRequest(
  data: UserLoginPayload
): Promise<LoginResponse> {
  const result = await login({
    body: {
      email: data.email.trim(),
      password: data.password
    }
  })

  if (result.error) {
    const status = result.response?.status ?? 0
    throw new AuthRequestError(
      parseDetail(result.error),
      status,
      result.error,
      parseCode(result.error)
    )
  }

  if (!result.data) {
    throw new AuthRequestError(
      'Login response did not include data',
      result.response?.status ?? 0
    )
  }

  return result.data
}

export async function registerRequest(
  data: UserRegisterPayload
): Promise<LoginResponse> {
  const result = await register({
    body: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.trim(),
      password: data.password
    }
  })

  if (result.error) {
    const status = result.response?.status ?? 0
    throw new AuthRequestError(
      parseDetail(result.error),
      status,
      result.error,
      parseCode(result.error)
    )
  }

  if (!result.data) {
    throw new AuthRequestError(
      'Registration response did not include data',
      result.response?.status ?? 0
    )
  }

  return result.data
}

export async function logoutRequest(): Promise<LogoutOut | undefined> {
  const result = await logout()

  if (result.error) {
    const status = result.response?.status ?? 0
    throw new AuthRequestError(parseDetail(result.error), status, result.error)
  }

  return result.data
}

/**
 * Resolves the current user via `GET /api/auth/me` using the shared client
 * (Bearer from `getAccessToken()` — see `configureCourseFlowClient.ts`).
 */
export async function fetchCurrentUser(): Promise<UserSummaryOut> {
  const result = await me({})

  if (result.error) {
    const status = result.response?.status ?? 0
    throw new AuthRequestError(parseDetail(result.error), status, result.error)
  }

  if (!result.data) {
    throw new AuthRequestError(
      'Current-user response did not include data',
      result.response?.status ?? 0
    )
  }

  return result.data
}
