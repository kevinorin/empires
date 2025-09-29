'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { calculateResourceProduction, calculateStorageCapacity } from '@/lib/gameConstants'

interface VillageResources {
  id: string
  wood: number
  clay: number
  iron: number
  crop: number
  warehouse: number
  granary: number
  wood_production: number
  clay_production: number
  iron_production: number
  crop_production: number
  last_update: string
}

interface Building {
  id: string
  type: number
  level: number
  field: number
  village_id: string
  is_building: boolean
  completes_at: string | null
}

export function useVillageResources(villageId: string | null) {
  const [resources, setResources] = useState<VillageResources | null>(null)
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load village data
  const loadVillageData = useCallback(async () => {
    if (!villageId) return

    try {
      setLoading(true)

      // Load village with current resources
      const { data: villageData, error: villageError } = await supabase
        .from('villages')
        .select('*')
        .eq('id', villageId)
        .single()

      if (villageError) throw villageError

      // Load buildings
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select('*')
        .eq('village_id', villageId)

      if (buildingsError) throw buildingsError

      setBuildings(buildingsData || [])

      // Calculate current production rates
      const production = calculateResourceProduction(buildingsData || [])
      const storage = calculateStorageCapacity(buildingsData || [])

      // Calculate resources based on time elapsed since last update
      const lastUpdate = new Date(villageData.updated_at)
      const now = new Date()
      const hoursElapsed = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60)

      const currentResources: VillageResources = {
        id: villageData.id,
        wood: Math.min(
          villageData.wood + Math.floor(production.wood * hoursElapsed),
          storage.warehouse
        ),
        clay: Math.min(
          villageData.clay + Math.floor(production.clay * hoursElapsed),
          storage.warehouse
        ),
        iron: Math.min(
          villageData.iron + Math.floor(production.iron * hoursElapsed),
          storage.warehouse
        ),
        crop: Math.min(
          villageData.crop + Math.floor(production.crop * hoursElapsed),
          storage.granary
        ),
        warehouse: storage.warehouse,
        granary: storage.granary,
        wood_production: production.wood,
        clay_production: production.clay,
        iron_production: production.iron,
        crop_production: production.crop,
        last_update: villageData.updated_at
      }

      setResources(currentResources)

      // Update database with calculated resources
      await supabase
        .from('villages')
        .update({
          wood: currentResources.wood,
          clay: currentResources.clay,
          iron: currentResources.iron,
          crop: currentResources.crop,
          wood_production: currentResources.wood_production,
          clay_production: currentResources.clay_production,
          iron_production: currentResources.iron_production,
          crop_production: currentResources.crop_production,
          warehouse: currentResources.warehouse,
          granary: currentResources.granary,
          updated_at: now.toISOString()
        })
        .eq('id', villageId)

    } catch (err: any) {
      console.error('Error loading village data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [villageId])

  // Save resources to database
  const saveResources = useCallback(async (updatedResources: Partial<VillageResources>) => {
    if (!villageId || !resources) return

    try {
      const { error } = await supabase
        .from('villages')
        .update({
          ...updatedResources,
          updated_at: new Date().toISOString()
        })
        .eq('id', villageId)

      if (error) throw error

      setResources(prev => prev ? { ...prev, ...updatedResources } : null)
    } catch (err: any) {
      console.error('Error saving resources:', err)
      setError(err.message)
    }
  }, [villageId, resources])

  // Spend resources (for building construction, etc.)
  const spendResources = useCallback(async (cost: { wood: number; clay: number; iron: number; crop: number }) => {
    if (!resources) return false

    // Check if enough resources
    if (resources.wood < cost.wood || resources.clay < cost.clay ||
      resources.iron < cost.iron || resources.crop < cost.crop) {
      return false
    }

    const newResources = {
      wood: resources.wood - cost.wood,
      clay: resources.clay - cost.clay,
      iron: resources.iron - cost.iron,
      crop: resources.crop - cost.crop
    }

    await saveResources(newResources)
    return true
  }, [resources, saveResources])

  // Real-time resource updates (every 30 seconds)
  useEffect(() => {
    if (!villageId || !resources) return

    const interval = setInterval(() => {
      setResources(prev => {
        if (!prev) return prev

        const increment = {
          wood: Math.min(prev.wood + Math.floor(prev.wood_production / 120), prev.warehouse), // 30s increment
          clay: Math.min(prev.clay + Math.floor(prev.clay_production / 120), prev.warehouse),
          iron: Math.min(prev.iron + Math.floor(prev.iron_production / 120), prev.warehouse),
          crop: Math.min(prev.crop + Math.floor(prev.crop_production / 120), prev.granary)
        }

        return { ...prev, ...increment }
      })
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [villageId, resources])

  // Periodic database sync (every 5 minutes)
  useEffect(() => {
    if (!villageId || !resources) return

    const interval = setInterval(async () => {
      await saveResources({
        wood: resources.wood,
        clay: resources.clay,
        iron: resources.iron,
        crop: resources.crop
      })
    }, 300000) // Sync every 5 minutes

    return () => clearInterval(interval)
  }, [villageId, resources, saveResources])

  // Load initial data
  useEffect(() => {
    loadVillageData()
  }, [loadVillageData])

  return {
    resources,
    buildings,
    loading,
    error,
    spendResources,
    saveResources,
    reloadData: loadVillageData
  }
}