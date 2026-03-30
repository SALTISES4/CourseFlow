import CircularProgress from '@mui/material/CircularProgress'
import React, { useEffect, useState } from 'react'

// From https://github.com/mui/material-ui/issues/9496#issuecomment-959408221
function GradientCircularProgress() {
  return (
    <React.Fragment>
      <svg width={0} height={0}>
        <defs>
          <linearGradient id="my_gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e01cd5" />
            <stop offset="100%" stopColor="#1CB5E0" />
          </linearGradient>
        </defs>
      </svg>
      <CircularProgress
        sx={{ 'svg circle': { stroke: 'url(#my_gradient)' } }}
      />
    </React.Fragment>
  )
}

const NetworkActivityProvider = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [requestCount, setRequestCount] = useState<number>(0)

  useEffect(() => {
    const originalFetch = window.fetch

    window.fetch = async (
      ...args: Parameters<typeof fetch>
    ): Promise<Response> => {
      setIsLoading(true)
      setRequestCount((prevCount) => prevCount + 1)

      try {
        const response: Response = await originalFetch(...args)
        return response
      } finally {
        setRequestCount((prevCount) => prevCount - 1)
        if (requestCount <= 1) {
          setTimeout(() => {
            setIsLoading(false)
          }, 500)
        }
      }
    }

    // Cleanup function
    return () => {
      window.fetch = originalFetch
    }
  }, [requestCount])

  return <>{isLoading && <Loader />}</>
}

const Loader: React.FC = () => {
  return (
    <div
      style={{
        bottom: '30px',
        position: 'absolute',
        zIndex: 9999,
        right: '50px',
        background: 'rgba(255, 255, 255, 0.5)',
        borderRadius: '11px',
        padding: '5px'
      }}
    >
      <GradientCircularProgress />
    </div>
  )
}

export default NetworkActivityProvider
