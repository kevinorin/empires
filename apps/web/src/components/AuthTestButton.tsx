'use client'

import { useState } from 'react'

export default function AuthTestButton() {
  const [result, setResult] = useState<string>('')

  const testAuth = async () => {
    try {
      const response = await fetch('/api/auth-test')
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult(`Error: ${error}`)
    }
  }

  return (
    <div className="p-4 bg-gray-100 rounded">
      <button
        onClick={testAuth}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Test Auth
      </button>
      {result && (
        <pre className="mt-4 p-2 bg-white rounded text-sm overflow-auto">
          {result}
        </pre>
      )}
    </div>
  )
}