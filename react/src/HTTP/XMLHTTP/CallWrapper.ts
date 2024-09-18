/*
All functions for API calls.
// @todo rename this file to 'XMLHttp' or 'ajax' etc (not just doing POST requests)
// @todo intermixed calls to DOM via jQuery
*/

/**
 *  Uses Fetch to POST data to a corresponding URL and
 *  interact with our "API" endpoints that fetch JSON data.
 *  Returns a Promise that can be then chained upon/consumed
 *  Rejects if the 'action' in JSON response hasn't 'posted'
 *  which can be caught and acted upon for error handling
 */

/**
 *
 * @param url
 * @constructor
 */
export function API_GET<T>(url = ''): Promise<any> {
  if (!url) {
    return Promise.reject('You need to specify an URL for API_GET to run.')
  }
  return new Promise((res, rej) => {
    fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
        // Assuming CSRF isn't needed for GET, but if needed, uncomment the next line
        // 'X-CSRFToken': window.getCsrfToken()
      }
    })
      .then((response) => response.json())
      .then((data) => {
        // Check if the response contains the expected data or a flag indicating success
        if (data && !data.error) {
          res(data)
        } else {
          // Otherwise reject with some potentially helpful info
          rej({ error: 'API_GET failed', url, data })
        }
      })
      .catch((err) => {
        rej({ error: 'API_GET failed', originalError: err })
      })
  })
}
/**
 *
 * @param url
 * @param data
 * @constructor
 */
export function API_POST<T>(url = '', data = {}): Promise<any> {
  if (!url) {
    return Promise.reject('You need to specify an URL in for API_POST to run.')
  }
  return new Promise((res, rej) => {
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'root' comes from the csrf-setup script
        'X-CSRFToken': window.getCsrfToken()
      },
      body: JSON.stringify(data)
    })
      .then((response) => {
        // if response code is 2xx, return body
        if (response.ok) {
          return response.json()
        }
        // here we have a handled server error
        // parse out the message we're returning from API
        // TDB whether we pass these messages on to the frontend
        return response.json().then((err) => {
          rej({
            error: JSON.stringify(err.error),
            statusCode: response.status,
            errorDetails: err
          })
        })
      })
      .then((data) => {
        res(data)
      })
      // final catch a real network failure
      .catch((err) => {
        rej({ error: 'unhandled network error', originalError: err })
      })
  })
}

/**
 *
 * @param url
 * @param data
 * @param file
 * @constructor
 */
export function API_POST_FILE<T>(
  url = '',
  data = {},
  file = null
): Promise<any> {
  if (!url) {
    return Promise.reject('You need to specify an URL in for API_POST to run.')
  }
  const form_data = new FormData()
  form_data.set('body', JSON.stringify(data))
  form_data.set('file', file)
  return new Promise((res, rej) => {
    fetch(url, {
      method: 'POST',
      headers: {
        // // 'root' comes from the csrf-setup script
        'X-CSRFToken': window.getCsrfToken()
      },
      body: form_data
    })
      // convert to JSON
      .then((response) => response.json())
      .then((data) => {
        // and if the action successfully posted, resolve the initial promise
        res(data)
      })
      // and finally reject if anything fishy is going on
      .catch((err) => {
        rej({ error: 'API_POST failed', originalError: err })
      })
  })
}
