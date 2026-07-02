import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiRaw, setUnauthorizedHandler } from '../api'

export type AuthUser = { username: string; role: string }

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  isAdmin: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // On load, restore the session from the auth cookie (if any). A 401 here just
  // means "not logged in". Also wire the api layer to drop the session when a
  // protected call later returns 401.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null))
    apiRaw('/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: AuthUser | null) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (username: string, password: string) => {
    const res = await apiRaw('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) throw new Error('Ongeldige gebruikersnaam of wachtwoord')
    setUser((await res.json()) as AuthUser)
  }

  const logout = async () => {
    await apiRaw('/auth/logout', { method: 'POST' }).catch(() => {})
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin: user?.role === 'Admin', login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
