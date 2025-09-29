'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Building, Plus, Hammer, Sword, Shield, Users, Home, ArrowLeft } from 'lucide-react'
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

// Original Travian building coordinates (from dorf2.tpl)
// These are the exact pixel coordinates used in the original game
const VILLAGE_HOTSPOTS = [
  // Based on original Travian coordinate system (19-38 are building positions)
  { id: 19, coords: "110,135,132,120,132,121,160,122,179,136,179,151,158,163,128,163,109,149", buildingType: 1, level: 1, name: 'Main Building' },
  { id: 20, coords: "202,93,223,79,223,79,251,80,271,95,271,109,249,121,220,121,200,108", buildingType: 3, level: 2, name: 'Warehouse' },
  { id: 21, coords: "290,76,311,61,311,62,339,63,359,77,359,92,337,104,308,104,289,90", buildingType: 2, level: 2, name: 'Granary' },
  { id: 22, coords: "384,105,406,91,406,91,434,92,453,106,453,121,432,133,402,133,383,120", buildingType: 4, level: 1, name: 'Barracks' },
  { id: 23, coords: "458,147,479,133,479,133,507,134,527,149,527,164,505,175,476,175,457,162", buildingType: 7, level: 1, name: 'Marketplace' },
  { id: 24, coords: "71,184,92,170,92,171,120,172,140,186,139,201,118,213,88,213,69,199", buildingType: 0, level: 0, name: 'Empty Lot' },
  { id: 25, coords: "516,196,538,182,538,182,566,183,585,198,585,212,564,224,534,224,515,211", buildingType: 0, level: 0, name: 'Empty Lot' },
  { id: 26, coords: "280,113,301,98,301,99,329,100,349,114,348,169,327,181,298,181,278,168", buildingType: 0, level: 0, name: 'Empty Lot' },
  { id: 27, coords: "97,320,118,306,118,307,146,308,166,322,165,337,144,349,114,349,95,335", buildingType: 0, level: 0, name: 'Empty Lot' },
  { id: 28, coords: "59,244,80,230,80,230,108,231,128,246,128,260,106,272,77,272,57,259", buildingType: 0, level: 0, name: 'Empty Lot' },
  { id: 29, coords: "477,249,498,235,498,235,526,236,546,251,545,265,524,277,494,277,475,264", buildingType: 0, level: 0, name: 'Empty Lot' },
  { id: 30, coords: "181,259,202,245,202,245,230,246,250,261,250,275,228,287,199,287,180,274", buildingType: 0, level: 0, name: 'Empty Lot' },
  { id: 31, coords: "182,189,203,175,203,175,231,176,251,190,251,205,229,217,200,217,181,204", buildingType: 0, level: 0, name: 'Empty Lot' },
  { id: 32, coords: "254,308,276,294,276,294,304,295,324,309,323,324,302,336,272,336,253,323", buildingType: 0, level: 0, name: 'Empty Lot' },
  { id: 33, coords: "505,317,526,303,526,303,554,304,574,319,573,333,552,345,522,345,503,332", buildingType: 0, level: 0, name: 'Empty Lot' },
  { id: 34, coords: "182,379,204,365,204,365,232,366,251,380,251,395,230,407,200,407,181,394", buildingType: 0, level: 0, name: 'Empty Lot' },
  { id: 35, coords: "324,370,345,356,345,357,373,358,393,372,392,387,371,398,341,398,322,385", buildingType: 0, level: 0, name: 'Empty Lot' },
  { id: 36, coords: "433,334,454,320,454,321,482,322,502,336,502,351,480,362,451,362,432,349", buildingType: 0, level: 0, name: 'Empty Lot' },
  { id: 37, coords: "271,412,292,398,292,399,320,400,340,414,339,429,318,440,289,440,269,427", buildingType: 0, level: 0, name: 'Empty Lot' },
  { id: 38, coords: "396,396,417,381,417,382,445,383,465,397,464,412,443,424,413,424,394,410", buildingType: 0, level: 0, name: 'Empty Lot' },
]

// Resource field hotspots (authentic Travian field layout - coordinates for resource background)
const RESOURCE_HOTSPOTS = [
  // Wood fields (top-left forests)
  { id: 1, coords: "89,194,119,178,149,194,119,211", type: 'wood', level: 2 },
  { id: 2, coords: "170,134,200,118,230,134,200,151", type: 'wood', level: 1 },
  { id: 3, coords: "50,134,80,118,110,134,80,151", type: 'wood', level: 3 },
  { id: 4, coords: "130,254,160,238,190,254,160,271", type: 'wood', level: 1 },

  // Clay fields (top-right clay pits)  
  { id: 5, coords: "513,134,543,118,573,134,543,151", type: 'clay', level: 2 },
  { id: 6, coords: "472,194,502,178,532,194,502,211", type: 'clay', level: 1 },
  { id: 7, coords: "554,194,584,178,614,194,584,211", type: 'clay', level: 2 },
  { id: 8, coords: "433,254,463,238,493,254,463,271", type: 'clay', level: 1 },

  // Iron fields (bottom mountains)
  { id: 9, coords: "270,464,300,448,330,464,300,481", type: 'iron', level: 1 },
  { id: 10, coords: "350,404,380,388,410,404,380,421", type: 'iron', level: 2 },
  { id: 11, coords: "210,404,240,388,270,404,240,421", type: 'iron', level: 1 },
  { id: 12, coords: "150,344,180,328,210,344,180,361", type: 'iron', level: 2 },

  // Crop fields (scattered farms) - 6 fields total like authentic Travian
  { id: 13, coords: "370,344,400,328,430,344,400,361", type: 'crop', level: 2 },
  { id: 14, coords: "250,344,280,328,310,344,280,361", type: 'crop', level: 3 },
  { id: 15, coords: "310,404,340,388,370,404,340,421", type: 'crop', level: 2 },
  { id: 16, coords: "330,464,360,448,390,464,360,481", type: 'crop', level: 1 },
  { id: 17, coords: "390,344,420,328,450,344,420,361", type: 'crop', level: 2 },
  { id: 18, coords: "270,404,300,388,330,404,300,421", type: 'crop', level: 1 },
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
  const [showStatisticsModal, setShowStatisticsModal] = useState(false)
  const [showReportsModal, setShowReportsModal] = useState(false)
  const [showMessagesModal, setShowMessagesModal] = useState(false)
  const [showWorldMapModal, setShowWorldMapModal] = useState(false)
  const [isVillageView, setIsVillageView] = useState(true) // Toggle between village and resources
  const [currentNavSection, setCurrentNavSection] = useState('village') // Track navigation section
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  // Handle window resize for fixed background positioning
  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    // Set initial size
    updateWindowSize()

    // Add event listener
    window.addEventListener('resize', updateWindowSize)

    // Cleanup
    return () => window.removeEventListener('resize', updateWindowSize)
  }, [])

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
    <div id="background" className="relative z-10 w-full min-h-screen overflow-hidden bg-no-repeat"
      style={{
        backgroundImage: currentNavSection === 'resources'
          ? "url('/assets/bgResources-main-background.jpg')"
          : "url('/assets/bgBuildings-main-background.jpg')",
        backgroundPosition: 'center top', // Authentic Travian positioning
        backgroundSize: 'auto', // Don't scale the background - keep original size
      }}
    >
      {/* Authentic Travian Header - Absolutely positioned overlay */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-700 border-b-4 border-amber-800 shadow-lg">
        <div className="container mx-auto px-4">
          {/* Top Bar with Logo and User Info */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-amber-100 tracking-wider">
                🏛️ EMPIRES
              </div>
              <div className="text-amber-200 text-sm">
                Server: {village.name}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-amber-100 text-sm">
                Player: {profile?.username || user?.email?.split('@')[0] || 'Guest'}
              </div>
              <button
                onClick={() => {
                  // Handle logout
                  window.location.href = '/'
                }}
                className="text-amber-200 hover:text-white text-sm"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Navigation Sprite Bar - Authentic Travian Style */}
          <div className="flex items-center justify-center py-2 mb-2">
            <div className="flex items-center gap-1" id="navigation">
              {/* Buildings Navigation */}
              <button
                onClick={() => {
                  setCurrentNavSection('village')
                  setIsVillageView(true)
                }}
                className="group relative inline-block border border-[#553420] rounded-full bg-gradient-to-b from-[#cbb198] to-[#7b6050] shadow-[inset_0_1px_0_0_#ddcbb7,inset_0_-1px_0_0_#664f3d,inset_1px_0_0_0_#bba693,inset_-1px_0_0_0_#7d6651,0_3px_3px_0_rgba(0,0,0,0.3)] transition-all duration-150 hover:shadow-[inset_0_1px_0_0_#ddcbb7,inset_0_-1px_0_0_#664f3d,inset_1px_0_0_0_#bba693,inset_-1px_0_0_0_#7d6651,0_1px_1px_0_rgba(0,0,0,0.3)] active:transform active:translate-y-[1px]"
              >
                <div
                  className="bg-[url('/assets/interface/navigation.png')] bg-[0_-124px] w-[62px] h-[62px] absolute top-[1px] left-[1px] pointer-events-none transition-[top] duration-150 group-active:top-[2px]"
                />
                <div className="w-16 h-16 flex items-center justify-center" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Village Center
                </div>
              </button>

              {/* Resources Navigation */}
              <button
                onClick={() => {
                  setCurrentNavSection('resources')
                  setIsVillageView(false)
                }}
                className="group relative inline-block border border-[#553420] rounded-full bg-gradient-to-b from-[#cbb198] to-[#7b6050] shadow-[inset_0_1px_0_0_#ddcbb7,inset_0_-1px_0_0_#664f3d,inset_1px_0_0_0_#bba693,inset_-1px_0_0_0_#7d6651,0_3px_3px_0_rgba(0,0,0,0.3)] transition-all duration-150 hover:shadow-[inset_0_1px_0_0_#ddcbb7,inset_0_-1px_0_0_#664f3d,inset_1px_0_0_0_#bba693,inset_-1px_0_0_0_#7d6651,0_1px_1px_0_rgba(0,0,0,0.3)] active:transform active:translate-y-[1px]"
              >
                <div
                  className="bg-[url('/assets/interface/navigation.png')] bg-[0_0] w-[62px] h-[62px] absolute top-[1px] left-[1px] pointer-events-none transition-[top] duration-150 group-active:top-[2px]"
                />
                <div className="w-16 h-16 flex items-center justify-center" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Resources
                </div>
              </button>

              {/* World Map Navigation */}
              <button
                onClick={() => setShowWorldMapModal(true)}
                className="group relative inline-block border border-[#553420] rounded-full bg-gradient-to-b from-[#cbb198] to-[#7b6050] shadow-[inset_0_1px_0_0_#ddcbb7,inset_0_-1px_0_0_#664f3d,inset_1px_0_0_0_#bba693,inset_-1px_0_0_0_#7d6651,0_3px_3px_0_rgba(0,0,0,0.3)] transition-all duration-150 hover:shadow-[inset_0_1px_0_0_#ddcbb7,inset_0_-1px_0_0_#664f3d,inset_1px_0_0_0_#bba693,inset_-1px_0_0_0_#7d6651,0_1px_1px_0_rgba(0,0,0,0.3)] active:transform active:translate-y-[1px]"
              >
                <div
                  className="bg-[url('/assets/interface/navigation.png')] bg-[0_-310px] w-[62px] h-[62px] absolute top-[1px] left-[1px] pointer-events-none transition-[top] duration-150 group-active:top-[2px]"
                />
                <div className="w-16 h-16 flex items-center justify-center" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  World Map
                </div>
              </button>

              {/* Statistics Navigation */}
              <button
                onClick={() => setShowStatisticsModal(true)}
                className="group relative inline-block border border-[#553420] rounded-full bg-gradient-to-b from-[#cbb198] to-[#7b6050] shadow-[inset_0_1px_0_0_#ddcbb7,inset_0_-1px_0_0_#664f3d,inset_1px_0_0_0_#bba693,inset_-1px_0_0_0_#7d6651,0_3px_3px_0_rgba(0,0,0,0.3)] transition-all duration-150 hover:shadow-[inset_0_1px_0_0_#ddcbb7,inset_0_-1px_0_0_#664f3d,inset_1px_0_0_0_#bba693,inset_-1px_0_0_0_#7d6651,0_1px_1px_0_rgba(0,0,0,0.3)] active:transform active:translate-y-[1px]"
              >
                <div
                  className="bg-[url('/assets/interface/navigation.png')] bg-[0_-372px] w-[62px] h-[62px] absolute top-[1px] left-[1px] pointer-events-none transition-[top] duration-150 group-active:top-[2px]"
                />
                <div className="w-16 h-16 flex items-center justify-center" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Statistics
                </div>
              </button>

              {/* Reports Navigation */}
              <button
                onClick={() => setShowReportsModal(true)}
                className="group relative inline-block border border-[#553420] rounded-full bg-gradient-to-b from-[#cbb198] to-[#7b6050] shadow-[inset_0_1px_0_0_#ddcbb7,inset_0_-1px_0_0_#664f3d,inset_1px_0_0_0_#bba693,inset_-1px_0_0_0_#7d6651,0_3px_3px_0_rgba(0,0,0,0.3)] transition-all duration-150 hover:shadow-[inset_0_1px_0_0_#ddcbb7,inset_0_-1px_0_0_#664f3d,inset_1px_0_0_0_#bba693,inset_-1px_0_0_0_#7d6651,0_1px_1px_0_rgba(0,0,0,0.3)] active:transform active:translate-y-[1px]"
              >
                <div
                  className="bg-[url('/assets/interface/navigation.png')] bg-[0_-558px] w-[62px] h-[62px] absolute top-[1px] left-[1px] pointer-events-none transition-[top] duration-150 group-active:top-[2px]"
                />
                <div className="w-16 h-16 flex items-center justify-center" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Reports
                </div>
              </button>

              {/* Messages Navigation */}
              <button
                onClick={() => setShowMessagesModal(true)}
                className="group relative inline-block border border-[#553420] rounded-full bg-gradient-to-b from-[#cbb198] to-[#7b6050] shadow-[inset_0_1px_0_0_#ddcbb7,inset_0_-1px_0_0_#664f3d,inset_1px_0_0_0_#bba693,inset_-1px_0_0_0_#7d6651,0_3px_3px_0_rgba(0,0,0,0.3)] transition-all duration-150 hover:shadow-[inset_0_1px_0_0_#ddcbb7,inset_0_-1px_0_0_#664f3d,inset_1px_0_0_0_#bba693,inset_-1px_0_0_0_#7d6651,0_1px_1px_0_rgba(0,0,0,0.3)] active:transform active:translate-y-[1px]"
              >
                <div
                  className="bg-[url('/assets/interface/navigation.png')] bg-[0_-682px] w-[62px] h-[62px] absolute top-[1px] left-[1px] pointer-events-none transition-[top] duration-150 group-active:top-[2px]"
                />
                <div className="w-16 h-16 flex items-center justify-center" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Messages
                </div>
              </button>

            </div>
          </div>

          {/* Resources Bar - Authentic Travian Style */}
          <div className="flex items-center justify-between py-2 bg-black/20 rounded-lg px-4 mb-2 mx-auto max-w-3xl">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1">
                <Image src="/assets/resources/lumber_small.png" alt="Wood" width={18} height={18} className="drop-shadow-sm" />
                <span className="text-white font-bold text-sm">{village.wood}</span>
                <span className="text-green-300 text-xs">({village.wood_production > 0 ? '+' : ''}{village.wood_production})</span>
              </div>
              <div className="flex items-center gap-1">
                <Image src="/assets/resources/clay_small.png" alt="Clay" width={18} height={18} className="drop-shadow-sm" />
                <span className="text-white font-bold text-sm">{village.clay}</span>
                <span className="text-green-300 text-xs">({village.clay_production > 0 ? '+' : ''}{village.clay_production})</span>
              </div>
              <div className="flex items-center gap-1">
                <Image src="/assets/resources/iron_small.png" alt="Iron" width={18} height={18} className="drop-shadow-sm" />
                <span className="text-white font-bold text-sm">{village.iron}</span>
                <span className="text-green-300 text-xs">({village.iron_production > 0 ? '+' : ''}{village.iron_production})</span>
              </div>
              <div className="flex items-center gap-1">
                <Image src="/assets/resources/crop_small.png" alt="Crop" width={18} height={18} className="drop-shadow-sm" />
                <span className="text-white font-bold text-sm">{village.crop}</span>
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

      {/* Village Content - Direct Overlay on Background */}
      <div className="relative w-full h-screen">
        {currentNavSection === 'village' ? (
          // Village Center - Direct on Background positioned to center the city
          <div
            className="absolute w-full h-full"
            style={{
              // Center the village area by adjusting background position
              backgroundPosition: 'center 40%', // Show less trees at top, center the city
            }}
          >
            {/* Invisible clickable overlay positioned for main background */}
            <div className="absolute inset-0 bottom-100">
              {/* Building Graphics Overlays - positioned for main background */}
              {VILLAGE_HOTSPOTS.map((hotspot) => {
                const building = buildingSlots.find(b => b.id === hotspot.id)
                if (!building || building.isEmpty) return null

                const buildingType = BUILDING_TYPES[hotspot.buildingType || 0]
                if (!buildingType) return null

                // Calculate center position from polygon coordinates
                const coords = hotspot.coords.split(',').map(Number)
                const xCoords = coords.filter((_, i) => i % 2 === 0)
                const yCoords = coords.filter((_, i) => i % 2 === 1)
                const centerX = xCoords.reduce((a, b) => a + b, 0) / xCoords.length
                const centerY = yCoords.reduce((a, b) => a + b, 0) / yCoords.length

                // Convert original coordinates to screen pixels
                // Original village image was 643x534 pixels
                // Position relative to the center of the screen where the background is centered
                const backgroundWidth = 643
                const backgroundHeight = 534

                // Calculate the center of the screen - fixed positioning for background alignment
                const screenCenterX = windowSize.width > 0 ? windowSize.width / 2 : 800
                const screenCenterY = 400 // Fixed vertical center - doesn't change with browser height

                // Position building relative to background center
                const adjustedX = screenCenterX + (centerX - backgroundWidth / 2)
                const adjustedY = screenCenterY + (centerY - backgroundHeight / 2)

                return (
                  <div
                    key={`building-${hotspot.id}`}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${adjustedX}px`,
                      top: `${adjustedY}px`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <Image
                      src={`/assets/buildings/${buildingType.img}`}
                      alt={building.name}
                      width={50}
                      height={50}
                      className="drop-shadow-lg"
                    />
                    {building.level > 1 && (
                      <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold text-[10px] shadow-lg">
                        {building.level}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Empty Building Site Indicators - subtle transparent ovals */}
              {VILLAGE_HOTSPOTS.map((hotspot) => {
                const building = buildingSlots.find(b => b.id === hotspot.id)
                if (!building || !building.isEmpty) return null

                // Calculate center position from polygon coordinates
                const coords = hotspot.coords.split(',').map(Number)
                const xCoords = coords.filter((_, i) => i % 2 === 0)
                const yCoords = coords.filter((_, i) => i % 2 === 1)
                const centerX = xCoords.reduce((a, b) => a + b, 0) / xCoords.length
                const centerY = yCoords.reduce((a, b) => a + b, 0) / yCoords.length

                // Convert original coordinates to screen pixels
                const backgroundWidth = 643
                const backgroundHeight = 534
                const screenCenterX = windowSize.width > 0 ? windowSize.width / 2 : 800
                const screenCenterY = 400 // Fixed vertical center - doesn't change with browser height
                const adjustedX = screenCenterX + (centerX - backgroundWidth / 2)
                const adjustedY = screenCenterY + (centerY - backgroundHeight / 2)

                return (
                  <div
                    key={`empty-site-${hotspot.id}`}
                    className="absolute cursor-pointer group"
                    style={{
                      left: `${adjustedX}px`,
                      top: `${adjustedY}px`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    onClick={() => handleSlotClick(building)}
                    title="Empty Building Slot"
                  >
                    {/* Isometric transparent oval for empty building sites */}
                    <div
                      className="bg-yellow-400/20 border border-yellow-300/40 shadow-inner group-hover:bg-yellow-400/40 group-hover:border-yellow-300/60 transition-all duration-200"
                      style={{
                        width: '60px',
                        height: '30px',
                        borderRadius: '50%',
                        transform: 'perspective(100px) rotateX(60deg)',
                      }}
                    />
                    {/* Hover tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      Empty Building Slot
                    </div>
                  </div>
                )
              })}

              {/* Clickable areas positioned for main background */}
              {VILLAGE_HOTSPOTS.map((hotspot) => {
                const building = buildingSlots.find(b => b.id === hotspot.id)
                if (!building) return null

                const title = building.isEmpty
                  ? "Empty Building Slot"
                  : `${building.name} (Level ${building.level})`

                // Calculate center position from polygon coordinates
                const coords = hotspot.coords.split(',').map(Number)
                const xCoords = coords.filter((_, i) => i % 2 === 0)
                const yCoords = coords.filter((_, i) => i % 2 === 1)
                const centerX = xCoords.reduce((a, b) => a + b, 0) / xCoords.length
                const centerY = yCoords.reduce((a, b) => a + b, 0) / yCoords.length

                // Convert original coordinates to screen pixels  
                // Original village image was 643x534 pixels
                // Position relative to the center of the screen where the background is centered
                const backgroundWidth = 643
                const backgroundHeight = 534

                // Calculate the center of the screen - fixed positioning for background alignment
                const screenCenterX = windowSize.width > 0 ? windowSize.width / 2 : 800
                const screenCenterY = 400 // Fixed vertical center - doesn't change with browser height

                // Position clickable area relative to background center
                const adjustedX = screenCenterX + (centerX - backgroundWidth / 2)
                const adjustedY = screenCenterY + (centerY - backgroundHeight / 2)

                return (
                  <div
                    key={`hotspot-${hotspot.id}`}
                    className="absolute cursor-pointer group bg-transparent rounded-lg transition-all duration-200"
                    style={{
                      left: `${adjustedX}px`,
                      top: `${adjustedY}px`,
                      transform: 'translate(-50%, -50%)',
                      width: '80px',
                      height: '80px',
                    }}
                    onClick={() => handleSlotClick(building)}
                    title={title}
                  >
                    {/* Hover tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {title}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        {currentNavSection === 'resources' && (
          // Resource Fields View - Direct on Background positioned for resource view
          <div
            className="absolute w-full h-full"
            style={{
              // Background is already set to resource background via state
              backgroundPosition: 'center top',
            }}
          >
            {/* Resource Field Hotspots */}
            {RESOURCE_HOTSPOTS.map((hotspot) => {
              const field = resourceFields.find(f => f.id === hotspot.id)
              if (!field) return null

              // Calculate center position from polygon coordinates
              const coords = hotspot.coords.split(',').map(Number)
              const xCoords = coords.filter((_, i) => i % 2 === 0)
              const yCoords = coords.filter((_, i) => i % 2 === 1)
              const centerX = xCoords.reduce((a, b) => a + b, 0) / xCoords.length
              const centerY = yCoords.reduce((a, b) => a + b, 0) / yCoords.length

              // Convert original coordinates to screen pixels
              // Resource background image dimensions
              const backgroundWidth = 643
              const backgroundHeight = 534

              // Calculate the center of the screen - fixed positioning for background alignment
              const screenCenterX = windowSize.width > 0 ? windowSize.width / 2 : 800
              const screenCenterY = 400 // Fixed vertical center - doesn't change with browser height

              // Position resource field relative to background center
              const adjustedX = screenCenterX + (centerX - backgroundWidth / 2)
              const adjustedY = screenCenterY + (centerY - backgroundHeight / 2)

              return (
                <div
                  key={hotspot.id}
                  onClick={() => handleFieldClick(field)}
                  className="absolute cursor-pointer group"
                  style={{
                    left: `${adjustedX}px`,
                    top: `${adjustedY}px`,
                    transform: 'translate(-50%, -50%)',
                    width: '60px',
                    height: '40px',
                  }}
                >
                  {/* Field visual indicator */}
                  <div className="w-full h-full hover:bg-green-400/20 border-2 border-transparent hover:border-green-400 rounded transition-all duration-200 relative">
                    {/* Level indicator */}
                    <div className="absolute -top-2 -right-2 bg-yellow-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-bold shadow-lg">
                      {field.level}
                    </div>

                    {/* Resource type indicator */}
                    <div className="absolute -bottom-1 -left-1">
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
        )}

        {/* Modal Content Area for Navigation States */}
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

      {/* Statistics Modal */}
      {showStatisticsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-yellow-800 to-yellow-900 rounded-lg p-6 max-w-2xl w-full mx-4 border-2 border-yellow-600">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-xl font-bold">Statistics</h3>
              <button
                onClick={() => setShowStatisticsModal(false)}
                className="text-yellow-300 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            <p className="text-yellow-100">Player statistics interface coming soon...</p>
          </div>
        </div>
      )}

      {/* Reports Modal */}
      {showReportsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-yellow-800 to-yellow-900 rounded-lg p-6 max-w-2xl w-full mx-4 border-2 border-yellow-600">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-xl font-bold">Reports</h3>
              <button
                onClick={() => setShowReportsModal(false)}
                className="text-yellow-300 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            <p className="text-yellow-100">Battle and activity reports coming soon...</p>
          </div>
        </div>
      )}

      {/* Messages Modal */}
      {showMessagesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-yellow-800 to-yellow-900 rounded-lg p-6 max-w-2xl w-full mx-4 border-2 border-yellow-600">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-xl font-bold">Messages</h3>
              <button
                onClick={() => setShowMessagesModal(false)}
                className="text-yellow-300 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            <p className="text-yellow-100">Message system coming soon...</p>
          </div>
        </div>
      )}

      {/* World Map Modal */}
      {showWorldMapModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-yellow-800 to-yellow-900 rounded-lg p-6 max-w-2xl w-full mx-4 border-2 border-yellow-600">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-xl font-bold">World Map</h3>
              <button
                onClick={() => setShowWorldMapModal(false)}
                className="text-yellow-300 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            <p className="text-yellow-100">World map interface coming soon...</p>
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