import Loader from '@cfComponents/UIPrimitives/Loader'
import { useGetCurrentUserQuery } from '@XMLHTTP/API/user.rtk'
import { EUser } from '@XMLHTTP/types/entity'
import React, { ReactNode } from 'react'

type UserContextType = {
  id: number
  user: EUser
  changeFieldId: number
}

export const UserContext = React.createContext<UserContextType>(
  {} as UserContextType
)
interface UserProviderProps {
  children: ReactNode
}

const UserProvider = ({ children }: UserProviderProps) => {
  const { data, error, isLoading, isError } = useGetCurrentUserQuery()

  const changeFieldId = Math.floor(Math.random() * 10000)

  if (isLoading) {
    return <Loader />
  }

  return (
    <UserContext.Provider
      value={{
        id: data.dataPackage.id,
        user: data.dataPackage,
        changeFieldId: changeFieldId
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export default UserProvider
