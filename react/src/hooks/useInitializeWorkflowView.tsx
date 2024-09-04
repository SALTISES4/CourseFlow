import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { matchPath } from 'react-router-dom'

const useInitializeWorkflowView = ({ tabs, setWorkflowView, workflowView }) => {
  const location = useLocation() // Hook to access the current URL location

  useEffect(() => {
    // Find the first tab that matches the current location
    const match = tabs.find((tab) =>
      matchPath(
        {
          path: tab.route,
          end: false, // Allows matching the starting segment of the URL
          strict: true, // Ensures the path is matched exactly (e.g., trailing slashes)
          exact: true // Ensures the full path matches
        },
        location.pathname
      )
    )

    // Check if a match was found and the workflowView needs updating
    if (match && workflowView !== match.type) {
      setWorkflowView(match.type) // Update the workflow context to reflect the current route
    }
  }, [location, tabs, setWorkflowView, workflowView]) // Dependencies for useEffect
}

export default useInitializeWorkflowView
