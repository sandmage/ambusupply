import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get("vehicle_id")
    const limit = searchParams.get("limit") || "50"

    let query = supabase
      .from("vehicle_inventory_transactions")
      .select(`
        *,
        vehicle_inventory_item:vehicle_inventory_items(
          *,
          inventory_item:inventory_items(name, description, category, unit_of_measure),
          storage_unit:vehicle_storage_units(name, unit_type),
          storage_location:vehicle_storage_locations(name, location_type)
        ),
        profile:profiles(full_name, email)
      `)
      .order("performed_at", { ascending: false })
      .limit(Number.parseInt(limit))

    if (vehicleId) {
      query = query.eq("vehicle_inventory_item.vehicle_id", vehicleId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
    }

    return NextResponse.json({ transactions: data })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      vehicle_inventory_item_id,
      transaction_type,
      quantity_change,
      quantity_before,
      quantity_after,
      reason,
      notes,
    } = body

    // Validate required fields
    if (!vehicle_inventory_item_id || !transaction_type || quantity_change === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from("vehicle_inventory_transactions")
      .insert([
        {
          vehicle_inventory_item_id,
          transaction_type,
          quantity_change: Number.parseInt(quantity_change),
          quantity_before: Number.parseInt(quantity_before),
          quantity_after: Number.parseInt(quantity_after),
          reason: reason || null,
          notes: notes || null,
          performed_by: user.id,
        },
      ])
      .select()
      .single()

    if (transactionError) {
      console.error("Transaction creation error:", transactionError)
      return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
    }

    // Update inventory item quantity
    const { error: updateError } = await supabase
      .from("vehicle_inventory_items")
      .update({ current_quantity: Number.parseInt(quantity_after) })
      .eq("id", vehicle_inventory_item_id)

    if (updateError) {
      console.error("Inventory update error:", updateError)
      return NextResponse.json({ error: "Failed to update inventory quantity" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Transaction created successfully",
      transaction,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
