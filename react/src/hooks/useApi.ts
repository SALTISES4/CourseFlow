import { useEffect, useState } from 'react'

function useApi<APIResponseType>(
  url: string,
  debug = false
): [APIResponseType, boolean, null | { response: Response; message: string }] {
  const [state, setState] = useState({
    loading: true,
    data: {} as APIResponseType,
    error: null
  })

  useEffect(() => {
    debug && console.log(`API fetching from: ${url}`)

    fetch(url).then((response) => {
      if (response.ok) {
        response.json().then((data) => {
          debug && console.log(data)
          setState({
            loading: false,
            error: null,
            data
          })
        })
      } else {
        debug && console.log('Error', response)
        setState({
          loading: false,
          data: null,
          error: {
            response: response,
            message: `Error fetching from API URL: ${url}`
          }
        })
      }
    })
  }, [url, debug])

  return [{ ...state.data }, state.loading, state.error]
}

export default useApi
