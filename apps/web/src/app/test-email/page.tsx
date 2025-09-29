'use client'

import { useState } from 'react'

export default function TestEmailPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const sendTestEmail = async (type: string) => {
    if (!email) return

    setLoading(true)
    setResult('')

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, type }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email')
      }

      setResult(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} email sent successfully!`)
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="game-container min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-gray-900 border border-yellow-500 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            📧 Email Testing
          </h1>

          <div className="space-y-4">
            <div>
              <label className="block text-white mb-2">Test Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-yellow-500 focus:outline-none"
                placeholder="your-email@example.com"
              />
            </div>

            <div className="space-y-2">
              <button
                onClick={() => sendTestEmail('welcome')}
                disabled={loading || !email}
                className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 text-black font-bold py-3 rounded transition-colors"
              >
                {loading ? 'Sending...' : 'Test Welcome Email'}
              </button>

              <button
                onClick={() => sendTestEmail('alliance')}
                disabled={loading || !email}
                className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white font-bold py-3 rounded transition-colors"
              >
                {loading ? 'Sending...' : 'Test Alliance Invitation'}
              </button>

              <button
                onClick={() => sendTestEmail('reset')}
                disabled={loading || !email}
                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white font-bold py-3 rounded transition-colors"
              >
                {loading ? 'Sending...' : 'Test Password Reset'}
              </button>
            </div>

            {result && (
              <div className={`p-3 rounded text-center ${result.includes('✅')
                  ? 'bg-green-900/20 border border-green-500 text-green-400'
                  : 'bg-red-900/20 border border-red-500 text-red-400'
                }`}>
                {result}
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <a href="/" className="text-yellow-400 hover:text-yellow-300">
              ← Back to Game
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}