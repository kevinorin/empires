'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Mail, Sword, Building, Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import AuthModal from '@/components/AuthModal'

export default function ConfirmationPage() {
  const { user, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const searchParams = useSearchParams()

  // Check if this is an email confirmation
  const token = searchParams.get('token')
  const type = searchParams.get('type')
  const isEmailConfirmation = type === 'signup'

  useEffect(() => {
    // If user is already authenticated, redirect to village
    if (user && !loading) {
      window.location.href = '/village'
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="game-container min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="game-container min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Redirecting to your village...</div>
          <Link
            href="/village"
            className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-6 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200"
          >
            Continue to Village
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="game-container min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">
            🎉 Email Confirmed!
          </h1>
          <p className="text-xl text-gray-300 mb-2">Welcome to Empires!</p>
          <p className="text-gray-400">
            Your account has been successfully verified. Now sign in to start building your empire.
          </p>
        </div>

        {/* Call to Action */}
        <div className="mb-12">
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-8 py-4 rounded-lg font-bold text-lg hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 shadow-lg"
          >
            Sign In to Your Empire
            <ArrowRight className="w-5 h-5 inline-block ml-2" />
          </button>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 hover:border-yellow-400/50 transition-colors">
            <Building className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Build Your City</h3>
            <p className="text-gray-400 text-sm">Construct and upgrade buildings to grow your empire and increase resource production.</p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 hover:border-red-400/50 transition-colors">
            <Sword className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Train Your Army</h3>
            <p className="text-gray-400 text-sm">Build barracks and train powerful military units to defend and expand your territory.</p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 hover:border-blue-400/50 transition-colors">
            <Users className="w-12 h-12 text-blue-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Form Alliances</h3>
            <p className="text-gray-400 text-sm">Team up with other players to coordinate attacks and defend against enemies.</p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
          <Mail className="w-8 h-8 text-blue-400 mx-auto mb-3" />
          <h4 className="text-white font-semibold mb-2">What's Next?</h4>
          <p className="text-gray-400 text-sm">
            Sign in with the same email address you used to create your account.
            Your village and resources are waiting for you!
          </p>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false)
          // Redirect to village after successful login
          window.location.href = '/village'
        }}
      />
    </div>
  )
}