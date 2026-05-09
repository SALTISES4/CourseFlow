import { mapCurrentUserToEUser } from '@cf/context/mapCurrentUserToEUser'
import {
  selectAuthStatus,
  selectAuthUser
} from '@cf/features/auth/state/auth.slice'
import Loader from '@cfComponents/UIPrimitives/Loader'
import { EUser } from '@XMLHTTP/types/entity'
import { ReactNode, createContext } from 'react'
import { useSelector } from 'react-redux'

type UserContextType = {
  uuid: string
  user: EUser
}

export const UserContext = createContext<UserContextType>({
  uuid: '',
  user: null
})

interface UserProviderProps {
  children: ReactNode
}

/**
 * Supplies legacy EUser from Redux auth (v2 Bearer + /api/auth/me).
 * Only used under protected shell routes where auth is already established.
 */
const UserProvider = ({ children }: UserProviderProps) => {
  const status = useSelector(selectAuthStatus)
  const user = useSelector(selectAuthUser)

  if (status === 'authenticated' && !user) {
    return <Loader />
  }

  if (status !== 'authenticated' || !user) {
    return <>{children}</>
  }

  const eUser = mapCurrentUserToEUser(user)

  return (
    <UserContext.Provider
      value={{
        uuid: eUser.uuid,
        user: eUser
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export default UserProvider
