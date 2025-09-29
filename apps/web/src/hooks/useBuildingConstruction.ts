'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  getBuildingCost,
  getBuildingStats,
  BUILDING_TYPES,
  checkPrerequisites,
  calculateConstructionTime
} from '@/lib/gameConstants'

interface Building {
  id: string
  type: number
  level: number
  field: number
  village_id: string
  is_building: boolean
  completes_at: string | null
}

interface ConstructionQueue {
  building: Building
  timeRemaining: number
  cost: {
    wood: number
    clay: number
    iron: number
    crop: number
    time: number
  }
}

export function useBuildingConstruction(villageId: string | null) {
  const [constructionQueue, setConstructionQueue] = useState<ConstructionQueue[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Start building construction
  const startConstruction = useCallback(async (
    buildingType: number,
    field: number,
    buildings: Building[],
    spendResources: (cost: any) => Promise<boolean>
  ) => {
    if (!villageId) return false

    try {
      setLoading(true)
      setError(null)

      // Find existing building at this field
      const existingBuilding = buildings.find(b => b.field === field)
      const currentLevel = existingBuilding?.level || 0
      const targetLevel = currentLevel + 1

      // Check prerequisites
      if (!checkPrerequisites(buildingType, buildings)) {
        setError('Prerequisites not met')
        return false
      }

      // Check building type constraints
      const buildingDef = BUILDING_TYPES[buildingType]
      if (!buildingDef) {
        setError('Invalid building type')
        return false
      }

      if (targetLevel > buildingDef.maxLevel) {
        setError(`Maximum level ${buildingDef.maxLevel} reached`)
        return false
      }

      // Calculate costs
      const cost = getBuildingCost(buildingType, targetLevel)

      // Calculate construction time (with Main Building reduction)
      const mainBuilding = buildings.find(b => b.type === 15) // Main Building
      const constructionTime = calculateConstructionTime(cost.time, mainBuilding?.level || 0)

      // Check if another building is already under construction
      const buildingInProgress = buildings.find(b => b.is_building)
      if (buildingInProgress) {
        setError('Another building is already under construction')
        return false
      }

      // Try to spend resources
      const canAfford = await spendResources(cost)
      if (!canAfford) {
        setError('Insufficient resources')
        return false
      }

      const completionTime = new Date(Date.now() + constructionTime * 1000)

      if (existingBuilding) {
        // Upgrade existing building
        const { error: updateError } = await supabase
          .from('buildings')
          .update({
            is_building: true,
            completes_at: completionTime.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingBuilding.id)

        if (updateError) throw updateError
      } else {
        // Create new building
        const { error: insertError } = await supabase
          .from('buildings')
          .insert({
            type: buildingType,
            level: 0, // Will be upgraded to 1 when construction completes
            field: field,
            village_id: villageId,
            is_building: true,
            completes_at: completionTime.toISOString()
          })

        if (insertError) throw insertError
      }

      return true
    } catch (err: any) {
      console.error('Error starting construction:', err)
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [villageId])

  // Complete building construction
  const completeConstruction = useCallback(async (buildingId: string) => {
    try {
      // Get building details
      const { data: building, error: fetchError } = await supabase
        .from('buildings')
        .select('*')
        .eq('id', buildingId)
        .single()

      if (fetchError) throw fetchError

      // Complete construction
      const { error: updateError } = await supabase
        .from('buildings')
        .update({
          level: building.level + 1,
          is_building: false,
          completes_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', buildingId)

      if (updateError) throw updateError

      // Update village production if it's a resource building
      if ([1, 2, 3, 4].includes(building.type)) {
        await updateVillageProduction(building.village_id)
      }

      return true
    } catch (err: any) {
      console.error('Error completing construction:', err)
      setError(err.message)
      return false
    }
  }, [])

  // Update village production rates
  const updateVillageProduction = useCallback(async (villageId: string) => {
    try {
      // Get all buildings for this village
      const { data: buildings, error: buildingsError } = await supabase
        .from('buildings')
        .select('type, level')
        .eq('village_id', villageId)
        .eq('is_building', false) // Only completed buildings

      if (buildingsError) throw buildingsError

      // Calculate new production rates
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

      // Update village production
      const { error: updateError } = await supabase
        .from('villages')
        .update({
          wood_production: production.wood,
          clay_production: production.clay,
          iron_production: production.iron,
          crop_production: production.crop,
          updated_at: new Date().toISOString()
        })
        .eq('id', villageId)

      if (updateError) throw updateError
    } catch (err: any) {
      console.error('Error updating village production:', err)
    }
  }, [])

  // Check for completed constructions
  const checkCompletedConstructions = useCallback(async () => {
    if (!villageId) return

    try {
      const { data: buildings, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('village_id', villageId)
        .eq('is_building', true)
        .not('completes_at', 'is', null)

      if (error) throw error

      const now = new Date()
      const completedBuildings = buildings.filter(b =>
        b.completes_at && new Date(b.completes_at) <= now
      )

      for (const building of completedBuildings) {
        await completeConstruction(building.id)
      }
    } catch (err: any) {
      console.error('Error checking completed constructions:', err)
    }
  }, [villageId, completeConstruction])

  // Get construction time remaining for a building
  const getTimeRemaining = useCallback((completesAt: string): number => {
    const completion = new Date(completesAt)
    const now = new Date()
    return Math.max(0, Math.floor((completion.getTime() - now.getTime()) / 1000))
  }, [])

  // Cancel construction (only if just started - within 5 minutes)
  const cancelConstruction = useCallback(async (buildingId: string) => {
    try {
      const { data: building, error: fetchError } = await supabase
        .from('buildings')
        .select('*')
        .eq('id', buildingId)
        .single()

      if (fetchError) throw fetchError

      // Check if construction can be cancelled (within 5 minutes of start)
      if (building.completes_at) {
        const completionTime = new Date(building.completes_at)
        const cost = getBuildingCost(building.type, building.level + 1)
        const startTime = new Date(completionTime.getTime() - cost.time * 1000)
        const now = new Date()

        if (now.getTime() - startTime.getTime() > 300000) { // 5 minutes
          setError('Construction cannot be cancelled after 5 minutes')
          return false
        }
      }

      // Cancel construction and refund 80% of resources
      const cost = getBuildingCost(building.type, building.level + 1)
      const refund = {
        wood: Math.floor(cost.wood * 0.8),
        clay: Math.floor(cost.clay * 0.8),
        iron: Math.floor(cost.iron * 0.8),
        crop: Math.floor(cost.crop * 0.8)
      }

      // Update building status
      const { error: updateError } = await supabase
        .from('buildings')
        .update({
          is_building: false,
          completes_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', buildingId)

      if (updateError) throw updateError

      // Refund resources to village
      const { error: refundError } = await supabase.rpc('add_village_resources', {
        village_id: villageId,
        wood_amount: refund.wood,
        clay_amount: refund.clay,
        iron_amount: refund.iron,
        crop_amount: refund.crop
      })

      if (refundError) console.warn('Refund failed:', refundError)

      return true
    } catch (err: any) {
      console.error('Error cancelling construction:', err)
      setError(err.message)
      return false
    }
  }, [villageId])

  return {
    constructionQueue,
    loading,
    error,
    startConstruction,
    completeConstruction,
    cancelConstruction,
    checkCompletedConstructions,
    getTimeRemaining
  }
}