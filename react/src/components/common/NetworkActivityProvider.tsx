import CircularProgress from '@mui/material/CircularProgress'
import { useEffect, useState } from 'react'

function isWorkspaceEditLockRequest(
  input: Parameters<typeof fetch>[0]
): boolean {
  const value =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url

  try {
    return new URL(value, window.location.origin).pathname.startsWith(
      '/api/workspace-lock/'
    )
  } catch {
    return false
  }
}

// From https://github.com/mui/material-ui/issues/9496#issuecomment-959408221
const GradientCircularProgress = () => (
  <>
    <svg width={0} height={0}>
      <defs>
        <linearGradient id="my_gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e01cd5" />
          <stop offset="100%" stopColor="#1CB5E0" />
        </linearGradient>
      </defs>
    </svg>
    <CircularProgress sx={{ 'svg circle': { stroke: 'url(#my_gradient)' } }} />
  </>
)

const NetworkActivityProvider = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [requestCount, setRequestCount] = useState<number>(0)

  useEffect(() => {
    const originalFetch = window.fetch

    window.fetch = async (
      ...args: Parameters<typeof fetch>
    ): Promise<Response> => {
      if (isWorkspaceEditLockRequest(args[0])) {
        return originalFetch(...args)
      }

      setRequestCount((prevCount) => prevCount + 1)

      try {
        return await originalFetch(...args)
      } finally {
        setRequestCount((prevCount) => Math.max(0, prevCount - 1))
      }
    }

    // Cleanup function
    return () => {
      window.fetch = originalFetch
    }
  }, [])

  useEffect(() => {
    if (requestCount > 0) {
      setIsLoading(true)
      return
    }

    const timeout = window.setTimeout(() => setIsLoading(false), 500)
    return () => window.clearTimeout(timeout)
  }, [requestCount])

  return <>{isLoading && <Loader />}</>
}

const Loader = () => (
  <div
    data-testid="network-activity-loader"
    style={{
      position: 'absolute',
      right: '50px',
      bottom: '30px',
      padding: '5px',
      borderRadius: '11px',
      background: 'rgba(255, 255, 255, 0.5)',
      zIndex: 9999
    }}
  >
    <GradientCircularProgress />
  </div>
)

export default NetworkActivityProvider
