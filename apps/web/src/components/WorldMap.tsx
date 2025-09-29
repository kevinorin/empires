'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { generateTerrainTemplate, getTerrainAt, TERRAIN_TYPES, type TerrainTemplate } from '@/lib/terrain'

interface Village {
  id: string
  name: string
  x: number
  y: number
  playerId: string
  playerName: string
  population: number
  isCapital: boolean
  alliance?: string
}

interface WorldMapProps {
  isOpen: boolean
  onClose: () => void
  onVillageSelect?: (x: number, y: number) => void
  centerX?: number
  centerY?: number
}

// World map configuration
const WORLD_SIZE = 801 // -400 to +400 coordinates
const MAP_CENTER = 400 // Center coordinate offset
const CELL_SIZE = 2 // Reduced from 4 to show more terrain
const VIEWPORT_SIZE = 800 // Visible area in pixels

export default function WorldMap({ isOpen, onClose, onVillageSelect, centerX = 0, centerY = 0 }: WorldMapProps) {
  const { user } = useAuth()
  const [villages, setVillages] = useState<Village[]>([])
  const [viewportX, setViewportX] = useState(centerX)
  const [viewportY, setViewportY] = useState(centerY)
  const [selectedCoords, setSelectedCoords] = useState<{ x: number, y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [terrainTemplate, setTerrainTemplate] = useState<TerrainTemplate | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  // Generate terrain template on component mount
  useEffect(() => {
    const template = generateTerrainTemplate('world-001', 12345) // Fixed seed for consistent world
    setTerrainTemplate(template)
  }, [])

  const handleVillageSelection = async (x: number, y: number) => {
    if (!onVillageSelect || !terrainTemplate) return

    try {
      // Check if location is already occupied
      const existingVillage = villages.find(v => v.x === x && v.y === y)
      if (existingVillage) {
        alert('This location is already occupied!')
        return
      }

      // Check if terrain is buildable
      const terrain = getTerrainAt(x, y, terrainTemplate)
      const terrainType = TERRAIN_TYPES[terrain.type]
      if (!terrainType.buildable) {
        alert(`Cannot build on ${terrainType.name}! Choose a different location.`)
        return
      }

      const response = await fetch('/api/world', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ x, y, name: 'New Village' }),
      })

      if (response.ok) {
        const data = await response.json()
        onVillageSelect(x, y)
        // Refresh villages to show the new one
        setVillages(prev => [...prev, {
          id: data.village.id,
          name: data.village.name,
          x: data.village.x,
          y: data.village.y,
          playerId: data.village.owner_id, // Fixed: use owner_id
          playerName: 'You',
          population: data.village.population,
          isCapital: data.village.is_capital
        }])
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to found village')
      }
    } catch (error) {
      console.error('Error founding village:', error)
      alert('Failed to found village')
    }
  }

  // Load villages from API
  useEffect(() => {
    const loadVillages = async () => {
      try {
        // Calculate viewport bounds
        const minX = Math.floor(viewportX - VIEWPORT_SIZE / 2 / CELL_SIZE) - 50
        const maxX = Math.ceil(viewportX + VIEWPORT_SIZE / 2 / CELL_SIZE) + 50
        const minY = Math.floor(viewportY - VIEWPORT_SIZE / 2 / CELL_SIZE) - 50
        const maxY = Math.ceil(viewportY + VIEWPORT_SIZE / 2 / CELL_SIZE) + 50

        const response = await fetch(
          `/api/world?minX=${minX}&maxX=${maxX}&minY=${minY}&maxY=${maxY}`
        )

        if (response.ok) {
          const data = await response.json()
          setVillages(data.villages || [])
        } else {
          console.error('Failed to load villages:', response.statusText)
          setVillages([]) // Don't show mock data
        }
      } catch (error) {
        console.error('Error loading villages:', error)
        setVillages([]) // Clear villages on error
      }
    }

    if (isOpen) {
      loadVillages()
    }
  }, [user, viewportX, viewportY, isOpen])

  const handleMapClick = (event: React.MouseEvent) => {
    if (!mapRef.current || isDragging) return

    const rect = mapRef.current.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const clickY = event.clientY - rect.top

    // Convert pixel coordinates to world coordinates
    const worldX = Math.round((clickX - VIEWPORT_SIZE / 2) / CELL_SIZE + viewportX)
    const worldY = Math.round((clickY - VIEWPORT_SIZE / 2) / CELL_SIZE + viewportY)

    // Check if coordinates are within world bounds
    if (worldX >= -400 && worldX <= 400 && worldY >= -400 && worldY <= 400) {
      setSelectedCoords({ x: worldX, y: worldY })
    }
  }

  const handleMouseDown = (event: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: event.clientX, y: event.clientY })
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging) return

    const deltaX = (event.clientX - dragStart.x) / CELL_SIZE
    const deltaY = (event.clientY - dragStart.y) / CELL_SIZE

    setViewportX(prev => Math.max(-400, Math.min(400, prev - deltaX)))
    setViewportY(prev => Math.max(-400, Math.min(400, prev - deltaY)))
    setDragStart({ x: event.clientX, y: event.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const renderVillages = () => {
    return villages.map(village => {
      const screenX = (village.x - viewportX) * CELL_SIZE + VIEWPORT_SIZE / 2
      const screenY = (village.y - viewportY) * CELL_SIZE + VIEWPORT_SIZE / 2

      // Only render if village is visible
      if (screenX < -20 || screenX > VIEWPORT_SIZE + 20 || screenY < -20 || screenY > VIEWPORT_SIZE + 20) {
        return null
      }

      const isOwnVillage = village.playerId === user?.id

      return (
        <div
          key={village.id}
          className={`absolute w-4 h-4 rounded-full cursor-pointer transform -translate-x-2 -translate-y-2 ${isOwnVillage
            ? 'bg-green-500 border-2 border-green-300'
            : 'bg-red-500 border-2 border-red-300'
            } hover:scale-125 transition-transform z-10`}
          style={{
            left: `${screenX}px`,
            top: `${screenY}px`,
          }}
          title={`${village.name} (${village.x}|${village.y}) - ${village.playerName} - Pop: ${village.population}`}
        />
      )
    })
  }

  const renderTerrain = () => {
    if (!terrainTemplate) return null

    const terrain = []
    // Reduce the area being rendered to improve performance
    const cellsPerSide = Math.ceil(VIEWPORT_SIZE / CELL_SIZE / 2) // Only render what's visible + small buffer
    const startX = Math.floor(viewportX - cellsPerSide)
    const endX = Math.ceil(viewportX + cellsPerSide)
    const startY = Math.floor(viewportY - cellsPerSide)
    const endY = Math.ceil(viewportY + cellsPerSide)

    // Render terrain cells within viewport with step size for performance
    for (let worldX = startX; worldX <= endX; worldX += 2) { // Step by 2 for performance
      for (let worldY = startY; worldY <= endY; worldY += 2) {
        const terrainCell = getTerrainAt(worldX, worldY, terrainTemplate)
        const terrainType = TERRAIN_TYPES[terrainCell.type]

        const screenX = (worldX - viewportX) * CELL_SIZE + VIEWPORT_SIZE / 2
        const screenY = (worldY - viewportY) * CELL_SIZE + VIEWPORT_SIZE / 2

        // Only render if within viewport bounds
        if (screenX >= -CELL_SIZE && screenX <= VIEWPORT_SIZE && screenY >= -CELL_SIZE && screenY <= VIEWPORT_SIZE) {
          terrain.push(
            <rect
              key={`terrain-${worldX}-${worldY}`}
              x={screenX}
              y={screenY}
              width={CELL_SIZE * 2} // Double width since we step by 2
              height={CELL_SIZE * 2} // Double height since we step by 2
              fill={terrainType.color}
              opacity={0.8}
            />
          )
        }
      }
    }

    return terrain
  }

  const renderGrid = () => {
    const lines = []
    const startX = Math.floor((viewportX - VIEWPORT_SIZE / 2 / CELL_SIZE) / 10) * 10
    const endX = Math.ceil((viewportX + VIEWPORT_SIZE / 2 / CELL_SIZE) / 10) * 10
    const startY = Math.floor((viewportY - VIEWPORT_SIZE / 2 / CELL_SIZE) / 10) * 10
    const endY = Math.ceil((viewportY + VIEWPORT_SIZE / 2 / CELL_SIZE) / 10) * 10

    // Vertical lines (every 10 coordinates)
    for (let x = startX; x <= endX; x += 10) {
      const screenX = (x - viewportX) * CELL_SIZE + VIEWPORT_SIZE / 2
      if (screenX >= 0 && screenX <= VIEWPORT_SIZE) {
        lines.push(
          <line
            key={`v-${x}`}
            x1={screenX}
            y1={0}
            x2={screenX}
            y2={VIEWPORT_SIZE}
            stroke={x === 0 ? '#10b981' : '#374151'}
            strokeWidth={x === 0 ? 2 : 1}
            opacity={0.3}
          />
        )
      }
    }

    // Horizontal lines (every 10 coordinates)
    for (let y = startY; y <= endY; y += 10) {
      const screenY = (y - viewportY) * CELL_SIZE + VIEWPORT_SIZE / 2
      if (screenY >= 0 && screenY <= VIEWPORT_SIZE) {
        lines.push(
          <line
            key={`h-${y}`}
            x1={0}
            y1={screenY}
            x2={VIEWPORT_SIZE}
            y2={screenY}
            stroke={y === 0 ? '#10b981' : '#374151'}
            strokeWidth={y === 0 ? 2 : 1}
            opacity={0.3}
          />
        )
      }
    }

    return lines
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
      <div className="bg-gradient-to-br from-yellow-800 to-yellow-900 rounded-lg p-6 max-w-6xl w-full max-h-full overflow-auto border-2 border-yellow-600 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-xl font-bold">World Map</h3>
          <button
            onClick={onClose}
            className="text-yellow-300 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="flex gap-4">
          {/* Map View */}
          <div className="flex-1">
            <div
              ref={mapRef}
              className="relative bg-green-800 border-2 border-yellow-600 cursor-crosshair overflow-hidden"
              style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
              onClick={handleMapClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Terrain Layer */}
              <svg className="absolute inset-0 pointer-events-none">
                {renderTerrain()}
              </svg>

              {/* Grid Layer */}
              <svg className="absolute inset-0 pointer-events-none">
                {renderGrid()}
              </svg>

              {/* Villages */}
              {renderVillages()}

              {/* Selected coordinates highlight */}
              {selectedCoords && (
                <div
                  className="absolute w-4 h-4 border-2 border-yellow-400 bg-yellow-400/20 transform -translate-x-2 -translate-y-2 pointer-events-none"
                  style={{
                    left: `${(selectedCoords.x - viewportX) * CELL_SIZE + VIEWPORT_SIZE / 2}px`,
                    top: `${(selectedCoords.y - viewportY) * CELL_SIZE + VIEWPORT_SIZE / 2}px`,
                  }}
                />
              )}

              {/* Center crosshair */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-1/2 top-1/2 w-4 h-4 border border-white/50 transform -translate-x-2 -translate-y-2" />
              </div>
            </div>

            {/* Map Controls */}
            <div className="mt-4 flex items-center justify-between text-white text-sm">
              <div>
                Center: ({Math.round(viewportX)}|{Math.round(viewportY)})
              </div>
              {selectedCoords && (
                <div className="flex items-center gap-4">
                  <span>Selected: ({selectedCoords.x}|{selectedCoords.y})</span>
                  {onVillageSelect && (
                    <button
                      onClick={() => handleVillageSelection(selectedCoords.x, selectedCoords.y)}
                      className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
                    >
                      Found Village Here
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Legend/Info Panel */}
          <div className="w-64 text-white">
            <h4 className="font-bold mb-2">Legend</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 border-2 border-green-300 rounded-full"></div>
                <span>Your Villages</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 border-2 border-red-300 rounded-full"></div>
                <span>Other Players</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-yellow-400 bg-yellow-400/20"></div>
                <span>Selected Location</span>
              </div>
            </div>

            {/* Terrain Legend */}
            <div className="mt-4">
              <h4 className="font-bold mb-2">Terrain</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3" style={{ backgroundColor: TERRAIN_TYPES.grassland.color, opacity: 0.6 }}></div>
                  <span>Grassland</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3" style={{ backgroundColor: TERRAIN_TYPES.forest.color, opacity: 0.6 }}></div>
                  <span>Forest (+25% wood)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3" style={{ backgroundColor: TERRAIN_TYPES.mountain.color, opacity: 0.6 }}></div>
                  <span>Mountains (+50% iron)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3" style={{ backgroundColor: TERRAIN_TYPES.water.color, opacity: 0.6 }}></div>
                  <span>Water</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3" style={{ backgroundColor: TERRAIN_TYPES.desert.color, opacity: 0.6 }}></div>
                  <span>Desert (+25% clay)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3" style={{ backgroundColor: TERRAIN_TYPES.garden.color, opacity: 0.6 }}></div>
                  <span>Garden (+100% crop)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3" style={{ backgroundColor: TERRAIN_TYPES.indigenous.color, opacity: 0.6 }}></div>
                  <span>Indigenous Territory</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-bold mb-2">Controls</h4>
              <div className="space-y-1 text-sm">
                <div>• Click to select coordinates</div>
                <div>• Drag to pan around</div>
                <div>• Hover villages for info</div>
              </div>
            </div>

            {/* Navigation shortcuts */}
            <div className="mt-6">
              <h4 className="font-bold mb-2">Quick Navigation</h4>
              <div className="space-y-2">
                <button
                  onClick={() => { setViewportX(0); setViewportY(0) }}
                  className="w-full bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm"
                >
                  Go to Center (0|0)
                </button>
                <button
                  onClick={() => { setViewportX(centerX); setViewportY(centerY) }}
                  className="w-full bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm"
                >
                  Go to Your Village
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}