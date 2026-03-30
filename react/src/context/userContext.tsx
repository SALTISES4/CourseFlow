import { mapCurrentUserToEUser } from '@cf/context/mapCurrentUserToEUser'
import Loader from '@cfComponents/UIPrimitives/Loader'
import { selectAuthStatus, selectAuthUser } from '@cfRedux/slices/auth.slice'
import { EUser } from '@XMLHTTP/types/entity'
import React, { ReactNode } from 'react'
import { useSelector } from 'react-redux'

type UserContextType = {
  id: number
  user: EUser
}

export const UserContext = React.createContext<UserContextType>(
  {} as UserContextType
)

interface UserProviderProps {
  children: ReactNode
}

/**
 * Supplies legacy EUser from Redux auth (v2 Bearer + /api/auth/me).
 * Only used under protected shell routes where auth is already established.
 */
const UserProvider = ({ children }: UserProviderProps) => {
  const status = useSelector(selectAuthStatus)
  const current = useSelector(selectAuthUser)

  if (status === 'authenticated' && !current) {
    return <Loader />
  }

  if (status !== 'authenticated' || !current) {
    return <>{children}</>
  }

  const eUser = mapCurrentUserToEUser(current)

  return (
    <UserContext.Provider
      value={{
        id: eUser.id,
        user: eUser
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export default UserProvider
