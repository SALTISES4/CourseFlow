import {
  AuthRequestError,
  type CurrentUser,
  fetchCurrentUser,
  loginRequest
} from '@cf/api/auth'
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken
} from '@cf/api/authToken'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated'

export interface AuthState {
  status: AuthStatus
  user: CurrentUser | null
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

export const bootstrapAuth = createAsyncThunk<
  { user: CurrentUser | null },
  void,
  { rejectValue: string }
>('auth/bootstrap', async (_, { rejectWithValue }) => {
  const token = getAccessToken()
  if (!token) {
    return { user: null }
  }
  try {
    const user = await fetchCurrentUser(token)
    return { user }
  } catch (e) {
    if (e instanceof AuthRequestError && e.status === 401) {
      clearAccessToken()
      return { user: null }
    }
    if (e instanceof AuthRequestError) {
      return rejectWithValue(e.message)
    }
    const message = e instanceof Error ? e.message : 'Unable to verify session'
    return rejectWithValue(message)
  }
})

export const login = createAsyncThunk<
  { user: CurrentUser },
  { email: string; password: string },
  { rejectValue: string }
>('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const data = await loginRequest(email.trim(), password)
    setAccessToken(data.access_token)
    return { user: data.user }
  } catch (e) {
    if (e instanceof AuthRequestError) {
      return rejectWithValue(e.message)
    }
    const message = e instanceof Error ? e.message : 'Login failed'
    return rejectWithValue(message)
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null
    },
    /** Dev / future logout wiring — not exposed in UI for this milestone. */
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
          action.payload ?? action.error.message ?? 'Bootstrap failed'
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
        state.error = action.payload ?? action.error.message ?? 'Login failed'
      })
  }
})

export const { clearAuthError, clearSession } = authSlice.actions

type WithAuth = { auth: AuthState }

export const selectAuth = (state: WithAuth) => state.auth
export const selectAuthStatus = (state: WithAuth) => state.auth.status
export const selectAuthUser = (state: WithAuth) => state.auth.user
export const selectIsBootstrapping = (state: WithAuth) =>
  state.auth.isBootstrapping
export const selectLoginPending = (state: WithAuth) => state.auth.loginPending
export const selectAuthError = (state: WithAuth) => state.auth.error

export default authSlice.reducer
