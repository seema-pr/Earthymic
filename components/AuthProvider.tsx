'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'

type User = {
  id: string
  name: string
  email: string
  image?: string | null
}

type AuthResult = {
  success: boolean
  error?: string
}

type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  register: (
    name: string,
    email: string,
    password: string,
    phone: string,
  ) => Promise<AuthResult>
  login: (email: string, password: string) => Promise<AuthResult>
  logout: () => void
  updateProfile: (updates: {
    name?: string
    email?: string
  }) => Promise<AuthResult>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession()

  const [profileLoading, setProfileLoading] = useState(false)

  const user: User | null = session?.user
    ? {
        id: session.user.id ?? '',
        name: session.user.name ?? '',
        email: session.user.email ?? '',
        image: session.user.image,
      }
    : null

  const loading = status === 'loading' || profileLoading

  const register: AuthContextType['register'] = async (
    name,
    email,
    password,
    phone,
  ) => {
    const trimmedName = name.trim()
    const normalizedEmail = email.trim().toLowerCase()

    if (!trimmedName) {
      return {
        success: false,
        error: 'Please enter your full name.',
      }
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return {
        success: false,
        error: 'Please enter a valid email address.',
      }
    }

    if (password.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters.',
      }
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          email: normalizedEmail,
          password,
          phone: phone.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Unable to create your account.',
        }
      }

      /*
       * Registration creates the database User + Customer.
       *
       * We intentionally do not create a localStorage session.
       * Login must go through NextAuth.
       */
      return {
        success: true,
      }
    } catch (error) {
      console.error('Registration failed:', error)

      return {
        success: false,
        error: 'Unable to create your account. Please try again.',
      }
    }
  }

  const login: AuthContextType['login'] = async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail || !password) {
      return {
        success: false,
        error: 'Please enter your email and password.',
      }
    }

    try {
      const result = await signIn('credentials', {
        email: normalizedEmail,
        password,
        redirect: false,
      })

      if (!result || result.error) {
        return {
          success: false,
          error: 'Invalid email or password.',
        }
      }

      return {
        success: true,
      }
    } catch (error) {
      console.error('Login failed:', error)

      return {
        success: false,
        error: 'Unable to log in. Please try again.',
      }
    }
  }

  const logout = () => {
    void signOut({
      callbackUrl: '/login',
    })
  }

  const updateProfile: AuthContextType['updateProfile'] = async (updates) => {
    if (!user) {
      return {
        success: false,
        error: 'You must be logged in.',
      }
    }

    const name = updates.name?.trim()
    const email = updates.email?.trim().toLowerCase()

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return {
        success: false,
        error: 'Please enter a valid email address.',
      }
    }

    setProfileLoading(true)

    try {
      const response = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Unable to update your profile.',
        }
      }

      /*
       * Refresh the NextAuth session so the updated
       * user information becomes available to the UI.
       */
      await update()

      return {
        success: true,
      }
    } catch (error) {
      console.error('Profile update failed:', error)

      return {
        success: false,
        error: 'Unable to update your profile. Please try again.',
      }
    } finally {
      setProfileLoading(false)
    }
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
