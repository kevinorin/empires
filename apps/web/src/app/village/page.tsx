'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Building, Plus, Hammer, Sword, Shield, Users, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import AuthModal from '@/components/AuthModal'
import Image from 'next/image'

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

interface BuildingSlot {
  id: number
  buildingId?: number
  isEmpty: boolean
  level: number
  type: string
  name: string
}

interface ResourceField {
  id: number
  type: 'wood' | 'clay' | 'iron' | 'crop'
  level: number
}

// Travian building types mapping
const BUILDING_TYPES = {
  0: { name: 'Empty Lot', img: 'g4.gif', description: 'Build something here' },
  1: { name: 'Main Building', img: 'g26.gif', description: 'Village center' },
  2: { name: 'Granary', img: 'g11.gif', description: 'Stores crop' },
  3: { name: 'Warehouse', img: 'g10.gif', description: 'Stores wood, clay, iron' },
  4: { name: 'Barracks', img: 'g19.gif', description: 'Train infantry' },
  5: { name: 'Stable', img: 'g20.gif', description: 'Train cavalry' },
  6: { name: 'Workshop', img: 'g21.gif', description: 'Build siege weapons' },
  7: { name: 'Marketplace', img: 'g17.gif', description: 'Trade resources' },
  8: { name: 'Embassy', img: 'g18.gif', description: 'Diplomacy and alliances' },
  9: { name: 'Academy', img: 'g22.gif', description: 'Research technologies' },
  10: { name: 'Cranny', img: 'g23.gif', description: 'Hide resources' },
  11: { name: 'Town Hall', img: 'g24.gif', description: 'Organize celebrations' },
  12: { name: 'Residence', img: 'g25.gif', description: 'Train settlers' },
  13: { name: 'Palace', img: 'g25.gif', description: 'Train settlers and chiefs' },
  14: { name: 'Treasury', img: 'g27.gif', description: 'Store treasures' },
  15: { name: 'Smithy', img: 'g13.gif', description: 'Improve weapons' },
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

// Hotspot coordinates for village buildings (based on Travian village layout)
// These coordinates are positioned over the village background image
const VILLAGE_HOTSPOTS = [
  // Main central buildings
  { id: 1, x: 50, y: 45, width: 8, height: 8, buildingType: 1, level: 1, name: 'Main Building' },
  { id: 2, x: 35, y: 40, width: 6, height: 6, buildingType: 3, level: 2, name: 'Warehouse' },
  { id: 3, x: 65, y: 40, width: 6, height: 6, buildingType: 2, level: 2, name: 'Granary' },
  { id: 4, x: 42, y: 55, width: 6, height: 6, buildingType: 4, level: 1, name: 'Barracks' },
  { id: 5, x: 58, y: 55, width: 6, height: 6, buildingType: 7, level: 1, name: 'Marketplace' },
  { id: 6, x: 35, y: 25, width: 5, height: 5, buildingType: 0, level: 0, name: 'Empty Lot' },
  { id: 7, x: 50, y: 25, width: 5, height: 5, buildingType: 0, level: 0, name: 'Empty Lot' },
  { id: 8, x: 65, y: 25, width: 5, height: 5, buildingType: 0, level: 0, name: 'Empty Lot' },
  { id: 9, x: 20, y: 40, width: 5, height: 5, buildingType: 0, level: 0, name: 'Empty Lot' },
  { id: 10, x: 80, y: 40, width: 5, height: 5, buildingType: 0, level: 0, name: 'Empty Lot' },
  { id: 11, x: 25, y: 55, width: 5, height: 5, buildingType: 0, level: 0, name: 'Empty Lot' },
  { id: 12, x: 75, y: 55, width: 5, height: 5, buildingType: 0, level: 0, name: 'Empty Lot' },
  { id: 13, x: 35, y: 70, width: 5, height: 5, buildingType: 0, level: 0, name: 'Empty Lot' },
  { id: 14, x: 50, y: 70, width: 5, height: 5, buildingType: 0, level: 0, name: 'Empty Lot' },
  { id: 15, x: 65, y: 70, width: 5, height: 5, buildingType: 0, level: 0, name: 'Empty Lot' },
]

// Resource field hotspots (positioned around the village)
const RESOURCE_HOTSPOTS = [
  // Wood fields (forest area)
  { id: 1, x: 15, y: 15, width: 10, height: 8, type: 'wood', level: 1 },
  { id: 2, x: 5, y: 25, width: 10, height: 8, type: 'wood', level: 2 },
  { id: 3, x: 10, y: 35, width: 10, height: 8, type: 'wood', level: 1 },
  { id: 4, x: 5, y: 50, width: 10, height: 8, type: 'wood', level: 3 },

  // Clay fields (clay pits)
  { id: 5, x: 85, y: 15, width: 10, height: 8, type: 'clay', level: 2 },
  { id: 6, x: 90, y: 25, width: 10, height: 8, type: 'clay', level: 1 },
  { id: 7, x: 85, y: 35, width: 10, height: 8, type: 'clay', level: 2 },
  { id: 8, x: 90, y: 50, width: 10, height: 8, type: 'clay', level: 1 },

  // Iron fields (mountains)
  { id: 9, x: 25, y: 5, width: 10, height: 8, type: 'iron', level: 1 },
  { id: 10, x: 40, y: 8, width: 10, height: 8, type: 'iron', level: 2 },
  { id: 11, x: 55, y: 5, width: 10, height: 8, type: 'iron', level: 1 },
  { id: 12, x: 75, y: 8, width: 10, height: 8, type: 'iron', level: 2 },

  // Crop fields (farms)
  { id: 13, x: 25, y: 85, width: 10, height: 8, type: 'crop', level: 2 },
  { id: 14, x: 40, y: 88, width: 10, height: 8, type: 'crop', level: 3 },
  { id: 15, x: 55, y: 85, width: 10, height: 8, type: 'crop', level: 2 },
  { id: 16, x: 75, y: 88, width: 10, height: 8, type: 'crop', level: 1 },
  { id: 17, x: 10, y: 75, width: 10, height: 8, type: 'crop', level: 2 },
  { id: 18, x: 85, y: 75, width: 10, height: 8, type: 'crop', level: 1 },
]

// Initial building state based on hotspots
const initialBuildingSlots: BuildingSlot[] = VILLAGE_HOTSPOTS.map(hotspot => ({
  id: hotspot.id,
  buildingId: hotspot.buildingType > 0 ? hotspot.id : undefined,
  isEmpty: hotspot.buildingType === 0,
  level: hotspot.level,
  type: hotspot.buildingType.toString(),
  name: hotspot.name
}))

// Initial resource fields based on hotspots
const initialResourceFields: ResourceField[] = RESOURCE_HOTSPOTS.map(hotspot => ({
  id: hotspot.id,
  type: hotspot.type as 'wood' | 'clay' | 'iron' | 'crop',
  level: hotspot.level
}))

export default function VillagePageMock() {
  const { user, profile, loading: authLoading } = useAuth()
  const [village, setVillage] = useState<MockVillage>(mockVillage)
  const [buildingSlots, setBuildingSlots] = useState<BuildingSlot[]>(initialBuildingSlots)
  const [resourceFields, setResourceFields] = useState<ResourceField[]>(initialResourceFields)
  const [selectedSlot, setSelectedSlot] = useState<BuildingSlot | null>(null)
  const [selectedField, setSelectedField] = useState<ResourceField | null>(null)
  const [showBuildModal, setShowBuildModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isVillageView, setIsVillageView] = useState(true) // Toggle between village and fields

  // Debug logging
  console.log('Village page render:', { user: !!user, profile: !!profile, authLoading })

  // Simulate resource production every 5 seconds
  useEffect(() => {
    const resourceProduction = resourceFields.reduce((acc, field) => {
      const baseProduction = field.level * 10
      switch (field.type) {
        case 'wood': acc.wood += baseProduction; break
        case 'clay': acc.clay += baseProduction; break
        case 'iron': acc.iron += baseProduction; break
        case 'crop': acc.crop += baseProduction; break
      }
      return acc
    }, { wood: 0, clay: 0, iron: 0, crop: 0 })

    const interval = setInterval(() => {
      setVillage(prev => ({
        ...prev,
        wood: Math.min(prev.wood + Math.floor(resourceProduction.wood / 12), 8000),
        clay: Math.min(prev.clay + Math.floor(resourceProduction.clay / 12), 8000),
        iron: Math.min(prev.iron + Math.floor(resourceProduction.iron / 12), 8000),
        crop: Math.min(prev.crop + Math.floor(resourceProduction.crop / 12), 8000),
      }))
    }, 5000)

    // Update village production rates
    setVillage(prev => ({
      ...prev,
      wood_production: resourceProduction.wood,
      clay_production: resourceProduction.clay,
      iron_production: resourceProduction.iron,
      crop_production: resourceProduction.crop,
    }))

    return () => clearInterval(interval)
  }, [resourceFields])

  const handleSlotClick = (slot: BuildingSlot) => {
    setSelectedSlot(slot)
    if (slot.isEmpty) {
      setShowBuildModal(true)
    } else {
      setShowUpgradeModal(true)
    }
  }

  const handleFieldClick = (field: ResourceField) => {
    setSelectedField(field)
    setShowUpgradeModal(true)
  }

  const upgradeField = () => {
    if (selectedField) {
      const baseCost = (selectedField.level + 1) * 50
      if (village.wood >= baseCost && village.clay >= baseCost && village.iron >= baseCost && village.crop >= baseCost) {
        setVillage(prev => ({
          ...prev,
          wood: prev.wood - baseCost,
          clay: prev.clay - baseCost,
          iron: prev.iron - baseCost,
          crop: prev.crop - baseCost,
        }))

        setResourceFields(prev => prev.map(f =>
          f.id === selectedField.id ? { ...f, level: f.level + 1 } : f
        ))
      }
    }
    setShowUpgradeModal(false)
    setSelectedField(null)
  }

  const upgradeBuilding = () => {
    if (selectedSlot && !selectedSlot.isEmpty) {
      const baseCost = (selectedSlot.level + 1) * 100
      if (village.wood >= baseCost && village.clay >= baseCost && village.iron >= baseCost && village.crop >= baseCost) {
        setVillage(prev => ({
          ...prev,
          wood: prev.wood - baseCost,
          clay: prev.clay - baseCost,
          iron: prev.iron - baseCost,
          crop: prev.crop - baseCost,
        }))

        setBuildingSlots(prev => prev.map(s =>
          s.id === selectedSlot.id ? { ...s, level: s.level + 1 } : s
        ))
      }
    }
    setShowUpgradeModal(false)
    setSelectedSlot(null)
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
    <div className="min-h-screen bg-gradient-to-b from-green-800 via-green-700 to-green-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-800 to-yellow-600 p-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white hover:text-yellow-200">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">{village.name}</h1>
              <p className="text-yellow-100 text-sm">({village.x}|{village.y})</p>
            </div>
          </div>

          {/* Resources Bar */}
          <div className="flex items-center gap-4 bg-black/20 rounded-lg px-4 py-2">
            <div className="flex items-center gap-1 text-white">
              <Image src="/assets/resources/1.gif" alt="Wood" width={20} height={20} />
              <span className="font-bold">{village.wood}</span>
              <span className="text-green-300 text-xs">+{village.wood_production}/h</span>
            </div>
            <div className="flex items-center gap-1 text-white">
              <Image src="/assets/resources/2.gif" alt="Clay" width={20} height={20} />
              <span className="font-bold">{village.clay}</span>
              <span className="text-green-300 text-xs">+{village.clay_production}/h</span>
            </div>
            <div className="flex items-center gap-1 text-white">
              <Image src="/assets/resources/3.gif" alt="Iron" width={20} height={20} />
              <span className="font-bold">{village.iron}</span>
              <span className="text-green-300 text-xs">+{village.iron_production}/h</span>
            </div>
            <div className="flex items-center gap-1 text-white">
              <Image src="/assets/resources/4.gif" alt="Crop" width={20} height={20} />
              <span className="font-bold">{village.crop}</span>
              <span className="text-green-300 text-xs">+{village.crop_production}/h</span>
            </div>
            <div className="flex items-center gap-1 text-white ml-4">
              <Users className="w-4 h-4 text-blue-300" />
              <span>{village.population}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-yellow-700 border-b border-yellow-600">
        <div className="container mx-auto flex">
          <button
            onClick={() => setIsVillageView(true)}
            className={`px-6 py-3 font-semibold transition-colors ${isVillageView
              ? 'bg-yellow-600 text-white border-b-2 border-yellow-300'
              : 'text-yellow-100 hover:text-white hover:bg-yellow-600'
              }`}
          >
            Village Center
          </button>
          <button
            onClick={() => setIsVillageView(false)}
            className={`px-6 py-3 font-semibold transition-colors ${!isVillageView
              ? 'bg-yellow-600 text-white border-b-2 border-yellow-300'
              : 'text-yellow-100 hover:text-white hover:bg-yellow-600'
              }`}
          >
            Resource Fields
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto p-4">
        {isVillageView ? (
          // Village Center with Background Image and Hotspots
          <div className="max-w-5xl mx-auto">
            <div className="relative">
              <Image
                src="/assets/slide1_1.jpg"
                alt="Village Center"
                width={800}
                height={600}
                className="w-full h-auto rounded-lg shadow-lg"
                priority
              />

              {/* Building Hotspots */}
              {VILLAGE_HOTSPOTS.map((hotspot) => {
                const building = buildingSlots.find(b => b.id === hotspot.id)
                if (!building) return null

                return (
                  <div
                    key={hotspot.id}
                    onClick={() => handleSlotClick(building)}
                    className="absolute cursor-pointer group"
                    style={{
                      left: `${hotspot.x}%`,
                      top: `${hotspot.y}%`,
                      width: `${hotspot.width}%`,
                      height: `${hotspot.height}%`,
                    }}
                  >
                    {/* Hotspot overlay */}
                    <div className="w-full h-full bg-yellow-400/20 hover:bg-yellow-400/40 border-2 border-transparent hover:border-yellow-400 rounded transition-all duration-200">
                      {building.level > 0 && (
                        <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full min-w-[24px] h-6 flex items-center justify-center font-bold shadow-lg">
                          {building.level}
                        </div>
                      )}
                    </div>

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-lg">
                      <div className="font-bold">{building.name}</div>
                      {building.level > 0 && <div className="text-xs">Level {building.level}</div>}
                      {building.isEmpty && <div className="text-xs text-gray-300">Click to build</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          // Resource Fields with Background Image and Hotspots
          <div className="max-w-5xl mx-auto">
            <div className="relative">
              <Image
                src="/assets/slide2_1.jpg"
                alt="Resource Fields"
                width={800}
                height={600}
                className="w-full h-auto rounded-lg shadow-lg"
                priority
              />

              {/* Resource Field Hotspots */}
              {RESOURCE_HOTSPOTS.map((hotspot) => {
                const field = resourceFields.find(f => f.id === hotspot.id)
                if (!field) return null

                return (
                  <div
                    key={hotspot.id}
                    onClick={() => handleFieldClick(field)}
                    className="absolute cursor-pointer group"
                    style={{
                      left: `${hotspot.x}%`,
                      top: `${hotspot.y}%`,
                      width: `${hotspot.width}%`,
                      height: `${hotspot.height}%`,
                    }}
                  >
                    {/* Hotspot overlay */}
                    <div className="w-full h-full bg-green-400/20 hover:bg-green-400/40 border-2 border-transparent hover:border-green-400 rounded transition-all duration-200">
                      <div className="absolute -top-2 -right-2 bg-yellow-600 text-white text-xs rounded-full min-w-[24px] h-6 flex items-center justify-center font-bold shadow-lg">
                        {field.level}
                      </div>

                      {/* Resource type indicator */}
                      <div className="absolute -bottom-2 -left-2">
                        <Image
                          src={`/assets/resources/${field.type === 'wood' ? '1' : field.type === 'clay' ? '2' : field.type === 'iron' ? '3' : '4'}.gif`}
                          alt={field.type}
                          width={20}
                          height={20}
                          className="shadow-lg"
                        />
                      </div>
                    </div>

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-lg">
                      <div className="font-bold">{field.type.charAt(0).toUpperCase() + field.type.slice(1)} Field</div>
                      <div className="text-xs">Level {field.level}</div>
                      <div className="text-xs text-green-300">+{field.level * 10}/hour</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>      {/* Upgrade Modal */}
      {showUpgradeModal && (selectedSlot || selectedField) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-yellow-800 to-yellow-900 rounded-lg p-6 max-w-md w-full mx-4 border-2 border-yellow-600">
            <h3 className="text-white text-xl font-bold mb-4">
              {selectedField ? `Upgrade ${selectedField.type} field` : `Upgrade ${selectedSlot?.name}`}
            </h3>
            <p className="text-yellow-100 mb-4">
              {selectedField
                ? `Upgrade from level ${selectedField.level} to ${selectedField.level + 1}`
                : `Upgrade from level ${selectedSlot?.level} to ${(selectedSlot?.level || 0) + 1}`
              }
            </p>

            <div className="mb-4">
              <h4 className="text-white font-bold mb-2">Cost:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {selectedField ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Image src="/assets/resources/1.gif" alt="Wood" width={16} height={16} />
                      <span className="text-white">{(selectedField.level + 1) * 50}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Image src="/assets/resources/2.gif" alt="Clay" width={16} height={16} />
                      <span className="text-white">{(selectedField.level + 1) * 50}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Image src="/assets/resources/3.gif" alt="Iron" width={16} height={16} />
                      <span className="text-white">{(selectedField.level + 1) * 50}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Image src="/assets/resources/4.gif" alt="Crop" width={16} height={16} />
                      <span className="text-white">{(selectedField.level + 1) * 50}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Image src="/assets/resources/1.gif" alt="Wood" width={16} height={16} />
                      <span className="text-white">{((selectedSlot?.level || 0) + 1) * 100}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Image src="/assets/resources/2.gif" alt="Clay" width={16} height={16} />
                      <span className="text-white">{((selectedSlot?.level || 0) + 1) * 100}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Image src="/assets/resources/3.gif" alt="Iron" width={16} height={16} />
                      <span className="text-white">{((selectedSlot?.level || 0) + 1) * 100}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Image src="/assets/resources/4.gif" alt="Crop" width={16} height={16} />
                      <span className="text-white">{((selectedSlot?.level || 0) + 1) * 100}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={selectedField ? upgradeField : upgradeBuilding}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-semibold"
              >
                Upgrade
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false)
                  setSelectedSlot(null)
                  setSelectedField(null)
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded font-semibold"
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
          window.location.reload()
        }}
      />
    </div>
  )
}