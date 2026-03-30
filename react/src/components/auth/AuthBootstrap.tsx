import { bootstrapAuth } from '@cfRedux/slices/auth.slice'
import type { AppDispatch } from '@cfRedux/store'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

/** Dispatches session bootstrap once on app load (reads stored Bearer token + /api/auth/me). */
export default function AuthBootstrap() {
  const dispatch = useDispatch<AppDispatch>()
  useEffect(() => {
    dispatch(bootstrapAuth())
  }, [dispatch])
  return null
}
