import Cookies from 'js-cookie'
import React, { ReactNode, createContext, useContext, useState } from 'react'

export enum CookieTypes {
  HIDE_HOME_WELCOME_MESSAGE = 'hide_home_welcome_message',
  HIDE_HOME_HOWTO_TEMPLATE_MESSAGE = 'hide_home_howto_template_message'
}

interface CookieContextType {
  cookies: { [key: string]: string }
  updateCookie: (
    name: string,
    value: string,
    options?: Cookies.CookieAttributes
  ) => void
  removeCookie: (name: string) => void
}

const CookieContext = createContext<CookieContextType | null>(null)

interface CookieProviderProps {
  children: ReactNode
}

export const CookieProvider: React.FC<CookieProviderProps> = ({ children }) => {
  const [cookies, setCookies] = useState<{ [key: string]: string }>(() =>
    Cookies.get()
  )

  const updateCookie = (
    name: string,
    value: string,
    options?: Cookies.CookieAttributes
  ) => {
    Cookies.set(name, value, options)
    setCookies(Cookies.get())
  }

  const removeCookie = (name: string) => {
    Cookies.remove(name)
    setCookies(Cookies.get())
  }

  return (
    <CookieContext.Provider value={{ cookies, updateCookie, removeCookie }}>
      {children}
    </CookieContext.Provider>
  )
}

export const useCookies = (): CookieContextType => {
  const context = useContext(CookieContext)
  if (!context) {
    throw new Error('useCookies must be used within a CookieProvider')
  }
  return context
}
