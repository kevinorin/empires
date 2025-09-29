'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useVillageResources } from '@/hooks/useVillageResources'
import { useBuildingConstruction } from '@/hooks/useBuildingConstruction'
import { Building, Plus, Hammer, Clock, Users, Home, ArrowLeft, Zap, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { BUILDING_TYPES, getBuildingCost, checkPrerequisites, getBuildingStats } from '@/lib/gameConstants'

interface Village {
  id: string
  name: string
  x: number
  y: number
  capital: boolean
}

interface BuildingData {
  id: string
  type: number
  level: number
  field: number
  village_id: string
  is_building: boolean
  completes_at: string | null
}

// Type for buildings from the hook (matches the hook's Building type)
interface Building {
  id: string
  type: number
  level: number
  field: number
  village_id: string
  is_building: boolean
  completes_at: string | null
}

export default function VillagePageModern() {
  const { user, profile, loading: authLoading } = useAuth()
  const [village, setVillage] = useState<Village | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [selectedField, setSelectedField] = useState<number | null>(null)
  const [showBuildModal, setShowBuildModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [error, setError] = useState('')

  // Get village ID from first village
  const villageId = village?.id || null

  // Use resource management hook
  const { 
    resources, 
    buildings, 
    loading: resourcesLoading, 
    error: resourcesError,
    spendResources,
    reloadData
  } = useVillageResources(villageId)

  // Use construction hook
  const {
    loading: constructionLoading,
    error: constructionError,
    startConstruction,
    checkCompletedConstructions,
    getTimeRemaining,
    cancelConstruction
  } = useBuildingConstruction(villageId)

  useEffect(() => {
    if (user && !authLoading) {
      loadVillageData()
    }
  }, [user, authLoading])

  // Check for completed constructions every 30 seconds
  useEffect(() => {
    if (!villageId) return

    const interval = setInterval(() => {
      checkCompletedConstructions()
      reloadData()
    }, 30000)

    return () => clearInterval(interval)
  }, [villageId, checkCompletedConstructions, reloadData])

  const loadVillageData = async () => {
    try {
      // Load user's main village
      const { data: villageData, error: villageError } = await supabase
        .from('villages')
        .select('id, name, x, y, capital')
        .eq('owner_id', user!.id)
        .eq('capital', true)
        .single()

      if (villageError) {
        // If no village exists, create one
        if (villageError.code === 'PGRST116') {
          await createStarterVillage()
        } else {
          throw villageError
        }
      } else {
        setVillage(villageData)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const createStarterVillage = async () => {
    try {
      // Find empty coordinates
      const x = Math.floor(Math.random() * 201) - 100
      const y = Math.floor(Math.random() * 201) - 100

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
          wood_production: 30, // Base production
          clay_production: 30,
          iron_production: 30,
          crop_production: 30,
        })
        .select()
        .single()

      if (villageError) throw villageError

      // Create starter buildings (resource fields)
      const starterBuildings = [
        { type: 1, level: 1, field: 1 }, // Woodcutter
        { type: 2, level: 1, field: 2 }, // Clay pit
        { type: 3, level: 1, field: 3 }, // Iron mine
        { type: 4, level: 1, field: 4 }, // Cropland
        { type: 15, level: 1, field: 19 }, // Main building
      ]

      const { error: buildingsError } = await supabase
        .from('buildings')
        .insert(
          starterBuildings.map(b => ({
            village_id: newVillage.id,
            type: b.type,
            level: b.level,
            field: b.field,
          }))
        )

      if (buildingsError) throw buildingsError

      setVillage(newVillage)
      reloadData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleFieldClick = (field: number) => {
    const existingBuilding = buildings.find(b => b.field === field)
    setSelectedField(field)
    
    if (existingBuilding) {
      setSelectedBuilding(existingBuilding)
      setShowUpgradeModal(true)
    } else {
      setShowBuildModal(true)
    }
  }

  const handleUpgrade = async () => {
    if (!selectedBuilding || !resources) return

    const cost = getBuildingCost(selectedBuilding.type, selectedBuilding.level + 1)
    const success = await startConstruction(
      selectedBuilding.type,
      selectedBuilding.field,
      buildings,
      spendResources
    )

    if (success) {
      setShowUpgradeModal(false)
      setSelectedBuilding(null)
      reloadData()
    }
  }

  const handleNewBuilding = async (buildingType: number) => {
    if (!selectedField || !resources) return

    const success = await startConstruction(
      buildingType,
      selectedField,
      buildings,
      spendResources
    )

    if (success) {
      setShowBuildModal(false)
      setSelectedField(null)
      reloadData()
    }
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  if (authLoading || resourcesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-900 via-yellow-800 to-amber-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading village...</div>
      </div>
    )
  }

  if (!village || !resources) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-900 via-yellow-800 to-amber-900 flex items-center justify-center">
        <div className="text-white text-xl">Village not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 via-yellow-800 to-amber-900">
      {/* Header */}
      <div className="bg-black/30 border-b border-yellow-500">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-yellow-400 hover:text-yellow-300">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">{village.name}</h1>
              <p className="text-gray-300">
                Coordinates: ({village.x}, {village.y}) | Population: {resources.wood + resources.clay + resources.iron + resources.crop > 0 ? 'Active' : 'Starting'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Resource Management Active</div>
          </div>
        </div>
      </div>

      {/* Resources */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-2xl">🪵</div>
              <div className="text-yellow-200 font-bold">Wood</div>
            </div>
            <div className="text-white text-xl font-bold">{resources.wood.toLocaleString()}</div>
            <div className="text-sm text-yellow-300">+{resources.wood_production}/hour</div>
            <div className="text-xs text-gray-400">Max: {resources.warehouse.toLocaleString()}</div>
          </div>

          <div className="bg-orange-900/30 border border-orange-600 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-2xl">🧱</div>
              <div className="text-orange-200 font-bold">Clay</div>
            </div>
            <div className="text-white text-xl font-bold">{resources.clay.toLocaleString()}</div>
            <div className="text-sm text-orange-300">+{resources.clay_production}/hour</div>
            <div className="text-xs text-gray-400">Max: {resources.warehouse.toLocaleString()}</div>
          </div>

          <div className="bg-gray-900/30 border border-gray-600 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-2xl">⚒️</div>
              <div className="text-gray-200 font-bold">Iron</div>
            </div>
            <div className="text-white text-xl font-bold">{resources.iron.toLocaleString()}</div>
            <div className="text-sm text-gray-300">+{resources.iron_production}/hour</div>
            <div className="text-xs text-gray-400">Max: {resources.warehouse.toLocaleString()}</div>
          </div>

          <div className="bg-green-900/30 border border-green-600 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-2xl">🌾</div>
              <div className="text-green-200 font-bold">Crop</div>
            </div>
            <div className="text-white text-xl font-bold">{resources.crop.toLocaleString()}</div>
            <div className="text-sm text-green-300">+{resources.crop_production}/hour</div>
            <div className="text-xs text-gray-400">Max: {resources.granary.toLocaleString()}</div>
          </div>
        </div>

        {/* Construction Queue */}
        {buildings.some(b => b.is_building) && (
          <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-4 mb-6">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Under Construction
            </h3>
            {buildings
              .filter(b => b.is_building && b.completes_at)
              .map(building => {
                const timeRemaining = getTimeRemaining(building.completes_at!)
                const buildingType = BUILDING_TYPES[building.type]
                
                return (
                  <div key={building.id} className="flex items-center justify-between p-3 bg-black/20 rounded mb-2">
                    <div className="flex items-center gap-3">
                      <Hammer className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="text-white font-medium">
                          {buildingType?.name} (Level {building.level + 1})
                        </div>
                        <div className="text-sm text-gray-300">Field {building.field}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-blue-300 font-mono">
                        {timeRemaining > 0 ? formatTime(timeRemaining) : 'Completing...'}
                      </div>
                      {timeRemaining <= 60 && (
                        <div className="text-xs text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Nearly done!
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        )}

        {/* Buildings Grid */}
        <div className="bg-gray-900 border border-yellow-500 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Building className="w-6 h-6" />
            Village Buildings
          </h2>
          
          {/* Resource Fields (1-18) */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-yellow-300 mb-3">Resource Fields</h3>
            <div className="grid grid-cols-6 md:grid-cols-9 gap-2">
              {Array.from({ length: 18 }, (_, i) => i + 1).map(field => {
                const building = buildings.find(b => b.field === field)
                const buildingType = building ? BUILDING_TYPES[building.type] : null
                
                return (
                  <button
                    key={field}
                    onClick={() => handleFieldClick(field)}
                    className="aspect-square bg-green-800/30 border border-green-600 rounded-lg p-2 hover:bg-green-700/40 transition-colors relative"
                  >
                    <div className="text-xs text-white text-center">
                      {building ? (
                        <>
                          <div className="text-xl mb-1">
                            {building.type === 1 ? '🌲' : 
                             building.type === 2 ? '🏺' : 
                             building.type === 3 ? '⛏️' : '🌾'}
                          </div>
                          <div>Lv.{building.level}</div>
                          {building.is_building && (
                            <Hammer className="w-3 h-3 text-blue-400 absolute top-1 right-1" />
                          )}
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mx-auto mb-1" />
                          <div>F{field}</div>
                        </>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Building Fields (19-40) */}
          <div>
            <h3 className="text-lg font-semibold text-yellow-300 mb-3">Buildings</h3>
            <div className="grid grid-cols-6 md:grid-cols-11 gap-2">
              {Array.from({ length: 22 }, (_, i) => i + 19).map(field => {
                const building = buildings.find(b => b.field === field)
                const buildingType = building ? BUILDING_TYPES[building.type] : null
                
                return (
                  <button
                    key={field}
                    onClick={() => handleFieldClick(field)}
                    className="aspect-square bg-gray-800/30 border border-gray-600 rounded-lg p-2 hover:bg-gray-700/40 transition-colors relative"
                  >
                    <div className="text-xs text-white text-center">
                      {building ? (
                        <>
                          <div className="text-xl mb-1">
                            {building.type === 15 ? '🏛️' :
                             building.type === 10 ? '🏪' :
                             building.type === 11 ? '🌾' :
                             building.type === 16 ? '🚩' :
                             building.type === 19 ? '⚔️' :
                             building.type === 17 ? '🏪' : '🏗️'}
                          </div>
                          <div>Lv.{building.level}</div>
                          {building.is_building && (
                            <Hammer className="w-3 h-3 text-blue-400 absolute top-1 right-1" />
                          )}
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mx-auto mb-1" />
                          <div>F{field}</div>
                        </>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {(error || resourcesError || constructionError) && (
          <div className="mt-4 p-4 bg-red-900/30 border border-red-500 rounded-lg">
            <p className="text-red-200">
              {error || resourcesError || constructionError}
            </p>
          </div>
        )}
      </div>

      {/* Build Modal */}
      {showBuildModal && selectedField && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-yellow-500 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Build on Field {selectedField}</h3>
            
            <div className="space-y-3">
              {selectedField <= 18 ? (
                // Resource field options
                [
                  { type: 1, name: 'Woodcutter', icon: '🌲' },
                  { type: 2, name: 'Clay Pit', icon: '🏺' },
                  { type: 3, name: 'Iron Mine', icon: '⛏️' },
                  { type: 4, name: 'Cropland', icon: '🌾' }
                ].map(option => {
                  const cost = getBuildingCost(option.type, 1)
                  const canBuild = checkPrerequisites(option.type, buildings)
                  const canAfford = resources && 
                    resources.wood >= cost.wood &&
                    resources.clay >= cost.clay &&
                    resources.iron >= cost.iron &&
                    resources.crop >= cost.crop

                  return (
                    <button
                      key={option.type}
                      onClick={() => handleNewBuilding(option.type)}
                      disabled={!canBuild || !canAfford}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{option.icon}</span>
                        <div className="flex-1">
                          <div className="text-white font-medium">{option.name}</div>
                          <div className="text-sm text-gray-300">
                            Cost: {cost.wood}W {cost.clay}C {cost.iron}I {cost.crop}Cr
                          </div>
                          <div className="text-xs text-blue-300">
                            Time: {formatTime(cost.time)}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })
              ) : (
                // Building options for village center
                [
                  { type: 15, name: 'Main Building', icon: '🏛️' },
                  { type: 10, name: 'Warehouse', icon: '🏪' },
                  { type: 11, name: 'Granary', icon: '🌾' },
                  { type: 16, name: 'Rally Point', icon: '🚩' },
                  { type: 17, name: 'Marketplace', icon: '🏪' },
                  { type: 19, name: 'Barracks', icon: '⚔️' }
                ].filter(option => {
                  // Don't show if already exists in village
                  return !buildings.some(b => b.type === option.type)
                }).map(option => {
                  const cost = getBuildingCost(option.type, 1)
                  const canBuild = checkPrerequisites(option.type, buildings)
                  const canAfford = resources && 
                    resources.wood >= cost.wood &&
                    resources.clay >= cost.clay &&
                    resources.iron >= cost.iron &&
                    resources.crop >= cost.crop

                  return (
                    <button
                      key={option.type}
                      onClick={() => handleNewBuilding(option.type)}
                      disabled={!canBuild || !canAfford}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{option.icon}</span>
                        <div className="flex-1">
                          <div className="text-white font-medium">{option.name}</div>
                          <div className="text-sm text-gray-300">
                            Cost: {cost.wood}W {cost.clay}C {cost.iron}I {cost.crop}Cr
                          </div>
                          <div className="text-xs text-blue-300">
                            Time: {formatTime(cost.time)}
                          </div>
                          {!canBuild && (
                            <div className="text-xs text-red-400">Prerequisites not met</div>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBuildModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedBuilding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-yellow-500 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">
              Upgrade {BUILDING_TYPES[selectedBuilding.type]?.name}
            </h3>
            
            <div className="space-y-4">
              <div className="text-gray-300">
                <div>Current Level: {selectedBuilding.level}</div>
                <div>Next Level: {selectedBuilding.level + 1}</div>
              </div>

              {selectedBuilding.level < (BUILDING_TYPES[selectedBuilding.type]?.maxLevel || 20) ? (
                <>
                  <div className="bg-gray-800 p-4 rounded">
                    <h4 className="text-white font-bold mb-2">Upgrade Cost:</h4>
                    {(() => {
                      const cost = getBuildingCost(selectedBuilding.type, selectedBuilding.level + 1)
                      const canAfford = resources && 
                        resources.wood >= cost.wood &&
                        resources.clay >= cost.clay &&
                        resources.iron >= cost.iron &&
                        resources.crop >= cost.crop

                      return (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-yellow-300">🪵</span>
                              <span className={resources && resources.wood >= cost.wood ? 'text-white' : 'text-red-400'}>
                                {cost.wood.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-orange-300">🧱</span>
                              <span className={resources && resources.clay >= cost.clay ? 'text-white' : 'text-red-400'}>
                                {cost.clay.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-300">⚒️</span>
                              <span className={resources && resources.iron >= cost.iron ? 'text-white' : 'text-red-400'}>
                                {cost.iron.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-green-300">🌾</span>
                              <span className={resources && resources.crop >= cost.crop ? 'text-white' : 'text-red-400'}>
                                {cost.crop.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="text-blue-300 text-sm">
                            <Clock className="w-4 h-4 inline mr-2" />
                            Duration: {formatTime(cost.time)}
                          </div>
                          {!canAfford && (
                            <div className="text-red-400 text-sm">Insufficient resources</div>
                          )}
                        </div>
                      )
                    })()}
                  </div>

                  <div className="bg-gray-800 p-4 rounded">
                    <h4 className="text-white font-bold mb-2">Benefits:</h4>
                    {(() => {
                      const currentStats = getBuildingStats(selectedBuilding.type, selectedBuilding.level)
                      const nextStats = getBuildingStats(selectedBuilding.type, selectedBuilding.level + 1)
                      
                      return (
                        <div className="text-sm text-gray-300 space-y-1">
                          {nextStats.production && (
                            <div>
                              Production: {currentStats.production || 0} → {nextStats.production} per hour 
                              <span className="text-green-400"> (+{(nextStats.production || 0) - (currentStats.production || 0)})</span>
                            </div>
                          )}
                          {nextStats.capacity && (
                            <div>
                              Storage: {currentStats.capacity || 0} → {nextStats.capacity}
                              <span className="text-green-400"> (+{(nextStats.capacity || 0) - (currentStats.capacity || 0)})</span>
                            </div>
                          )}
                          {nextStats.population && (
                            <div>
                              Population: {currentStats.population || 0} → {nextStats.population}
                              <span className="text-green-400"> (+{(nextStats.population || 0) - (currentStats.population || 0)})</span>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                </>
              ) : (
                <div className="text-yellow-300 text-center p-4">
                  Maximum level reached!
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              {selectedBuilding.level < (BUILDING_TYPES[selectedBuilding.type]?.maxLevel || 20) && (
                <button
                  onClick={handleUpgrade}
                  disabled={constructionLoading || selectedBuilding.is_building}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedBuilding.is_building ? 'Building...' : 'Upgrade'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}