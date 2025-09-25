// Game constants based on original Travian mechanics
export const TRIBES = {
  ROMANS: 1,
  TEUTONS: 2,
  GAULS: 3
} as const

export const BUILDING_TYPES = {
  // Resource fields (1-4)
  WOODCUTTER: 1,
  CLAY_PIT: 2,
  IRON_MINE: 3,
  CROPLAND: 4,

  // Infrastructure (5-9)
  SAWMILL: 5,
  BRICKYARD: 6,
  IRON_FOUNDRY: 7,
  GRAIN_MILL: 8,
  BAKERY: 9,

  // Storage (10-11)
  WAREHOUSE: 10,
  GRANARY: 11,

  // Military (12-19)
  BLACKSMITH: 12,
  ARMOURY: 13,
  TOURNAMENT_SQUARE: 14,
  MAIN_BUILDING: 15,
  RALLY_POINT: 16,
  MARKETPLACE: 17,
  EMBASSY: 18,
  BARRACKS: 19,

  // Advanced (20-22)
  STABLE: 20,
  WORKSHOP: 21,
  ACADEMY: 22,

  // Special (23-40)
  CRANNIES: 23,
  TOWN_HALL: 24,
  RESIDENCE: 25,
  PALACE: 26,
  TREASURY: 27,
  TRADE_OFFICE: 28,
  GREAT_BARRACKS: 29,
  GREAT_STABLE: 30,
  CITY_WALL: 31,
  EARTH_WALL: 32,
  PALISADE: 33,
  STONEMASON: 34,
  BREWERY: 35,
  TRAPPER: 36,
  HERO_MANSION: 37,
  GREAT_WAREHOUSE: 38,
  GREAT_GRANARY: 39,
  WONDER_OF_THE_WORLD: 40
} as const

export const UNIT_TYPES = {
  // Romans (1-10)
  LEGIONNAIRE: 1,
  PRAETORIAN: 2,
  IMPERIAN: 3,
  EQUITES_LEGATI: 4,
  EQUITES_IMPERATORIS: 5,
  EQUITES_CAESARIS: 6,
  BATTERING_RAM: 7,
  FIRE_CATAPULT: 8,
  SENATOR: 9,
  SETTLER: 10,

  // Teutons (11-20)
  CLUBSWINGER: 11,
  SPEARFIGHTER: 12,
  AXEFIGHTER: 13,
  SCOUT: 14,
  PALADIN: 15,
  TEUTONIC_KNIGHT: 16,
  RAM: 17,
  CATAPULT: 18,
  CHIEF: 19,
  SETTLER_T: 20,

  // Gauls (21-30)
  PHALANX: 21,
  SWORDSMAN: 22,
  PATHFINDER: 23,
  THEUTATES_THUNDER: 24,
  DRUIDRIDER: 25,
  HAEDUAN: 26,
  RAM_G: 27,
  TREBUCHET: 28,
  CHIEFTAIN: 29,
  SETTLER_G: 30
} as const

export const GAME_CONFIG = {
  SPEED_MULTIPLIER: 10, // 10x speed for development
  WORLD_SIZE: 401, // 401x401 map
  MAX_VILLAGES_PER_PLAYER: 10,
  BEGINNER_PROTECTION_HOURS: 72,
  CROP_CONSUMPTION_PER_UNIT: 1,
  BASE_RESOURCE_PRODUCTION: 2,
  WAREHOUSE_CAPACITY_BASE: 800,
  GRANARY_CAPACITY_BASE: 800
} as const

// Building data - production and costs
export const BUILDING_DATA = {
  [BUILDING_TYPES.WOODCUTTER]: {
    name: 'Woodcutter',
    resourceType: 'wood',
    baseProduction: 2,
    costs: [
      { wood: 40, clay: 100, iron: 50, crop: 60, time: 260 },
      { wood: 65, clay: 165, iron: 85, crop: 100, time: 615 },
      // ... additional levels
    ]
  },
  [BUILDING_TYPES.CLAY_PIT]: {
    name: 'Clay Pit',
    resourceType: 'clay',
    baseProduction: 2,
    costs: [
      { wood: 80, clay: 40, iron: 80, crop: 50, time: 220 },
      { wood: 135, clay: 65, iron: 135, crop: 85, time: 550 },
      // ... additional levels
    ]
  },
  // ... more building data
} as const

// Unit data - stats and costs
export const UNIT_DATA = {
  [UNIT_TYPES.LEGIONNAIRE]: {
    name: 'Legionnaire',
    tribe: TRIBES.ROMANS,
    attack: 40,
    defenseInfantry: 35,
    defenseCavalry: 50,
    speed: 6,
    carry: 50,
    cost: { wood: 120, clay: 100, iron: 150, crop: 30, time: 1600 },
    cropConsumption: 1
  },
  [UNIT_TYPES.PRAETORIAN]: {
    name: 'Praetorian',
    tribe: TRIBES.ROMANS,
    attack: 30,
    defenseInfantry: 65,
    defenseCavalry: 35,
    speed: 5,
    carry: 20,
    cost: { wood: 100, clay: 130, iron: 160, crop: 70, time: 1760 },
    cropConsumption: 1
  },
  // ... more unit data
} as const