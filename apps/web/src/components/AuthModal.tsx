'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Mail, Lock, Sword } from 'lucide-react'
import { empiresToast } from '@/lib/toast'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [tribe, setTribe] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
              tribe,
            }
          }
        })
        if (error) throw error

        console.log('Signup data:', data)

        // Handle user creation (both with and without email confirmation)
        if (data.user) {
          console.log('✅ User account created, user ID:', data.user.id)

          // Create user profile via server-side API (bypasses RLS issues)
          console.log('🔄 Creating user profile via API...')
          try {
            const profileResponse = await fetch('/api/create-profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: data.user.id,
                email,
                username,
                tribe,
              }),
            })

            if (!profileResponse.ok) {
              const errorText = await profileResponse.text()
              console.error('❌ Profile creation failed:', errorText)
            } else {
              const profileData = await profileResponse.json()
              console.log('✅ User profile created successfully:', profileData)
            }
          } catch (err) {
            console.error('❌ Profile creation error:', err)
          }

          // Welcome email will be sent after email confirmation via webhook or login
          console.log('✅ Profile created, user will receive welcome email after confirming email')

          // Check if email confirmation is required
          if (!data.session) {
            // Email confirmation required
            setError('')
            empiresToast.success(`🎉 Empire created! Check your email (${email}) for the activation link. Click it, then sign in here to start building!`)
            onClose()
            return
          }
        }
      }

      if (!isLogin) {
        // For signup, show success message about email confirmation
        setError('')
        empiresToast.success('🎉 Empire created! Check your email for the activation link, then sign in to start building!')
      }

      console.log('Auth flow completed successfully')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Auth error:', error)

      // Provide better error messages
      if (error.message === 'Invalid login credentials') {
        if (isLogin) {
          setError('Invalid email or password. Make sure you\'ve confirmed your account via email first.')
        } else {
          setError('This email is already registered. Please sign in instead.')
        }
      } else if (error.message.includes('Email not confirmed')) {
        setError('Please check your email and confirm your account before signing in.')
      } else if (error.message.includes('already registered')) {
        setError('This email is already registered. Please sign in instead.')
      } else {
        setError(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const tribes = [
    {
      id: 1,
      name: 'Romans',
      description: 'Balanced offense and defense',
      icon: '🏛️'
    },
    {
      id: 2,
      name: 'Teutons',
      description: 'Superior defense and raiding',
      icon: '⚔️'
    },
    {
      id: 3,
      name: 'Gauls',
      description: 'Speed and merchant abilities',
      icon: '🛡️'
    },
    {
      id: 4,
      name: 'Egyptians',
      description: 'Ancient wisdom and power',
      icon: '🏺'
    },
    {
      id: 5,
      name: 'Nubians',
      description: 'Desert warriors and gold traders',
      icon: '🏹'
    }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-yellow-500 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sword className="w-5 h-5 text-yellow-400" />
            {isLogin ? 'Enter Empire' : 'Join Empire'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-3">
          {!isLogin && (
            <div>
              <label className="block text-white mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-yellow-500 focus:outline-none"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-white mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-yellow-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-white mb-2">
              <Lock className="w-4 h-4 inline mr-2" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-yellow-500 focus:outline-none"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-white mb-2">Choose Your Tribe</label>
              <div className="grid grid-cols-2 gap-2">
                {tribes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTribe(t.id as 1 | 2 | 3 | 4 | 5)}
                    className={`p-2 rounded border text-center transition-colors ${tribe === t.id
                      ? 'border-yellow-500 bg-yellow-500/20 text-white'
                      : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                      }`}
                  >
                    <div className="text-lg mb-1">{t.icon}</div>
                    <div className="text-sm font-bold">{t.name}</div>
                  </button>
                ))}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {tribes.find(t => t.id === tribe)?.description}
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-500 rounded p-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 text-black font-bold py-3 rounded transition-colors"
          >
            {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Empire'}
          </button>
        </form>

        {isLogin && (
          <div className="mt-3 text-center">
            <p className="text-gray-400 text-xs">
              💡 New empire? Check your email for the activation link first!
            </p>
          </div>
        )}

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-yellow-400 hover:text-yellow-300 text-sm"
          >
            {isLogin ? "Don't have an empire? Create one!" : "Already have an empire? Sign in!"}
          </button>
        </div>
      </div>
    </div>
  )
}