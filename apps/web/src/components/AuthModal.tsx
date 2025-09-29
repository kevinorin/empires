'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Mail, Lock, Sword } from 'lucide-react'

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

        // The trigger should automatically create the user profile
        // If it doesn't work, we might need to manually create it
        if (data.user && data.session) {
          // Wait a moment for the trigger to complete
          await new Promise(resolve => setTimeout(resolve, 500))

          // Check if profile was created, if not, create it manually
          const { data: profile, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single()

          if (fetchError || !profile) {
            console.log('Profile not found, creating manually...')
            console.log('User ID:', data.user.id)
            console.log('Username:', username)
            console.log('Email:', email)
            console.log('Tribe:', tribe)

            const { error: profileError } = await supabase
              .from('users')
              .insert({
                id: data.user.id,
                username,
                email,
                tribe,
              })

            if (profileError) {
              console.error('Profile creation error:', profileError)
              console.error('Error details:', JSON.stringify(profileError, null, 2))
              // Don't throw here, as the user is still authenticated
            } else {
              console.log('Profile created successfully!')
            }
          } else {
            console.log('Profile found:', profile)
          }

          // Send welcome email (don't await to avoid blocking UI)
          if (data.user) {
            fetch('/api/send-welcome-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ userId: data.user.id }),
            }).catch(err => console.error('Failed to send welcome email:', err))
          }
        }
      }

      if (!isLogin) {
        // For signup, show success message about email confirmation
        setError('')
        alert('Account created successfully! Please check your email and click the confirmation link before signing in.')
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