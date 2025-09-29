'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Building, Plus, Hammer, Sword, Shield, Users } from 'lucide-react'

interface Village {
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

interface BuildingData {
  id: string
  type: number
  level: number
  village_id: string
}

export default function VillagePage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [village, setVillage] = useState<Village | null>(null)
  const [buildings, setBuildings] = useState<BuildingData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user && !authLoading) {
      loadVillageData()
    }
  }, [user, authLoading])

  const loadVillageData = async () => {
    try {
      // Load user's main village
      const { data: villageData, error: villageError } = await supabase
        .from('villages')
        .select('*')
        .eq('owner_id', user!.id)
        .eq('capital', true)
        .single()

      if (villageError) {
        // If no village exists, create one
        if (villageError.code === 'PGRST116') {
          await createStarterVillage()
          return
        }
        throw villageError
      }

      setVillage(villageData)

      // Load buildings
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select('*')
        .eq('village_id', villageData.id)

      if (buildingsError) throw buildingsError
      setBuildings(buildingsData || [])

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createStarterVillage = async () => {
    try {
      // Generate random coordinates near (0,0)
      const x = Math.floor(Math.random() * 21) - 10 // -10 to 10
      const y = Math.floor(Math.random() * 21) - 10 // -10 to 10

      const { data: newVillage, error: villageError } = await supabase
        .from('villages')
        .insert({
          owner_id: user!.id,
          name: `${profile?.username}'s Village`,
          x,
          y,
          capital: true,
          population: 2,
          wood: 750,
          clay: 750,
          iron: 750,
          crop: 750,
          wood_production: 6,
          clay_production: 6,
          iron_production: 6,
          crop_production: 6,
        })
        .select()
        .single()

      if (villageError) throw villageError

      // Create starter buildings
      const starterBuildings = [
        { type: 1, level: 0 }, // Woodcutter
        { type: 2, level: 0 }, // Clay pit
        { type: 3, level: 0 }, // Iron mine
        { type: 4, level: 0 }, // Cropland
        { type: 39, level: 1 }, // Main building
      ]

      const { error: buildingsError } = await supabase
        .from('buildings')
        .insert(
          starterBuildings.map(b => ({
            village_id: newVillage.id,
            type: b.type,
            level: b.level,
          }))
        )

      if (buildingsError) throw buildingsError

      // Reload data
      await loadVillageData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const getBuildingName = (type: number): string => {
    const buildingNames: { [key: number]: string } = {
      1: 'Woodcutter',
      2: 'Clay Pit',
      3: 'Iron Mine',
      4: 'Cropland',
      5: 'Sawmill',
      6: 'Brickyard',
      7: 'Iron Foundry',
      8: 'Grain Mill',
      9: 'Bakery',
      10: 'Warehouse',
      11: 'Granary',
      15: 'Barracks',
      39: 'Main Building',
    }
    return buildingNames[type] || `Building ${type}`
  }

  const getBuildingIcon = (type: number) => {
    if (type <= 4) return '🏭' // Resource buildings
    if (type <= 9) return '⚙️' // Processing buildings
    if (type <= 11) return '🏪' // Storage buildings
    if (type === 15) return '⚔️' // Barracks
    if (type === 39) return '🏛️' // Main building
    return '🏢'
  }

  if (authLoading || loading) {
    return (
      <div className="game-container min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading village...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="game-container min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Please log in to view your village</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="game-container min-h-screen flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    )
  }

  if (!village) {
    return (
      <div className="game-container min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Creating your village...</div>
      </div>
    )
  }

  return (
    <div className="game-container min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Village Header */}
        <div className="bg-gray-900 border border-yellow-500 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{village.name}</h1>
              <p className="text-gray-300">
                Coordinates: ({village.x}, {village.y}) | Population: {village.population}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Level {Math.max(...buildings.map(b => b.level), 1)} Village</div>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-2xl">🪵</div>
              <div className="text-yellow-200 font-bold">Wood</div>
            </div>
            <div className="text-white text-xl font-bold">{village.wood.toLocaleString()}</div>
            <div className="text-sm text-yellow-300">+{village.wood_production}/hour</div>
          </div>

          <div className="bg-orange-900/30 border border-orange-600 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-2xl">🧱</div>
              <div className="text-orange-200 font-bold">Clay</div>
            </div>
            <div className="text-white text-xl font-bold">{village.clay.toLocaleString()}</div>
            <div className="text-sm text-orange-300">+{village.clay_production}/hour</div>
          </div>

          <div className="bg-gray-900/30 border border-gray-600 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-2xl">⚒️</div>
              <div className="text-gray-200 font-bold">Iron</div>
            </div>
            <div className="text-white text-xl font-bold">{village.iron.toLocaleString()}</div>
            <div className="text-sm text-gray-300">+{village.iron_production}/hour</div>
          </div>

          <div className="bg-green-900/30 border border-green-600 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-2xl">🌾</div>
              <div className="text-green-200 font-bold">Crop</div>
            </div>
            <div className="text-white text-xl font-bold">{village.crop.toLocaleString()}</div>
            <div className="text-sm text-green-300">+{village.crop_production}/hour</div>
          </div>
        </div>

        {/* Buildings */}
        <div className="bg-gray-900 border border-yellow-500 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Building className="w-6 h-6" />
            Buildings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buildings.map((building) => (
              <div key={building.id} className="bg-black/20 border border-gray-700 rounded-lg p-4 hover:border-yellow-500 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl">{getBuildingIcon(building.type)}</div>
                  <div>
                    <div className="text-white font-bold">{getBuildingName(building.type)}</div>
                    <div className="text-sm text-gray-400">Level {building.level}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="bg-yellow-500 hover:bg-yellow-600 text-black text-sm px-3 py-1 rounded font-bold">
                    Upgrade
                  </button>
                  <button className="bg-gray-600 hover:bg-gray-500 text-white text-sm px-3 py-1 rounded">
                    Info
                  </button>
                </div>
              </div>
            ))}

            {/* Add Building Slot */}
            <div className="bg-black/10 border-2 border-dashed border-gray-600 rounded-lg p-4 hover:border-yellow-500 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[120px]">
              <Plus className="w-8 h-8 text-gray-400 mb-2" />
              <div className="text-gray-400 text-center">
                <div className="font-bold">Build New</div>
                <div className="text-sm">Click to construct</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg flex flex-col items-center gap-2 transition-colors">
            <Hammer className="w-6 h-6" />
            <span>Build</span>
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-lg flex flex-col items-center gap-2 transition-colors">
            <Sword className="w-6 h-6" />
            <span>Army</span>
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg flex flex-col items-center gap-2 transition-colors">
            <Shield className="w-6 h-6" />
            <span>Defense</span>
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg flex flex-col items-center gap-2 transition-colors">
            <Users className="w-6 h-6" />
            <span>Alliance</span>
          </button>
        </div>

        {/* Navigation */}
        <div className="mt-6 text-center">
          <a href="/" className="text-yellow-400 hover:text-yellow-300">
            ← Back to Overview
          </a>
        </div>
      </div>
    </div>
  )
}