import {
  clearAuthError,
  login,
  selectAuthError,
  selectLoginPending
} from '@cfRedux/slices/auth.slice'
import type { AppDispatch } from '@cfRedux/store'
import { Box, Button, TextField, Typography } from '@mui/material'
import { FormEvent, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>()
  const pending = useSelector(selectLoginPending)
  const error = useSelector(selectAuthError)
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    dispatch(clearAuthError())
    const result = await dispatch(login({ email, password }))
    if (login.fulfilled.match(result)) {
      navigate(from, { replace: true })
    }
  }

  return (
    <Box
      component="form"
      onSubmit={submit}
      sx={{ maxWidth: 360, mx: 'auto', mt: 8, p: 2 }}
    >
      <Typography variant="h5" gutterBottom>
        Sign in
      </Typography>
      {error ? (
        <Typography color="error" sx={{ mb: 1 }} role="alert">
          {error}
        </Typography>
      ) : null}
      <TextField
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        value={email}
        onChange={(ev) => setEmail(ev.target.value)}
        fullWidth
        required
        margin="normal"
      />
      <TextField
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        value={password}
        onChange={(ev) => setPassword(ev.target.value)}
        fullWidth
        required
        margin="normal"
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={pending}
        fullWidth
        sx={{ mt: 2 }}
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </Box>
  )
}
