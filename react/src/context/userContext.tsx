import Loader from '@cfComponents/UIPrimitives/Loader'
import { useQuery } from '@tanstack/react-query'
import { getCurrentUserQuery } from '@XMLHTTP/API/user'
import { CurrentUserQueryResp } from '@XMLHTTP/types/query'
import React, { ReactNode } from 'react'

type UserContextType = {
  id: number
  name: string
  changeFieldID: number
}

export const UserContext = React.createContext<UserContextType>(
  {} as UserContextType
)
interface UserProviderProps {
  children: ReactNode
}

const UserProvider = ({ children }: UserProviderProps) => {
  const { data, error, isLoading, isError } = useQuery<CurrentUserQueryResp>({
    queryKey: ['getCurrentUserQuery'], // how to manager the cache key
    queryFn: () => {
      return getCurrentUserQuery()
    }
  })

  const changeFieldId = Math.floor(Math.random() * 10000)

  if (isLoading) return <Loader />

  return (
    <UserContext.Provider
      value={{
        id: data.dataPackage.id,
        name: data.dataPackage.name,
        changeFieldID: changeFieldId
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export default UserProvider
