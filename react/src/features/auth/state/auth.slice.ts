import {
  AuthRequestError,
  type UserLoginPayload,
  type UserRegisterPayload,
  fetchCurrentUser,
  loginRequest,
  registerRequest
} from '@cf/api/auth'
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken
} from '@cf/api/authToken'
import { UserSummaryOut } from '@cf/api/gen'
import { meQueryKey } from '@cf/api/gen/@tanstack/react-query.gen'
import { courseFlowQueryClient } from '@cf/api/queryClient'
import i18n, { setAppLocale } from '@cf/i18n'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated'

export interface AuthState {
  status: AuthStatus
  user: UserSummaryOut | null
  isBootstrapping: boolean
  loginPending: boolean
  error: string | null
}

const initialState: AuthState = {
  status: 'unknown',
  user: null,
  isBootstrapping: true,
  loginPending: false,
  error: null
}

function localizedAuthError(error: AuthRequestError): string {
  switch (error.code) {
    case 'invalid_credentials':
      return i18n.t('errors.invalidCredentials', { ns: 'auth' })
    case 'email_already_registered':
      return i18n.t('errors.emailAlreadyRegistered', { ns: 'auth' })
    case 'registration_fields_required':
      return i18n.t('errors.registrationFieldsRequired', { ns: 'auth' })
    default:
      return i18n.t('errors.requestFailed', { ns: 'auth' })
  }
}

export const bootstrapAuth = createAsyncThunk<
  { user: UserSummaryOut | null },
  void,
  { rejectValue: string }
>('auth/bootstrap', async (_, { rejectWithValue }) => {
  const token = getAccessToken()
  if (!token) {
    courseFlowQueryClient.removeQueries({ queryKey: meQueryKey() })
    return { user: null }
  }
  try {
    const user = await fetchCurrentUser()
    await setAppLocale(user.languagePreference)
    courseFlowQueryClient.setQueryData(
      meQueryKey(),
      user satisfies UserSummaryOut
    )
    return { user }
  } catch (e) {
    if (e instanceof AuthRequestError && e.status === 401) {
      clearAccessToken()
      courseFlowQueryClient.removeQueries({ queryKey: meQueryKey() })
      return { user: null }
    }
    if (e instanceof AuthRequestError) {
      return rejectWithValue(localizedAuthError(e))
    }
    return rejectWithValue(i18n.t('session.unableToVerify', { ns: 'auth' }))
  }
})

export const login = createAsyncThunk<
  { user: UserSummaryOut },
  UserLoginPayload,
  { rejectValue: string }
>('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const data = await loginRequest(payload)
    await setAppLocale(data.user.languagePreference)
    setAccessToken(data.accessToken)
    courseFlowQueryClient.setQueryData(
      meQueryKey(),
      data.user satisfies UserSummaryOut
    )
    return { user: data.user }
  } catch (e) {
    if (e instanceof AuthRequestError) {
      return rejectWithValue(localizedAuthError(e))
    }
    return rejectWithValue(i18n.t('login.failed', { ns: 'auth' }))
  }
})

export const register = createAsyncThunk<
  { user: UserSummaryOut },
  UserRegisterPayload,
  { rejectValue: string }
>('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const data = await registerRequest(payload)
    await setAppLocale(data.user.languagePreference)
    setAccessToken(data.accessToken)
    courseFlowQueryClient.setQueryData(
      meQueryKey(),
      data.user satisfies UserSummaryOut
    )
    return { user: data.user }
  } catch (e) {
    if (e instanceof AuthRequestError) {
      return rejectWithValue(localizedAuthError(e))
    }
    return rejectWithValue(i18n.t('registration.failed', { ns: 'auth' }))
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null
    },
    setAuthLanguagePreference(state, action: { payload: string }) {
      if (state.user) {
        state.user.languagePreference = action.payload
      }
    },
    /**
     * Dev / future logout wiring — not exposed in UI for this milestone.
     * */
    clearSession(state) {
      clearAccessToken()
      state.status = 'unauthenticated'
      state.user = null
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.pending, (state) => {
        state.isBootstrapping = true
        state.error = null
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.isBootstrapping = false
        if (action.payload.user) {
          state.status = 'authenticated'
          state.user = action.payload.user
        } else {
          state.status = 'unauthenticated'
          state.user = null
        }
      })
      .addCase(bootstrapAuth.rejected, (state, action) => {
        state.isBootstrapping = false
        clearAccessToken()
        state.status = 'unauthenticated'
        state.user = null
        state.error =
          action.payload ?? i18n.t('session.unableToVerify', { ns: 'auth' })
      })
      .addCase(login.pending, (state) => {
        state.loginPending = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loginPending = false
        state.status = 'authenticated'
        state.user = action.payload.user
        state.error = null
      })
      .addCase(login.rejected, (state, action) => {
        state.loginPending = false
        state.error = action.payload ?? i18n.t('login.failed', { ns: 'auth' })
      })
  }
})

export const { clearAuthError, clearSession, setAuthLanguagePreference } =
  authSlice.actions

type WithAuth = { auth: AuthState }

export const selectAuth = (state: WithAuth) => state.auth
export const selectAuthStatus = (state: WithAuth) => state.auth.status
export const selectAuthUser = (state: WithAuth) => state.auth.user
export const selectIsBootstrapping = (state: WithAuth) =>
  state.auth.isBootstrapping
export const selectLoginPending = (state: WithAuth) => state.auth.loginPending
export const selectAuthError = (state: WithAuth) => state.auth.error

export default authSlice.reducer
