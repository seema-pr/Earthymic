'use client'

/*
 * AuthProvider — UI-ONLY MOCK
 * ----------------------------------------------------------------
 * This mirrors the pattern used in CartProvider.tsx: a React Context
 * that holds auth state and exposes register/login/logout/update
 * functions to the rest of the app.
 *
 * There is no real backend yet. Accounts are stored in the browser's
 * localStorage purely so the register -> login -> profile -> logout
 * flow is fully testable while the UI is being built.
 *
 * TODO (when the Postgres backend is ready):
 *   - Replace readUsers/writeUsers + the bodies of register/login/
 *     updateProfile with real fetch() calls to your API routes
 *     (e.g. POST /api/auth/register, POST /api/auth/login).
 *   - Replace the localStorage session with a real session/cookie
 *     (e.g. Auth.js) and remove SESSION_KEY/USERS_KEY entirely.
 *   - Passwords here are stored in plain text in localStorage. This
 *     is ONLY acceptable because it's a local UI mock. A real
 *     backend must hash passwords (e.g. bcrypt) and never store or
 *     return plain text passwords.
 * ----------------------------------------------------------------
 */

import { createContext, useContext, useEffect, useState } from 'react'

type User = {
  id: string
  name: string
  email: string
}

type StoredUser = User & { password: string }

type AuthResult = { success: boolean; error?: string }

type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  register: (name: string, email: string, password: string) => Promise<AuthResult>
  login: (email: string, password: string) => Promise<AuthResult>
  logout: () => void
  updateProfile: (updates: { name?: string; email?: string }) => Promise<AuthResult>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const USERS_KEY = 'earthymic_users'
const SESSION_KEY = 'earthymic_session'

function readUsers(): StoredUser[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as StoredUser[]) : []
  } catch {
    return []
  }
}

function writeUsers(users: StoredUser[]) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  /*
   * Restore session on first load
   */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore of session from localStorage on mount, not a derivable render value
      if (raw) setUser(JSON.parse(raw) as User)
    } catch {
      // ignore corrupt/missing session
    } finally {
      setLoading(false)
    }
  }, [])

  const persistSession = (nextUser: User | null) => {
    setUser(nextUser)

    if (nextUser) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser))
    } else {
      window.localStorage.removeItem(SESSION_KEY)
    }
  }

  const register: AuthContextType['register'] = async (name, email, password) => {
    const trimmedName = name.trim()
    const normalizedEmail = email.trim().toLowerCase()

    if (!trimmedName) {
      return { success: false, error: 'Please enter your full name.' }
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return { success: false, error: 'Please enter a valid email address.' }
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' }
    }

    const users = readUsers()

    if (users.some((u) => u.email === normalizedEmail)) {
      return { success: false, error: 'An account with this email already exists.' }
    }

    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      name: trimmedName,
      email: normalizedEmail,
      password,
    }

    writeUsers([...users, newUser])
    persistSession({ id: newUser.id, name: newUser.name, email: newUser.email })

    return { success: true }
  }

  const login: AuthContextType['login'] = async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase()
    const users = readUsers()

    const found = users.find(
      (u) => u.email === normalizedEmail && u.password === password,
    )

    if (!found) {
      return { success: false, error: 'Invalid email or password.' }
    }

    persistSession({ id: found.id, name: found.name, email: found.email })
    return { success: true }
  }

  const logout = () => {
    persistSession(null)
  }

  const updateProfile: AuthContextType['updateProfile'] = async (updates) => {
    if (!user) {
      return { success: false, error: 'You must be logged in.' }
    }

    const users = readUsers()
    const index = users.findIndex((u) => u.id === user.id)

    if (index === -1) {
      return { success: false, error: 'Account not found.' }
    }

    const nextEmail = updates.email?.trim().toLowerCase()

    if (nextEmail && nextEmail !== users[index].email) {
      if (users.some((u) => u.email === nextEmail && u.id !== user.id)) {
        return { success: false, error: 'That email is already in use.' }
      }
    }

    const updated: StoredUser = {
      ...users[index],
      ...(updates.name ? { name: updates.name.trim() } : {}),
      ...(nextEmail ? { email: nextEmail } : {}),
    }

    const nextUsers = [...users]
    nextUsers[index] = updated
    writeUsers(nextUsers)

    persistSession({ id: updated.id, name: updated.name, email: updated.email })

    return { success: true }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        register,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
