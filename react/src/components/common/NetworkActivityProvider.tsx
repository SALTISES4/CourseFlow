import CircularProgress from '@mui/material/CircularProgress'
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react'

type NetworkActivityProviderProps = {
  children: ReactNode
}

type SetRegisteredActivity = (token: symbol, active: boolean) => void

const NetworkActivityContext = createContext<SetRegisteredActivity | null>(null)

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

const NetworkActivityProvider = ({
  children
}: NetworkActivityProviderProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [requestCount, setRequestCount] = useState<number>(0)
  const registeredActivities = useRef(new Set<symbol>())
  const [registeredActivityCount, setRegisteredActivityCount] =
    useState<number>(0)

  const setRegisteredActivity = useCallback<SetRegisteredActivity>(
    (token, active) => {
      const previousCount = registeredActivities.current.size

      if (active) {
        registeredActivities.current.add(token)
      } else {
        registeredActivities.current.delete(token)
      }

      if (registeredActivities.current.size !== previousCount) {
        setRegisteredActivityCount(registeredActivities.current.size)
      }
    },
    []
  )

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
    if (requestCount > 0 || registeredActivityCount > 0) {
      setIsLoading(true)
      return
    }

    const timeout = window.setTimeout(() => setIsLoading(false), 500)
    return () => window.clearTimeout(timeout)
  }, [registeredActivityCount, requestCount])

  return (
    <NetworkActivityContext.Provider value={setRegisteredActivity}>
      {children}
      {isLoading && <NetworkActivityLoader />}
    </NetworkActivityContext.Provider>
  )
}

// Registers page-level loading gates with the provider. This covers requests
// that begin while the authenticated shell is mounting without rendering a
// second activity indicator when the fetch interceptor also sees the request.
export const NetworkActivityLoadingState = () => {
  const setRegisteredActivity = useContext(NetworkActivityContext)
  const token = useRef(Symbol('network-activity'))

  if (!setRegisteredActivity) {
    throw new Error(
      'NetworkActivityLoadingState must be rendered inside NetworkActivityProvider'
    )
  }

  useLayoutEffect(() => {
    const activityToken = token.current
    setRegisteredActivity(activityToken, true)
    return () => setRegisteredActivity(activityToken, false)
  }, [setRegisteredActivity])

  return null
}

export const NetworkActivityLoader = () => (
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
