import { createServerClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/client"
import type { InventoryItem, Location, Organization, User } from "@/lib/types"

export class DatabaseQueries {
  private static getClient(isServer = false) {
    return isServer ? createServerClient() : createClient()
  }

  // Inventory queries
  static async getInventoryItems(organizationId: string, isServer = false): Promise<InventoryItem[]> {
    const supabase = this.getClient(isServer)
    const { data, error } = await supabase
      .from("inventory_items")
      .select(`
        *,
        location:locations(*),
        storage_unit:storage_units(*)
      `)
      .eq("organization_id", organizationId)
      .order("name")

    if (error) throw error
    return data || []
  }

  // Location queries
  static async getLocations(organizationId: string, isServer = false): Promise<Location[]> {
    const supabase = this.getClient(isServer)
    const { data, error } = await supabase
      .from("locations")
      .select(`
        *,
        storage_units(*)
      `)
      .eq("organization_id", organizationId)
      .order("name")

    if (error) throw error
    return data || []
  }

  // Organization queries
  static async getOrganization(id: string, isServer = false): Promise<Organization | null> {
    const supabase = this.getClient(isServer)
    const { data, error } = await supabase.from("organizations").select("*").eq("id", id).single()

    if (error) throw error
    return data
  }

  // User queries
  static async getCurrentUser(isServer = false): Promise<User | null> {
    const supabase = this.getClient(isServer)
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) return null

    const { data: profile, error: profileError } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (profileError) throw profileError
    return profile
  }
}
