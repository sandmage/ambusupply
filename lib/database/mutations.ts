import { createServerClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/client"
import type { InventoryItem, Location } from "@/lib/types"

export class DatabaseMutations {
  private static async getClient(isServer = false) {
    return isServer ? await createServerClient() : createClient()
  }

  // Inventory mutations
  static async createInventoryItem(
    item: Omit<InventoryItem, "id" | "created_at" | "updated_at">,
    isServer = false,
  ): Promise<InventoryItem> {
    const supabase = await this.getClient(isServer)
    const { data, error } = await supabase.from("inventory_items").insert(item).select().single()

    if (error) throw error
    return data
  }

  static async updateInventoryItem(
    id: string,
    updates: Partial<InventoryItem>,
    isServer = false,
  ): Promise<InventoryItem> {
    const supabase = await this.getClient(isServer)
    const { data, error } = await supabase.from("inventory_items").update(updates).eq("id", id).select().single()

    if (error) throw error
    return data
  }

  static async deleteInventoryItem(id: string, isServer = false): Promise<void> {
    const supabase = await this.getClient(isServer)
    const { error } = await supabase.from("inventory_items").delete().eq("id", id)

    if (error) throw error
  }

  // Location mutations
  static async createLocation(
    location: Omit<Location, "id" | "created_at" | "updated_at">,
    isServer = false,
  ): Promise<Location> {
    const supabase = await this.getClient(isServer)
    const { data, error } = await supabase.from("locations").insert(location).select().single()

    if (error) throw error
    return data
  }

  static async updateLocation(id: string, updates: Partial<Location>, isServer = false): Promise<Location> {
    const supabase = await this.getClient(isServer)
    const { data, error } = await supabase.from("locations").update(updates).eq("id", id).select().single()

    if (error) throw error
    return data
  }
}
