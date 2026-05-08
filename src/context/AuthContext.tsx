'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, AuthState } from '@/types'

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = async () => {
    try {
      const supabase = createClient()

      // Timeout to prevent hanging on stale tokens after deploys
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000))
      const authPromise = supabase.auth.getUser().then(r => r.data.user).catch(() => null)
      const authUser = await Promise.race([authPromise, timeout])

      if (authUser) {
        const controller = new AbortController()
        const fetchTimeout = setTimeout(() => controller.abort(), 5000)
        try {
          const res = await fetch('/api/auth/me', { cache: 'no-store', signal: controller.signal })
          clearTimeout(fetchTimeout)
          const data = await res.json()
          if (data.success) {
            setUser(data.data)
          } else {
            setUser(null)
          }
        } catch {
          clearTimeout(fetchTimeout)
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    checkAuth()

    // Failsafe: if loading hangs for 4s (stale tokens, network issues), force stop
    const failsafe = setTimeout(() => {
      setIsLoading(false)
    }, 4000)

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        await checkAuth()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setIsLoading(false)
      }
    })

    return () => {
      clearTimeout(failsafe)
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (data.success) {
        setUser(data.data.user)
        return { success: true }
      }
      return { success: false, error: data.error || 'Error de autenticación' }
    } catch {
      return { success: false, error: 'Error de conexión' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      const supabase = createClient()
      await supabase.auth.signOut()
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      token: user ? 'session' : null,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      checkAuth,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
