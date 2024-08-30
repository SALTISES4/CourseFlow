/*******************************************************
 * since we have so many class components left
 * we'll recreate the legacy with router HOC
 *
 *******************************************************/
import React from 'react'
import { PathMatch, RouteMatch } from 'react-router'
import {
  useParams,
  useNavigate,
  useLocation,
  useMatch,
  Params,
  NavigateFunction,
  Location
} from 'react-router-dom'

interface RouterProps {
  params: Readonly<Params<string>>
  navigate: NavigateFunction
  location: Location
  match: PathMatch<string> | null
}

function legacyWithRouter<T>(Component: React.ComponentType<T>) {
  const ComponentWithRouterProp: React.FC<T & RouterProps> = (
    props: T & RouterProps
  ) => {
    const params = useParams<string>()
    const navigate = useNavigate()
    const location = useLocation()
    const match = useMatch('/*')

    return (
      <Component
        {...(props as T)}
        params={params}
        navigate={navigate}
        navigator={navigate}
        location={location}
        match={match}
      />
    )
  }

  return ComponentWithRouterProp
}

export default legacyWithRouter
