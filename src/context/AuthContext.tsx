import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  api,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
} from '@/lib/api'
import type { User, UserRole } from '@/types/database'

interface AuthState {
  user: User | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<{ error: string | null }>
  signOut: () => void
  hasRole: (...roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser())
  const [loading, setLoading] = useState(true)

  // ตรวจสอบ token ที่เก็บไว้ว่ายังใช้ได้ (เรียก me)
  useEffect(() => {
    let active = true
    if (!getToken()) {
      setLoading(false)
      return
    }
    api<User>('me')
      .then((u) => {
        if (!active) return
        setUser(u)
        setStoredUser(u)
      })
      .catch(() => {
        if (!active) return
        setToken(null)
        setStoredUser(null)
        setUser(null)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  async function signIn(username: string, password: string) {
    try {
      const res = await api<{ token: string; user: User }>('login', { username, password })
      setToken(res.token)
      setStoredUser(res.user)
      setUser(res.user)
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ' }
    }
  }

  function signOut() {
    setToken(null)
    setStoredUser(null)
    setUser(null)
  }

  function hasRole(...roles: UserRole[]) {
    return !!user && roles.includes(user.role)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth ต้องใช้ภายใน <AuthProvider>')
  return ctx
}
