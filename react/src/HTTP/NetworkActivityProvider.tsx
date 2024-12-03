import Box from '@mui/material/Box'
import CircularProgress, {
  CircularProgressProps,
  circularProgressClasses
} from '@mui/material/CircularProgress'
import LinearProgress, {
  linearProgressClasses
} from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import { styled } from '@mui/material/styles'
import React, { ReactNode, useEffect, useState } from 'react'

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 10,
  borderRadius: 5,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor: theme.palette.grey[200],
    ...theme.applyStyles('dark', {
      backgroundColor: theme.palette.grey[800]
    })
  },
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 5,
    backgroundColor: '#1a90ff',
    ...theme.applyStyles('dark', {
      backgroundColor: '#308fe8'
    })
  }
}))

// Inspired by the former Facebook spinners.
function FacebookCircularProgress(props: CircularProgressProps) {
  return (
    <Box sx={{ position: 'relative' }}>
      <CircularProgress
        variant="determinate"
        sx={(theme) => ({
          color: theme.palette.grey[200],
          ...theme.applyStyles('dark', {
            color: theme.palette.grey[800]
          })
        })}
        size={40}
        thickness={4}
        {...props}
        value={100}
      />
      <CircularProgress
        variant="indeterminate"
        disableShrink
        sx={(theme) => ({
          color: '#1a90ff',
          animationDuration: '550ms',
          position: 'absolute',
          left: 0,
          [`& .${circularProgressClasses.circle}`]: {
            strokeLinecap: 'round'
          },
          ...theme.applyStyles('dark', {
            color: '#308fe8'
          })
        })}
        size={40}
        thickness={4}
        {...props}
      />
    </Box>
  )
}

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
          setIsLoading(false)
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
