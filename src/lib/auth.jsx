import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fetchMe, loginUser, logoutUser, registerUser } from './api'
import { setAuthToken } from './token'

const TOKEN_KEY = 'cinetrack_token'
const USER_KEY = 'cinetrack_user'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)

    if (!token) {
      setAuthToken(null)
      setInitializing(false)
      return
    }

    let active = true
    setAuthToken(token)
    fetchMe()
      .then(({ user: restored }) => {
        if (!active) return
        setUser(restored)
        localStorage.setItem(USER_KEY, JSON.stringify(restored))
      })
      .catch(() => {
        if (!active) return
        setAuthToken(null)
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      })
      .finally(() => {
        if (active) setInitializing(false)
      })

    return () => {
      active = false
    }
  }, [])

  const applySession = useCallback(({ token, user: nextUser }) => {
    setAuthToken(token)
    setUser(nextUser)
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
  }, [])

  const login = useCallback(
    async (credentials) => {
      const data = await loginUser(credentials)
      applySession(data)
      return data
    },
    [applySession],
  )

  const register = useCallback(
    async (fields) => {
      const data = await registerUser(fields)
      applySession(data)
      return data
    },
    [applySession],
  )

  const logout = useCallback(async () => {
    try {
      await logoutUser()
    } catch {
      // ignore network errors; the local session is cleared either way
    }
    setAuthToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }, [])

  const value = useMemo(
    () => ({ user, initializing, login, register, logout }),
    [user, initializing, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
