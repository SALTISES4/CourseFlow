// import $ from 'jquery'

/*
All functions for API calls.
// @todo rename this file to 'XMLHttp' or 'ajax' etc (not just doing POST requests)
// @todo intermixed calls to DOM via jQuery
*/

// Uses Fetch to POST data to a corresponding URL and
// interact with our "API" endpoints that fetch JSON data.
// Returns a Promise that can be then chained upon/consumed
// Rejects if the 'action' in JSON response hasn't 'posted'
// which can be caught and acted upon for error handling

import { VERB } from '@cfModule/types/common'

export function API_POST(url = '', data = {}) {
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
      // convert to JSON
      .then((response) => response.json())
      .then((data) => {
        // and if the action successfully posted, resolve the initial promise
        if (data.action === VERB.POSTED) {
          res(data)
        } else {
          // otherwise reject with some potentially helpful info
          rej({ error: 'API_POST failed', url, data })
        }
      })
      // and finally reject if anything fishy is going on
      .catch((err) => {
        rej({ error: 'API_POST failed', originalError: err })
      })
  })
}

//get live project data
