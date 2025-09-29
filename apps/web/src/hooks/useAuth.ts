'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  username: string
  email: string
  tribe: number
  gold: number
  premium: boolean
  created_at: string
  last_active: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      if (session?.user) {
        // Fetch user profile
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        setProfile(profileData)
      }

      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, {
          user: !!session?.user,
          userConfirmed: session?.user?.email_confirmed_at,
          session: !!session
        })
        setUser(session?.user ?? null)

        if (session?.user) {
          console.log('Fetching profile for user:', session.user.id)
          try {
            // Fetch user profile with timeout
            const profilePromise = supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()

            // Add 10 second timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
            )

            const { data: profileData, error: profileError } = await Promise.race([
              profilePromise,
              timeoutPromise
            ]) as any

            console.log('Profile fetch result:', { profileData, profileError })

            if (profileError) {
              console.error('Profile fetch error:', profileError)

              // If profile doesn't exist (but user is authenticated), create it
              if (profileError.code === 'PGRST116') { // No rows found
                console.log('Profile not found, creating profile for user:', session.user.id)
                try {
                  const response = await fetch('/api/create-profile', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      userId: session.user.id,
                      email: session.user.email
                    }),
                  })

                  if (response.ok) {
                    const newProfile = await response.json()
                    console.log('Profile created successfully:', newProfile)
                    setProfile(newProfile.profile)
                  } else {
                    console.error('Failed to create profile:', response.status)
                    setProfile(null)
                  }
                } catch (createError) {
                  console.error('Error creating profile:', createError)
                  setProfile(null)
                }
              } else {
                // Other error, set profile to null
                setProfile(null)
              }
            } else {
              setProfile(profileData)
            }

            // Send welcome email on first successful login (after email confirmation)
            if (event === 'SIGNED_IN' && session.user.email_confirmed_at) {
              console.log('📧 User signed in for first time, sending welcome email')
              fetch('/api/send-welcome-email', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: session.user.id }),
              }).then(response => {
                if (response.ok) {
                  console.log('📧 Welcome email sent successfully')
                } else {
                  console.log('📧 Welcome email failed, status:', response.status)
                }
              }).catch(err => console.error('📧 Failed to send welcome email:', err))
            }
          } catch (error) {
            console.error('Error in auth state change:', error)
            setProfile(null)
          } finally {
            // Always set loading to false regardless of success/failure
            setLoading(false)
          }
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const refreshProfile = async () => {
    if (user) {
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)
    }
  }

  return {
    user,
    profile,
    loading,
    signOut,
    refreshProfile,
  }
}