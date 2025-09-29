'use client'

import { useState } from 'react'
import { Swords, Shield, Crown, Users, LogOut, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import AuthModal from '@/components/AuthModal'

export default function HomePage() {
  const { user, profile, loading, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  if (loading) {
    return (
      <div className="game-container min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading Empire...</div>
      </div>
    )
  }

  return (
    <div className="game-container">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center text-white mb-16">
          <h1 className="text-6xl font-bold mb-6">
            ⚔️ EMPIRES
          </h1>
          <p className="text-xl mb-8 opacity-90">
            Build your empire, forge alliances, conquer worlds
          </p>
          <div className="flex justify-center gap-4">
            {user ? (
              <a
                href="/village"
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-lg text-lg transition-colors inline-block"
              >
                Enter Village
              </a>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-lg text-lg transition-colors"
              >
                Start Playing
              </button>
            )}
            <button className="border-2 border-white hover:bg-white hover:text-gray-800 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors">
              Learn More
            </button>
          </div>
        </div>

        {/* User Status */}
        {user && profile && (
          <div className="mb-8 flex justify-between items-center bg-black/30 rounded-lg p-4">
            <div className="flex items-center gap-4 text-white">
              <User className="w-6 h-6 text-yellow-400" />
              <div>
                <div className="font-bold">{profile.username}</div>
                <div className="text-sm opacity-75">
                  {profile.tribe === 1 ? 'Romans' : profile.tribe === 2 ? 'Teutons' : 'Gauls'} Tribe
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-white">
                <span className="text-yellow-400">Gold:</span> {profile.gold}
              </div>
              {profile.premium && (
                <div className="text-yellow-400 text-sm">
                  ⭐ Premium
                </div>
              )}
              <button
                onClick={signOut}
                className="text-gray-400 hover:text-white"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-white">
          <div className="text-center">
            <Swords className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
            <h3 className="text-xl font-bold mb-2">Epic Battles</h3>
            <p className="opacity-90">Command armies and conquer enemy villages</p>
          </div>

          <div className="text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-blue-400" />
            <h3 className="text-xl font-bold mb-2">Build & Defend</h3>
            <p className="opacity-90">Construct buildings and fortify your empire</p>
          </div>

          <div className="text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-green-400" />
            <h3 className="text-xl font-bold mb-2">Join Alliances</h3>
            <p className="opacity-90">Team up with players worldwide</p>
          </div>

          <div className="text-center">
            <Crown className="w-16 h-16 mx-auto mb-4 text-purple-400" />
            <h3 className="text-xl font-bold mb-2">Web3 Rewards</h3>
            <p className="opacity-90">Earn crypto rewards for your victories</p>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          console.log('Authentication successful!')
        }}
      />
    </div>
  )
}