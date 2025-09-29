// Terrain generation system for Travian-style world map
// Based on 100x100 templates that tile across the world

export interface TerrainCell {
  type: 'grassland' | 'forest' | 'mountain' | 'water' | 'desert' | 'garden' | 'indigenous'
  x: number
  y: number
}

export interface TerrainTemplate {
  id: string
  size: number
  cells: TerrainCell[]
}

// Terrain type definitions with colors and gameplay effects
export const TERRAIN_TYPES = {
  grassland: {
    color: '#7FB069', // Light green
    name: 'Grassland',
    buildable: true,
    resourceBonus: {},
  },
  forest: {
    color: '#2D5016', // Dark green
    name: 'Forest',
    buildable: true,
    resourceBonus: { wood: 1.25 },
  },
  mountain: {
    color: '#8B7355', // Gray-brown
    name: 'Mountains',
    buildable: false, // Can't build villages on mountains
    resourceBonus: { iron: 1.5 },
  },
  water: {
    color: '#4A90E2', // Blue
    name: 'Water',
    buildable: false,
    resourceBonus: {},
  },
  desert: {
    color: '#DEB887', // Tan/sandy
    name: 'Desert',
    buildable: true,
    resourceBonus: { clay: 1.25 },
  },
  garden: {
    color: '#32CD32', // Bright green (oasis)
    name: 'Garden Oasis',
    buildable: true,
    resourceBonus: { crop: 2.0, wood: 1.5 }, // Significant crop bonus like Travian oases
  },
  indigenous: {
    color: '#8B4513', // Saddle brown
    name: 'Indigenous Territory',
    buildable: false, // Special NPC areas
    resourceBonus: {},
  }
} as const

// Generate a 100x100 terrain template using procedural generation
export function generateTerrainTemplate(templateId: string, seed: number = 0): TerrainTemplate {
  const size = 100
  const cells: TerrainCell[] = []

  // Simple seeded random number generator
  let rngSeed = seed
  const random = () => {
    rngSeed = (rngSeed * 9301 + 49297) % 233280
    return rngSeed / 233280
  }

  // First pass: Create base terrain (mostly grassland)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      cells.push({
        type: 'grassland',
        x,
        y
      })
    }
  }

  // Second pass: Add water features (rivers, lakes)
  // Create 2-3 rivers across the template
  const numRivers = 2 + Math.floor(random() * 2)
  for (let i = 0; i < numRivers; i++) {
    const startX = Math.floor(random() * size)
    const startY = 0
    const endX = Math.floor(random() * size)
    const endY = size - 1

    // Simple river path
    createRiver(cells, startX, startY, endX, endY, size)
  }

  // Third pass: Add mountain ranges
  const numMountainRanges = 3 + Math.floor(random() * 3)
  for (let i = 0; i < numMountainRanges; i++) {
    const centerX = Math.floor(random() * size)
    const centerY = Math.floor(random() * size)
    const rangeSize = 8 + Math.floor(random() * 12)

    createMountainRange(cells, centerX, centerY, rangeSize, size, random)
  }

  // Fourth pass: Add forests
  const numForests = 15 + Math.floor(random() * 10)
  for (let i = 0; i < numForests; i++) {
    const centerX = Math.floor(random() * size)
    const centerY = Math.floor(random() * size)
    const forestSize = 5 + Math.floor(random() * 8)

    createForest(cells, centerX, centerY, forestSize, size, random)
  }

  // Fifth pass: Add desert areas
  const numDeserts = 2 + Math.floor(random() * 3)
  for (let i = 0; i < numDeserts; i++) {
    const centerX = Math.floor(random() * size)
    const centerY = Math.floor(random() * size)
    const desertSize = 15 + Math.floor(random() * 20)

    createDesert(cells, centerX, centerY, desertSize, size, random)
  }

  // Sixth pass: Add gardens (oases) in desert areas
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]
    if (cell.type === 'desert' && random() < 0.03) { // 3% chance for oasis in desert
      cell.type = 'garden'
    }
  }

  // Seventh pass: Add indigenous territories (special areas)
  const numIndigenous = 1 + Math.floor(random() * 2)
  for (let i = 0; i < numIndigenous; i++) {
    const centerX = Math.floor(random() * size)
    const centerY = Math.floor(random() * size)
    const territorySize = 8 + Math.floor(random() * 8)

    createIndigenousTerritory(cells, centerX, centerY, territorySize, size, random)
  }

  return {
    id: templateId,
    size,
    cells
  }
}

// Helper functions for terrain generation
function createRiver(cells: TerrainCell[], startX: number, startY: number, endX: number, endY: number, size: number) {
  const steps = Math.abs(endY - startY)
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps
    const x = Math.round(startX + (endX - startX) * progress)
    const y = Math.round(startY + (endY - startY) * progress)

    // Make river 1-2 cells wide
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const riverX = x + dx
        const riverY = y + dy
        if (riverX >= 0 && riverX < size && riverY >= 0 && riverY < size) {
          const index = riverY * size + riverX
          if (cells[index] && Math.abs(dx) + Math.abs(dy) <= 1) {
            cells[index].type = 'water'
          }
        }
      }
    }
  }
}

function createMountainRange(cells: TerrainCell[], centerX: number, centerY: number, rangeSize: number, size: number, random: () => number) {
  for (let i = 0; i < rangeSize; i++) {
    const angle = random() * Math.PI * 2
    const distance = random() * rangeSize
    const x = Math.round(centerX + Math.cos(angle) * distance)
    const y = Math.round(centerY + Math.sin(angle) * distance)

    if (x >= 0 && x < size && y >= 0 && y < size) {
      const index = y * size + x
      if (cells[index] && cells[index].type === 'grassland') {
        cells[index].type = 'mountain'
      }
    }
  }
}

function createForest(cells: TerrainCell[], centerX: number, centerY: number, forestSize: number, size: number, random: () => number) {
  for (let i = 0; i < forestSize; i++) {
    const angle = random() * Math.PI * 2
    const distance = random() * forestSize * 0.8
    const x = Math.round(centerX + Math.cos(angle) * distance)
    const y = Math.round(centerY + Math.sin(angle) * distance)

    if (x >= 0 && x < size && y >= 0 && y < size) {
      const index = y * size + x
      if (cells[index] && cells[index].type === 'grassland') {
        cells[index].type = 'forest'
      }
    }
  }
}

function createDesert(cells: TerrainCell[], centerX: number, centerY: number, desertSize: number, size: number, random: () => number) {
  for (let i = 0; i < desertSize; i++) {
    const angle = random() * Math.PI * 2
    const distance = random() * desertSize * 0.7
    const x = Math.round(centerX + Math.cos(angle) * distance)
    const y = Math.round(centerY + Math.sin(angle) * distance)

    if (x >= 0 && x < size && y >= 0 && y < size) {
      const index = y * size + x
      if (cells[index] && cells[index].type === 'grassland') {
        cells[index].type = 'desert'
      }
    }
  }
}

function createIndigenousTerritory(cells: TerrainCell[], centerX: number, centerY: number, territorySize: number, size: number, random: () => number) {
  for (let i = 0; i < territorySize; i++) {
    const angle = random() * Math.PI * 2
    const distance = random() * territorySize * 0.6
    const x = Math.round(centerX + Math.cos(angle) * distance)
    const y = Math.round(centerY + Math.sin(angle) * distance)

    if (x >= 0 && x < size && y >= 0 && y < size) {
      const index = y * size + x
      if (cells[index] && ['grassland', 'forest'].includes(cells[index].type)) {
        cells[index].type = 'indigenous'
      }
    }
  }
}

// Get terrain type for any world coordinate
export function getTerrainAt(worldX: number, worldY: number, template: TerrainTemplate): TerrainCell {
  // Convert world coordinates to template coordinates
  const templateX = ((worldX % template.size) + template.size) % template.size
  const templateY = ((worldY % template.size) + template.size) % template.size

  const index = templateY * template.size + templateX
  return template.cells[index] || { type: 'grassland', x: templateX, y: templateY }
}

// Check if coordinate is buildable
export function isBuildable(worldX: number, worldY: number, template: TerrainTemplate): boolean {
  const terrain = getTerrainAt(worldX, worldY, template)
  return TERRAIN_TYPES[terrain.type].buildable
}

// Get resource bonuses for a coordinate
export function getResourceBonuses(worldX: number, worldY: number, template: TerrainTemplate) {
  const terrain = getTerrainAt(worldX, worldY, template)
  return TERRAIN_TYPES[terrain.type].resourceBonus
}