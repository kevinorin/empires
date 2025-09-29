// Game constants for Empires - Accelerated Travian-like mechanics

export interface BuildingType {
  id: number
  name: string
  description: string
  category: 'resource' | 'military' | 'infrastructure' | 'special'
  maxLevel: number
  prerequisites?: { buildingType: number; level: number }[]
  fieldTypes?: ('resource' | 'building')[] // Where this building can be placed
}

export interface BuildingCost {
  wood: number
  clay: number
  iron: number
  crop: number
  time: number // in seconds (4x faster than Travian)
}

export interface BuildingStats {
  production?: number // resource production per hour
  capacity?: number // storage capacity
  population?: number // population provided/consumed
  defense?: number // defensive bonus
}

// Building definitions (Travian-inspired but accelerated)
export const BUILDING_TYPES: Record<number, BuildingType> = {
  // Resource buildings (fields 1-18)
  1: { id: 1, name: 'Woodcutter', description: 'Produces wood', category: 'resource', maxLevel: 20, fieldTypes: ['resource'] },
  2: { id: 2, name: 'Clay Pit', description: 'Produces clay', category: 'resource', maxLevel: 20, fieldTypes: ['resource'] },
  3: { id: 3, name: 'Iron Mine', description: 'Produces iron', category: 'resource', maxLevel: 20, fieldTypes: ['resource'] },
  4: { id: 4, name: 'Cropland', description: 'Produces crop', category: 'resource', maxLevel: 20, fieldTypes: ['resource'] },

  // Infrastructure buildings (village center, fields 19-40)
  10: { id: 10, name: 'Warehouse', description: 'Stores wood, clay and iron', category: 'infrastructure', maxLevel: 20, fieldTypes: ['building'] },
  11: { id: 11, name: 'Granary', description: 'Stores crop', category: 'infrastructure', maxLevel: 20, fieldTypes: ['building'] },
  15: { id: 15, name: 'Main Building', description: 'Village center, speeds up construction', category: 'infrastructure', maxLevel: 20, fieldTypes: ['building'] },
  16: { id: 16, name: 'Rally Point', description: 'Meeting place for troops', category: 'military', maxLevel: 1, fieldTypes: ['building'] },

  // Advanced infrastructure
  17: {
    id: 17, name: 'Marketplace', description: 'Trade resources with other players', category: 'infrastructure', maxLevel: 20,
    prerequisites: [{ buildingType: 15, level: 3 }, { buildingType: 10, level: 1 }, { buildingType: 11, level: 1 }], fieldTypes: ['building']
  },
  18: {
    id: 18, name: 'Embassy', description: 'Join alliances', category: 'infrastructure', maxLevel: 20,
    prerequisites: [{ buildingType: 15, level: 1 }], fieldTypes: ['building']
  },
  19: {
    id: 19, name: 'Barracks', description: 'Train infantry troops', category: 'military', maxLevel: 20,
    prerequisites: [{ buildingType: 16, level: 1 }, { buildingType: 15, level: 3 }], fieldTypes: ['building']
  },
  20: {
    id: 20, name: 'Stable', description: 'Train cavalry troops', category: 'military', maxLevel: 20,
    prerequisites: [{ buildingType: 19, level: 5 }, { buildingType: 21, level: 3 }], fieldTypes: ['building']
  },
  21: {
    id: 21, name: 'Smithy', description: 'Improve weapons and armor', category: 'military', maxLevel: 20,
    prerequisites: [{ buildingType: 15, level: 3 }, { buildingType: 19, level: 1 }], fieldTypes: ['building']
  },

  // Special buildings
  25: {
    id: 25, name: 'Residence', description: 'Train settlers and expand', category: 'special', maxLevel: 20,
    prerequisites: [{ buildingType: 15, level: 5 }], fieldTypes: ['building']
  },
  26: {
    id: 26, name: 'Palace', description: 'Government center, train chiefs', category: 'special', maxLevel: 20,
    prerequisites: [{ buildingType: 18, level: 1 }, { buildingType: 15, level: 5 }], fieldTypes: ['building']
  },
  27: {
    id: 27, name: 'Treasury', description: 'Store artifacts and treasures', category: 'special', maxLevel: 10,
    prerequisites: [{ buildingType: 15, level: 10 }], fieldTypes: ['building']
  },
}

// Building costs and stats per level
export function getBuildingCost(buildingType: number, level: number): BuildingCost {
  const baseCosts: Record<number, BuildingCost> = {
    // Resource buildings - relatively cheap
    1: { wood: 40, clay: 100, iron: 50, crop: 60, time: 300 }, // 5 minutes (was ~30 min in Travian)
    2: { wood: 80, clay: 40, iron: 80, crop: 50, time: 300 },
    3: { wood: 100, clay: 80, iron: 30, crop: 60, time: 300 },
    4: { wood: 70, clay: 90, iron: 70, crop: 20, time: 300 },

    // Infrastructure buildings
    10: { wood: 130, clay: 160, iron: 90, crop: 40, time: 450 }, // 7.5 minutes
    11: { wood: 80, clay: 100, iron: 70, crop: 20, time: 450 },
    15: { wood: 70, clay: 40, iron: 60, crop: 20, time: 400 }, // 6.67 minutes
    16: { wood: 110, clay: 160, iron: 90, crop: 70, time: 500 }, // 8.33 minutes
    17: { wood: 80, clay: 70, iron: 120, crop: 70, time: 600 }, // 10 minutes
    18: { wood: 180, clay: 130, iron: 150, crop: 80, time: 900 }, // 15 minutes

    // Military buildings
    19: { wood: 210, clay: 140, iron: 260, crop: 120, time: 900 }, // 15 minutes
    20: { wood: 260, clay: 140, iron: 220, crop: 100, time: 1200 }, // 20 minutes  
    21: { wood: 170, clay: 200, iron: 380, crop: 130, time: 900 }, // 15 minutes

    // Special buildings - expensive and time-consuming
    25: { wood: 580, clay: 460, iron: 350, crop: 180, time: 2100 }, // 35 minutes
    26: { wood: 550, clay: 800, iron: 750, crop: 250, time: 3000 }, // 50 minutes
    27: { wood: 2880, clay: 2740, iron: 2580, crop: 990, time: 5400 }, // 90 minutes
  }

  const baseCost = baseCosts[buildingType] || { wood: 100, clay: 100, iron: 100, crop: 100, time: 600 }

  // Cost increases exponentially with level (Travian formula: base * 1.28^(level-1))
  const multiplier = Math.pow(1.28, level - 1)

  return {
    wood: Math.floor(baseCost.wood * multiplier),
    clay: Math.floor(baseCost.clay * multiplier),
    iron: Math.floor(baseCost.iron * multiplier),
    crop: Math.floor(baseCost.crop * multiplier),
    time: Math.floor(baseCost.time * multiplier)
  }
}

export function getBuildingStats(buildingType: number, level: number): BuildingStats {
  const stats: BuildingStats = {}

  switch (buildingType) {
    case 1: // Woodcutter
      stats.production = 30 + (level * 25) // Base 30 + 25 per level
      break
    case 2: // Clay Pit
      stats.production = 30 + (level * 25)
      break
    case 3: // Iron Mine
      stats.production = 30 + (level * 25)
      break
    case 4: // Cropland
      stats.production = 30 + (level * 25)
      break
    case 10: // Warehouse
      stats.capacity = 800 + (level * 1200) // 800 base + 1200 per level
      break
    case 11: // Granary
      stats.capacity = 800 + (level * 1200)
      break
    case 15: // Main Building
      stats.population = level * 2 // 2 population per level
      break
    case 16: // Rally Point
      stats.population = 1
      break
    case 17: // Marketplace
      stats.population = level * 4
      break
    case 18: // Embassy
      stats.population = level * 1
      break
    case 19: // Barracks
      stats.population = level * 4
      break
    case 20: // Stable
      stats.population = level * 5
      break
    case 21: // Smithy
      stats.population = level * 4
      break
    case 25: // Residence
      stats.population = level * 1
      break
    case 26: // Palace
      stats.population = level * 1
      break
    case 27: // Treasury
      stats.population = level * 1
      break
  }

  return stats
}

// Check if building prerequisites are met
export function checkPrerequisites(buildingType: number, existingBuildings: Array<{ type: number; level: number }>): boolean {
  const building = BUILDING_TYPES[buildingType]
  if (!building?.prerequisites) return true

  return building.prerequisites.every(prereq => {
    const existingBuilding = existingBuildings.find(b => b.type === prereq.buildingType)
    return existingBuilding && existingBuilding.level >= prereq.level
  })
}

// Resource production calculation
export function calculateResourceProduction(buildings: Array<{ type: number; level: number }>): {
  wood: number
  clay: number
  iron: number
  crop: number
} {
  const production = { wood: 0, clay: 0, iron: 0, crop: 0 }

  buildings.forEach(building => {
    const stats = getBuildingStats(building.type, building.level)
    if (stats.production) {
      switch (building.type) {
        case 1: production.wood += stats.production; break
        case 2: production.clay += stats.production; break
        case 3: production.iron += stats.production; break
        case 4: production.crop += stats.production; break
      }
    }
  })

  return production
}

// Storage capacity calculation
export function calculateStorageCapacity(buildings: Array<{ type: number; level: number }>): {
  warehouse: number
  granary: number
} {
  let warehouse = 800 // Base storage
  let granary = 800

  buildings.forEach(building => {
    const stats = getBuildingStats(building.type, building.level)
    if (stats.capacity) {
      switch (building.type) {
        case 10: warehouse = Math.max(warehouse, stats.capacity); break
        case 11: granary = Math.max(granary, stats.capacity); break
      }
    }
  })

  return { warehouse, granary }
}

// Construction time reduction from Main Building
export function calculateConstructionTime(baseTime: number, mainBuildingLevel: number): number {
  // Main building reduces construction time by 2.5% per level
  const reduction = mainBuildingLevel * 0.025
  return Math.floor(baseTime * (1 - Math.min(reduction, 0.5))) // Max 50% reduction
}