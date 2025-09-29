'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

interface Village {
  id: string
  owner_id: string
  name: string
  x: number
  y: number
  wood: number
  clay: number
  iron: number
  crop: number
  wood_production: number
  clay_production: number
  iron_production: number
  crop_production: number
  population: number
  is_capital: boolean
  created_at: string
  updated_at: string
}

interface Building {
  id: string
  village_id: string
  building_type: number
  level: number
  slot_position: number
  is_under_construction: boolean
  construction_complete_at: string | null
}

interface ResourceField {
  id: string
  village_id: string
  field_type: 'wood' | 'clay' | 'iron' | 'crop'
  level: number
  position: number
}

export function useVillage() {
  const { user, profile } = useAuth()
  const [village, setVillage] = useState<Village | null>(null)
  const [buildings, setBuildings] = useState<Building[]>([])
  const [resourceFields, setResourceFields] = useState<ResourceField[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch village data
  const fetchVillage = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setError(null)

      // Fetch user's village
      const { data: villageData, error: villageError } = await supabase
        .from('villages')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (villageError) {
        console.error('Error fetching village:', villageError)
        setError('Failed to load village')
        return
      }

      if (!villageData) {
        setError('No village found')
        return
      }

      setVillage(villageData)

      // Fetch buildings for this village
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select('*')
        .eq('village_id', villageData.id)
        .order('slot_position')

      if (buildingsError) {
        console.error('Error fetching buildings:', buildingsError)
      } else {
        setBuildings(buildingsData || [])
      }

      // Fetch resource fields for this village
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('resource_fields')
        .select('*')
        .eq('village_id', villageData.id)
        .order('position')

      if (fieldsError) {
        console.error('Error fetching resource fields:', fieldsError)
      } else {
        setResourceFields(fieldsData || [])
      }

    } catch (err) {
      console.error('Error in fetchVillage:', err)
      setError('Failed to load village data')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Update village resources
  const updateResources = useCallback(async (updates: Partial<Pick<Village, 'wood' | 'clay' | 'iron' | 'crop' | 'wood_production' | 'clay_production' | 'iron_production' | 'crop_production'>>) => {
    if (!village) return false

    try {
      const { data, error } = await supabase
        .from('villages')
        .update(updates)
        .eq('id', village.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating resources:', error)
        return false
      }

      setVillage(data)
      return true
    } catch (err) {
      console.error('Error in updateResources:', err)
      return false
    }
  }, [village])

  // Upgrade building
  const upgradeBuilding = useCallback(async (slotPosition: number, buildingType: number) => {
    if (!village) return false

    try {
      // Check if building exists at this position
      const existingBuilding = buildings.find(b => b.slot_position === slotPosition)

      if (existingBuilding) {
        // Upgrade existing building
        const { data, error } = await supabase
          .from('buildings')
          .update({
            level: existingBuilding.level + 1,
            is_under_construction: true,
            construction_complete_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
          })
          .eq('id', existingBuilding.id)
          .select()
          .single()

        if (error) {
          console.error('Error upgrading building:', error)
          return false
        }

        // Update local state
        setBuildings(prev => prev.map(b => b.id === existingBuilding.id ? data : b))
      } else {
        // Create new building
        const { data, error } = await supabase
          .from('buildings')
          .insert({
            village_id: village.id,
            building_type: buildingType,
            level: 1,
            slot_position: slotPosition,
            is_under_construction: true,
            construction_complete_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating building:', error)
          return false
        }

        // Update local state
        setBuildings(prev => [...prev, data])
      }

      return true
    } catch (err) {
      console.error('Error in upgradeBuilding:', err)
      return false
    }
  }, [village, buildings])

  // Upgrade resource field
  const upgradeResourceField = useCallback(async (position: number) => {
    if (!village) return false

    try {
      const field = resourceFields.find(f => f.position === position)
      if (!field) return false

      const { data, error } = await supabase
        .from('resource_fields')
        .update({ level: field.level + 1 })
        .eq('id', field.id)
        .select()
        .single()

      if (error) {
        console.error('Error upgrading resource field:', error)
        return false
      }

      // Update local state
      setResourceFields(prev => prev.map(f => f.id === field.id ? data : f))

      // Recalculate village production
      await recalculateProduction()

      return true
    } catch (err) {
      console.error('Error in upgradeResourceField:', err)
      return false
    }
  }, [village, resourceFields])

  // Recalculate production based on resource field levels
  const recalculateProduction = useCallback(async () => {
    if (!village) return

    // Calculate production from resource fields
    let wood_production = 6 // Base production
    let clay_production = 6
    let iron_production = 6
    let crop_production = 6

    resourceFields.forEach(field => {
      const productionIncrease = field.level * 3 // 3 per level

      switch (field.field_type) {
        case 'wood':
          wood_production += productionIncrease
          break
        case 'clay':
          clay_production += productionIncrease
          break
        case 'iron':
          iron_production += productionIncrease
          break
        case 'crop':
          crop_production += productionIncrease
          break
      }
    })

    // Update village production in database
    await updateResources({
      wood_production,
      clay_production,
      iron_production,
      crop_production
    })
  }, [village, resourceFields, updateResources])

  // Resource production timer (every minute)
  useEffect(() => {
    if (!village) return

    const interval = setInterval(async () => {
      const now = Date.now()
      const lastUpdate = new Date(village.updated_at).getTime()
      const minutesSinceUpdate = Math.floor((now - lastUpdate) / (1000 * 60))

      if (minutesSinceUpdate > 0) {
        // Calculate resource increase
        const woodIncrease = Math.floor(village.wood_production * minutesSinceUpdate / 60) // per hour to per minute
        const clayIncrease = Math.floor(village.clay_production * minutesSinceUpdate / 60)
        const ironIncrease = Math.floor(village.iron_production * minutesSinceUpdate / 60)
        const cropIncrease = Math.floor(village.crop_production * minutesSinceUpdate / 60)

        // Update resources
        await updateResources({
          wood: village.wood + woodIncrease,
          clay: village.clay + clayIncrease,
          iron: village.iron + ironIncrease,
          crop: village.crop + cropIncrease
        })
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [village, updateResources])

  // Load village data when user is available
  useEffect(() => {
    if (user) {
      fetchVillage()
    }
  }, [user, fetchVillage])

  return {
    village,
    buildings,
    resourceFields,
    loading,
    error,
    updateResources,
    upgradeBuilding,
    upgradeResourceField,
    refreshVillage: fetchVillage
  }
}