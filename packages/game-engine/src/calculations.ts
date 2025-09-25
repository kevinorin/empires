import { BUILDING_DATA, GAME_CONFIG } from './constants'

export class ResourceCalculator {
  /**
   * Calculate resource production per hour for a village
   */
  static calculateProduction(buildings: Array<{ type: number; level: number }>) {
    const production = {
      wood: GAME_CONFIG.BASE_RESOURCE_PRODUCTION,
      clay: GAME_CONFIG.BASE_RESOURCE_PRODUCTION,
      iron: GAME_CONFIG.BASE_RESOURCE_PRODUCTION,
      crop: GAME_CONFIG.BASE_RESOURCE_PRODUCTION
    }

    buildings.forEach(building => {
      const buildingData = BUILDING_DATA[building.type as keyof typeof BUILDING_DATA]
      if (buildingData?.resourceType) {
        const levelProduction = this.calculateBuildingProduction(building.type, building.level)
        production[buildingData.resourceType as keyof typeof production] += levelProduction
      }
    })

    // Apply speed multiplier
    Object.keys(production).forEach(key => {
      production[key as keyof typeof production] *= GAME_CONFIG.SPEED_MULTIPLIER
    })

    return production
  }

  /**
   * Calculate production for a specific building at a specific level
   */
  static calculateBuildingProduction(buildingType: number, level: number): number {
    // Simplified production formula: baseProduction * level * 1.5^(level-1)
    const base = GAME_CONFIG.BASE_RESOURCE_PRODUCTION
    return Math.floor(base * level * Math.pow(1.5, level - 1))
  }

  /**
   * Calculate storage capacity for warehouses/granaries
   */
  static calculateStorageCapacity(buildingType: number, level: number): number {
    const baseCapacity = buildingType === 10 ?
      GAME_CONFIG.WAREHOUSE_CAPACITY_BASE :
      GAME_CONFIG.GRANARY_CAPACITY_BASE

    return Math.floor(baseCapacity * Math.pow(1.3, level))
  }

  /**
   * Calculate crop consumption for military units
   */
  static calculateCropConsumption(units: Array<{ type: number; quantity: number }>): number {
    return units.reduce((total, unit) => {
      return total + (unit.quantity * GAME_CONFIG.CROP_CONSUMPTION_PER_UNIT)
    }, 0)
  }
}

export class BuildingCalculator {
  /**
   * Calculate building costs for a specific level
   */
  static calculateCost(buildingType: number, level: number) {
    // Simplified cost formula - costs increase exponentially
    const baseCosts = {
      1: { wood: 40, clay: 100, iron: 50, crop: 60, time: 260 }, // Woodcutter
      2: { wood: 80, clay: 40, iron: 80, crop: 50, time: 220 },  // Clay pit
      3: { wood: 100, clay: 80, iron: 30, crop: 60, time: 450 }, // Iron mine
      4: { wood: 70, clay: 90, iron: 70, crop: 20, time: 150 },  // Cropland
      // Add more as needed
    }

    const base = baseCosts[buildingType as keyof typeof baseCosts] || baseCosts[1]
    const multiplier = Math.pow(1.28, level - 1)

    return {
      wood: Math.floor(base.wood * multiplier),
      clay: Math.floor(base.clay * multiplier),
      iron: Math.floor(base.iron * multiplier),
      crop: Math.floor(base.crop * multiplier),
      time: Math.floor(base.time * multiplier / GAME_CONFIG.SPEED_MULTIPLIER)
    }
  }

  /**
   * Calculate construction time in seconds
   */
  static calculateBuildTime(buildingType: number, level: number, mainBuildingLevel: number = 1): number {
    const baseCost = this.calculateCost(buildingType, level)
    // Construction time reduced by main building level
    const timeReduction = 1 - (mainBuildingLevel * 0.05) // 5% per level
    return Math.floor(baseCost.time * Math.max(0.1, timeReduction))
  }
}

export class CoordinateSystem {
  /**
   * Check if coordinates are valid on the map
   */
  static isValidCoordinate(x: number, y: number): boolean {
    const maxCoord = Math.floor(GAME_CONFIG.WORLD_SIZE / 2)
    return x >= -maxCoord && x <= maxCoord && y >= -maxCoord && y <= maxCoord
  }

  /**
   * Calculate distance between two points
   */
  static calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
  }

  /**
   * Generate random valid coordinates
   */
  static generateRandomCoordinates(): { x: number; y: number } {
    const maxCoord = Math.floor(GAME_CONFIG.WORLD_SIZE / 2)
    const x = Math.floor(Math.random() * GAME_CONFIG.WORLD_SIZE) - maxCoord
    const y = Math.floor(Math.random() * GAME_CONFIG.WORLD_SIZE) - maxCoord
    return { x, y }
  }
}