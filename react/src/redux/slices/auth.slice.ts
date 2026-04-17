import {
  AuthRequestError,
  type CurrentUser,
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
import { UserSummaryOutResp } from '@cf/api/gen'
import { meQueryKey } from '@cf/api/gen/@tanstack/react-query.gen'
import { courseFlowQueryClient } from '@cf/api/queryClient'
import { _t } from '@cf/utility/Utility.class'
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
    courseFlowQueryClient.removeQueries({ queryKey: meQueryKey() })
    return { user: null }
  }
  try {
    const user = await fetchCurrentUser()
    courseFlowQueryClient.setQueryData(meQueryKey(), {
      item: user
    } satisfies UserSummaryOutResp)
    return { user }
  } catch (e) {
    if (e instanceof AuthRequestError && e.status === 401) {
      clearAccessToken()
      courseFlowQueryClient.removeQueries({ queryKey: meQueryKey() })
      return { user: null }
    }
    if (e instanceof AuthRequestError) {
      return rejectWithValue(e.message)
    }
    const message =
      e instanceof Error ? e.message : _t('Unable to verify session')
    return rejectWithValue(message)
  }
})

export const login = createAsyncThunk<
  { user: CurrentUser },
  UserLoginPayload,
  { rejectValue: string }
>('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const data = await loginRequest(payload)
    setAccessToken(data.accessToken)
    courseFlowQueryClient.setQueryData(meQueryKey(), {
      item: data.user
    } satisfies UserSummaryOutResp)
    return { user: data.user }
  } catch (e) {
    if (e instanceof AuthRequestError) {
      return rejectWithValue(e.message)
    }
    const message = e instanceof Error ? e.message : _t('Login failed')
    return rejectWithValue(message)
  }
})

export const register = createAsyncThunk<
  { user: CurrentUser },
  UserRegisterPayload,
  { rejectValue: string }
>('auth/register', async (payload, { rejectWithValue }) => {
  try {
    console.log('attempting to register with', payload)
    const data = await registerRequest(payload)
    setAccessToken(data.accessToken)
    courseFlowQueryClient.setQueryData(meQueryKey(), {
      item: data.user
    } satisfies UserSummaryOutResp)
    return { user: data.user }
  } catch (e) {
    if (e instanceof AuthRequestError) {
      return rejectWithValue(e.message)
    }
    const message = e instanceof Error ? e.message : _t('Registration failed')
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
