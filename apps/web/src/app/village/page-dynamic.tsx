'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useVillage } from '@/hooks/useVillage'
import { Building, Plus, Hammer, Sword, Shield, Users, Home, ArrowLeft } from 'lucide-react'
import AuthModal from '@/components/AuthModal'
import WorldMap from '@/components/WorldMap'
import Image from 'next/image'

// Travian building types mapping
const BUILDING_TYPES: Record<number, { name: string; img: string; description: string }> = {
  0: { name: 'Empty Lot', img: 'g4.gif', description: 'Build something here' },
  1: { name: 'Main Building', img: 'g26.gif', description: 'Village center' },
  2: { name: 'Granary', img: 'g11.gif', description: 'Stores crop' },
  3: { name: 'Warehouse', img: 'g10.gif', description: 'Stores wood, clay, iron' },
  4: { name: 'Barracks', img: 'g19.gif', description: 'Train infantry' },
  5: { name: 'Stable', img: 'g20.gif', description: 'Train cavalry' },
  6: { name: 'Workshop', img: 'g21.gif', description: 'Build siege weapons' },
  7: { name: 'Marketplace', img: 'g17.gif', description: 'Trade resources' },
  8: { name: 'Embassy', img: 'g18.gif', description: 'Diplomacy and alliances' },
  26: { name: 'Main Building', img: 'g26.gif', description: 'Village center' },
}

// Building cost calculator
function getBuildingCost(buildingType: number, level: number) {
  const baseCost = {
    wood: 100,
    clay: 100,
    iron: 100,
    crop: 50
  }

  const multiplier = Math.pow(1.28, level)

  return {
    wood: Math.floor(baseCost.wood * multiplier),
    clay: Math.floor(baseCost.clay * multiplier),
    iron: Math.floor(baseCost.iron * multiplier),
    crop: Math.floor(baseCost.crop * multiplier)
  }
}

// Resource field cost calculator
function getFieldCost(level: number) {
  const multiplier = Math.pow(1.5, level)
  return {
    wood: Math.floor(50 * multiplier),
    clay: Math.floor(50 * multiplier),
    iron: Math.floor(50 * multiplier),
    crop: Math.floor(50 * multiplier)
  }
}

export default function VillagePage() {
  const { user, profile, loading: authLoading } = useAuth()
  const {
    village,
    buildings,
    resourceFields,
    loading: villageLoading,
    error,
    upgradeBuilding,
    upgradeResourceField,
    updateResources
  } = useVillage()

  const [showAuthModal, setShowAuthModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [selectedField, setSelectedField] = useState<number | null>(null)
  const [showWorldMap, setShowWorldMap] = useState(false)
  const [showModal, setShowModal] = useState(false)

  console.log('Village page render:', { user: !!user, profile: !!profile, authLoading, village: !!village })

  // Show loading while auth or village data is loading
  if (authLoading || villageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-800 to-red-900 flex items-center justify-center">
        <div className="text-white text-xl font-bold">Loading village...</div>
      </div>
    )
  }

  // Show auth modal if user not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-800 to-red-900">
        <AuthModal isOpen={true} onClose={() => { }} onSuccess={() => { }} />
      </div>
    )
  }

  // Show error if village failed to load
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-800 to-red-900 flex items-center justify-center">
        <div className="text-white text-xl">Error: {error}</div>
        <div className="text-white text-sm mt-2">Make sure you've run the database migration in Supabase</div>
      </div>
    )
  }

  // Show loading if village not yet loaded
  if (!village) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-800 to-red-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading village data...</div>
      </div>
    )
  }

  // Handle building slot click
  const handleSlotClick = (slotId: number) => {
    setSelectedSlot(slotId)
    setSelectedField(null)
    setShowModal(true)
  }

  // Handle resource field click
  const handleFieldClick = (fieldId: number) => {
    setSelectedField(fieldId)
    setSelectedSlot(null)
    setShowModal(true)
  }

  // Handle upgrade building
  const handleUpgradeBuilding = async () => {
    if (!selectedSlot) return

    const building = buildings.find(b => b.slot_position === selectedSlot)
    const buildingType = building?.building_type || 1 // Default to main building
    const currentLevel = building?.level || 0

    const cost = getBuildingCost(buildingType, currentLevel + 1)

    // Check if player has enough resources
    if (village.wood < cost.wood || village.clay < cost.clay ||
      village.iron < cost.iron || village.crop < cost.crop) {
      alert('Not enough resources!')
      return
    }

    // Deduct resources
    await updateResources({
      wood: village.wood - cost.wood,
      clay: village.clay - cost.clay,
      iron: village.iron - cost.iron,
      crop: village.crop - cost.crop
    })

    // Upgrade building
    await upgradeBuilding(selectedSlot, buildingType)
    setShowModal(false)
  }

  // Handle upgrade resource field
  const handleUpgradeField = async () => {
    if (!selectedField) return

    const field = resourceFields.find(f => f.position === selectedField)
    if (!field) return

    const cost = getFieldCost(field.level + 1)

    // Check if player has enough resources
    if (village.wood < cost.wood || village.clay < cost.clay ||
      village.iron < cost.iron || village.crop < cost.crop) {
      alert('Not enough resources!')
      return
    }

    // Deduct resources
    await updateResources({
      wood: village.wood - cost.wood,
      clay: village.clay - cost.clay,
      iron: village.iron - cost.iron,
      crop: village.crop - cost.crop
    })

    // Upgrade field
    await upgradeResourceField(selectedField)
    setShowModal(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-800 to-red-900 relative overflow-hidden">
      {/* Database Connected Indicator */}
      <div className="fixed top-4 right-4 z-50 bg-green-500/90 text-white px-3 py-1 rounded-md text-sm font-medium shadow-lg">
        ✅ Database Connected
      </div>

      {/* Header */}
      <div className="relative z-20 bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-white font-bold text-xl">{village.name}</div>
              <div className="text-gray-300 text-sm">({village.x}|{village.y})</div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowWorldMap(true)}
                className="text-white hover:text-yellow-300 transition-colors"
              >
                <Home className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Resources Bar */}
          <div className="flex items-center justify-between py-2 bg-black/20 rounded-lg px-4 mb-2 mx-auto max-w-3xl">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1">
                <Image src="/assets/resources/lumber_small.png" alt="Wood" width={18} height={18} className="drop-shadow-sm" style={{ height: "auto" }} />
                <span className="text-white font-bold text-sm">{village.wood.toLocaleString()}</span>
                <span className="text-green-300 text-xs">({village.wood_production > 0 ? '+' : ''}{village.wood_production})</span>
              </div>
              <div className="flex items-center gap-1">
                <Image src="/assets/resources/clay_small.png" alt="Clay" width={18} height={18} className="drop-shadow-sm" style={{ height: "auto" }} />
                <span className="text-white font-bold text-sm">{village.clay.toLocaleString()}</span>
                <span className="text-green-300 text-xs">({village.clay_production > 0 ? '+' : ''}{village.clay_production})</span>
              </div>
              <div className="flex items-center gap-1">
                <Image src="/assets/resources/iron_small.png" alt="Iron" width={18} height={18} className="drop-shadow-sm" style={{ height: "auto" }} />
                <span className="text-white font-bold text-sm">{village.iron.toLocaleString()}</span>
                <span className="text-green-300 text-xs">({village.iron_production > 0 ? '+' : ''}{village.iron_production})</span>
              </div>
              <div className="flex items-center gap-1">
                <Image src="/assets/resources/crop_small.png" alt="Crop" width={18} height={18} className="drop-shadow-sm" style={{ height: "auto" }} />
                <span className="text-white font-bold text-sm">{village.crop.toLocaleString()}</span>
                <span className="text-green-300 text-xs">({village.crop_production > 0 ? '+' : ''}{village.crop_production})</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-300" />
              <span className="text-white font-bold text-sm">{village.population}</span>
              <span className="text-gray-300 text-xs">Population</span>
            </div>
          </div>
        </div>
      </div>

      {/* Village View */}
      <div className="relative">
        {/* Village Background */}
        <div className="w-full h-screen bg-cover bg-center bg-no-repeat relative"
          style={{ backgroundImage: "url('/assets/dorf2.jpg')" }}>

          {/* Building Slots */}
          <div className="absolute inset-0">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(slotId => {
              const building = buildings.find(b => b.slot_position === slotId)
              const buildingType = building ? BUILDING_TYPES[building.building_type] : BUILDING_TYPES[0]

              return (
                <div
                  key={slotId}
                  className="absolute cursor-pointer hover:scale-110 transition-transform"
                  style={{
                    left: `${50 + (slotId % 4) * 100}px`,
                    top: `${200 + Math.floor(slotId / 4) * 80}px`,
                  }}
                  onClick={() => handleSlotClick(slotId)}
                >
                  <Image
                    src={`/assets/buildings/${buildingType.img}`}
                    alt={buildingType.name}
                    width={50}
                    height={50}
                    className="drop-shadow-lg"
                    style={{ height: "auto" }}
                    priority={buildingType.img === 'g26.gif'}
                  />
                  {building && building.level > 1 && (
                    <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold text-[10px] shadow-lg">
                      {building.level}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Resource Fields */}
          <div className="absolute inset-0">
            {resourceFields.map(field => (
              <div
                key={field.id}
                className="absolute cursor-pointer hover:scale-110 transition-transform"
                style={{
                  left: `${100 + (field.position % 6) * 60}px`,
                  top: `${50 + Math.floor(field.position / 6) * 50}px`,
                }}
                onClick={() => handleFieldClick(field.position)}
              >
                <div className="w-8 h-8 bg-green-600 rounded border-2 border-green-400 flex items-center justify-center text-white text-xs font-bold">
                  {field.level}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-amber-800 to-orange-900 rounded-lg p-6 max-w-md w-full mx-4 border-2 border-yellow-600 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-xl font-bold">
                {selectedSlot ? 'Building' : 'Resource Field'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-300 hover:text-white"
              >
                ×
              </button>
            </div>

            {selectedSlot && (
              <div>
                {(() => {
                  const building = buildings.find(b => b.slot_position === selectedSlot)
                  const buildingType = building ? BUILDING_TYPES[building.building_type] : BUILDING_TYPES[1]
                  const cost = getBuildingCost(building?.building_type || 1, (building?.level || 0) + 1)

                  return (
                    <>
                      <p className="text-white mb-4">
                        {buildingType.name} Level {building?.level || 0}
                      </p>
                      <p className="text-gray-300 mb-4">{buildingType.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <Image src="/assets/resources/1.gif" alt="Wood" width={16} height={16} style={{ height: "auto" }} />
                          <span className="text-white">{cost.wood}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Image src="/assets/resources/2.gif" alt="Clay" width={16} height={16} style={{ height: "auto" }} />
                          <span className="text-white">{cost.clay}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Image src="/assets/resources/3.gif" alt="Iron" width={16} height={16} style={{ height: "auto" }} />
                          <span className="text-white">{cost.iron}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Image src="/assets/resources/4.gif" alt="Crop" width={16} height={16} style={{ height: "auto" }} />
                          <span className="text-white">{cost.crop}</span>
                        </div>
                      </div>
                      <button
                        onClick={handleUpgradeBuilding}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded transition-colors"
                      >
                        Upgrade
                      </button>
                    </>
                  )
                })()}
              </div>
            )}

            {selectedField && (
              <div>
                {(() => {
                  const field = resourceFields.find(f => f.position === selectedField)
                  const cost = getFieldCost((field?.level || 0) + 1)

                  return (
                    <>
                      <p className="text-white mb-4">
                        {field?.field_type} Field Level {field?.level || 0}
                      </p>
                      <p className="text-gray-300 mb-4">
                        Production: +{((field?.level || 0) * 3)} per hour
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <Image src="/assets/resources/1.gif" alt="Wood" width={16} height={16} style={{ height: "auto" }} />
                          <span className="text-white">{cost.wood}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Image src="/assets/resources/2.gif" alt="Clay" width={16} height={16} style={{ height: "auto" }} />
                          <span className="text-white">{cost.clay}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Image src="/assets/resources/3.gif" alt="Iron" width={16} height={16} style={{ height: "auto" }} />
                          <span className="text-white">{cost.iron}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Image src="/assets/resources/4.gif" alt="Crop" width={16} height={16} style={{ height: "auto" }} />
                          <span className="text-white">{cost.crop}</span>
                        </div>
                      </div>
                      <button
                        onClick={handleUpgradeField}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded transition-colors"
                      >
                        Upgrade
                      </button>
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* World Map */}
      {showWorldMap && (
        <div className="fixed inset-0 z-50">
          <WorldMap isOpen={true} onClose={() => setShowWorldMap(false)} />
        </div>
      )}
    </div>
  )
}