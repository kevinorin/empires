'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Building, Plus, Hammer, Sword, Shield, Users, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import AuthModal from '@/components/AuthModal'

interface MockVillage {
  id: string
  name: string
  x: number
  y: number
  population: number
  wood: number
  clay: number
  iron: number
  crop: number
  wood_production: number
  clay_production: number
  iron_production: number
  crop_production: number
}

interface MockBuilding {
  id: string
  type: string
  level: number
  name: string
  description: string
  icon: string
}

const mockVillage: MockVillage = {
  id: '1',
  name: 'Capital City',
  x: 0,
  y: 0,
  population: 87,
  wood: 750,
  clay: 680,
  iron: 720,
  crop: 650,
  wood_production: 30,
  clay_production: 25,
  iron_production: 20,
  crop_production: 35
}

const mockBuildings: MockBuilding[] = [
  { id: '1', type: 'woodcutter', level: 3, name: 'Woodcutter', description: 'Produces wood', icon: '🌲' },
  { id: '2', type: 'clay_pit', level: 2, name: 'Clay Pit', description: 'Produces clay', icon: '🏺' },
  { id: '3', type: 'iron_mine', level: 2, name: 'Iron Mine', description: 'Produces iron', icon: '⛏️' },
  { id: '4', type: 'cropland', level: 4, name: 'Cropland', description: 'Produces crop', icon: '🌾' },
  { id: '5', type: 'warehouse', level: 1, name: 'Warehouse', description: 'Stores resources', icon: '🏪' },
  { id: '6', type: 'granary', level: 1, name: 'Granary', description: 'Stores crop', icon: '🌾' },
  { id: '7', type: 'main_building', level: 1, name: 'Main Building', description: 'Village center', icon: '🏛️' },
]

export default function VillagePageMock() {
  const { user, loading: authLoading } = useAuth()
  const [village, setVillage] = useState<MockVillage>(mockVillage)
  const [buildings, setBuildings] = useState<MockBuilding[]>(mockBuildings)
  const [selectedBuilding, setSelectedBuilding] = useState<MockBuilding | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Simulate resource production every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setVillage(prev => ({
        ...prev,
        wood: Math.min(prev.wood + Math.floor(prev.wood_production / 12), 8000),
        clay: Math.min(prev.clay + Math.floor(prev.clay_production / 12), 8000),
        iron: Math.min(prev.iron + Math.floor(prev.iron_production / 12), 8000),
        crop: Math.min(prev.crop + Math.floor(prev.crop_production / 12), 8000),
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleUpgradeBuilding = (building: MockBuilding) => {
    setSelectedBuilding(building)
    setShowUpgradeModal(true)
  }

  const confirmUpgrade = () => {
    if (selectedBuilding) {
      // Calculate upgrade costs (simplified)
      const baseCost = selectedBuilding.level * 100
      const woodCost = baseCost
      const clayCost = baseCost
      const ironCost = baseCost * 0.5
      const cropCost = baseCost * 0.3

      if (village.wood >= woodCost && village.clay >= clayCost && 
          village.iron >= ironCost && village.crop >= cropCost) {
        
        // Deduct resources
        setVillage(prev => ({
          ...prev,
          wood: prev.wood - woodCost,
          clay: prev.clay - clayCost,
          iron: prev.iron - ironCost,
          crop: prev.crop - cropCost,
        }))

        // Upgrade building
        setBuildings(prev => prev.map(b => 
          b.id === selectedBuilding.id 
            ? { ...b, level: b.level + 1 }
            : b
        ))

        // Update production if it's a resource building
        if (selectedBuilding.type.includes('woodcutter') || 
            selectedBuilding.type.includes('clay_pit') ||
            selectedBuilding.type.includes('iron_mine') ||
            selectedBuilding.type.includes('cropland')) {
          setVillage(prev => ({
            ...prev,
            wood_production: selectedBuilding.type === 'woodcutter' ? prev.wood_production + 5 : prev.wood_production,
            clay_production: selectedBuilding.type === 'clay_pit' ? prev.clay_production + 5 : prev.clay_production,
            iron_production: selectedBuilding.type === 'iron_mine' ? prev.iron_production + 5 : prev.iron_production,
            crop_production: selectedBuilding.type === 'cropland' ? prev.crop_production + 5 : prev.crop_production,
          }))
        }
      }
    }
    setShowUpgradeModal(false)
    setSelectedBuilding(null)
  }

  if (authLoading) {
    return (
      <div className="game-container min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading Village...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="game-container min-h-screen flex flex-col items-center justify-center">
        <div className="max-w-md mx-auto text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🏛️ Welcome to Your Empire!</h1>
          <p className="text-gray-300 mb-6">
            Your account has been confirmed! Please sign in to access your village and start building your empire.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-8 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200"
          >
            Sign In to Your Empire
          </button>
        </div>
        
        {/* Show features preview */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
          <div className="bg-gray-800/50 rounded-lg p-6 text-center">
            <Building className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Build & Upgrade</h3>
            <p className="text-gray-400 text-sm">Construct buildings to grow your empire</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-6 text-center">
            <Sword className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Train Armies</h3>
            <p className="text-gray-400 text-sm">Build powerful military units</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-6 text-center">
            <Users className="w-12 h-12 text-blue-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Join Alliances</h3>
            <p className="text-gray-400 text-sm">Team up with other players</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="game-container min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white hover:text-yellow-400">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">{village.name}</h1>
              <p className="text-gray-300">Coordinates: ({village.x}, {village.y})</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-white">
            <Users className="w-5 h-5 text-blue-400" />
            <span>{village.population}</span>
          </div>
        </div>

        {/* Resources */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-black/30 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🌲</div>
            <div className="text-white font-bold">{village.wood.toLocaleString()}</div>
            <div className="text-green-400 text-sm">+{village.wood_production}/h</div>
          </div>
          <div className="bg-black/30 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🏺</div>
            <div className="text-white font-bold">{village.clay.toLocaleString()}</div>
            <div className="text-green-400 text-sm">+{village.clay_production}/h</div>
          </div>
          <div className="bg-black/30 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">⛏️</div>
            <div className="text-white font-bold">{village.iron.toLocaleString()}</div>
            <div className="text-green-400 text-sm">+{village.iron_production}/h</div>
          </div>
          <div className="bg-black/30 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🌾</div>
            <div className="text-white font-bold">{village.crop.toLocaleString()}</div>
            <div className="text-green-400 text-sm">+{village.crop_production}/h</div>
          </div>
        </div>

        {/* Buildings */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Buildings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buildings.map((building) => (
              <div key={building.id} className="bg-black/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{building.icon}</span>
                    <div>
                      <h3 className="text-white font-bold">{building.name}</h3>
                      <p className="text-gray-400 text-sm">Level {building.level}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUpgradeBuilding(building)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-gray-300 text-sm">{building.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/village/buildings" className="bg-purple-600/20 border border-purple-500 rounded-lg p-6 text-center hover:bg-purple-600/30 transition-colors">
            <Building className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <h3 className="text-white font-bold mb-1">Build</h3>
            <p className="text-gray-300 text-sm">Construct new buildings</p>
          </Link>
          
          <Link href="/village/troops" className="bg-red-600/20 border border-red-500 rounded-lg p-6 text-center hover:bg-red-600/30 transition-colors">
            <Sword className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <h3 className="text-white font-bold mb-1">Army</h3>
            <p className="text-gray-300 text-sm">Train troops and units</p>
          </Link>
          
          <Link href="/village/reports" className="bg-blue-600/20 border border-blue-500 rounded-lg p-6 text-center hover:bg-blue-600/30 transition-colors">
            <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <h3 className="text-white font-bold mb-1">Reports</h3>
            <p className="text-gray-300 text-sm">View battle reports</p>
          </Link>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedBuilding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-white text-xl font-bold mb-4">
              Upgrade {selectedBuilding.name}
            </h3>
            <p className="text-gray-300 mb-4">
              Upgrade from level {selectedBuilding.level} to {selectedBuilding.level + 1}
            </p>
            
            <div className="mb-4">
              <h4 className="text-white font-bold mb-2">Cost:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span>🌲</span>
                  <span className="text-white">{selectedBuilding.level * 100}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🏺</span>
                  <span className="text-white">{selectedBuilding.level * 100}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>⛏️</span>
                  <span className="text-white">{Math.floor(selectedBuilding.level * 50)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🌾</span>
                  <span className="text-white">{Math.floor(selectedBuilding.level * 30)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={confirmUpgrade}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
              >
                Upgrade
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false)
          // Refresh the page or reload user data
          window.location.reload()
        }}
      />
    </div>
  )
}