import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] [API] Starting medication creation...")

    // Create Supabase client
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error("[v0] [API] Authentication failed:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] [API] User authenticated:", user.id)

    // Parse request body
    const body = await request.json()
    const {
      name,
      description,
      quantity,
      unit_of_measure,
      expiration_date,
      lot_number,
      location_id,
      storage_unit_id,
      min_par_level,
      max_par_level,
      notes,
    } = body

    console.log("[v0] [API] Creating medication:", { name, quantity, location_id })

    // Insert medication into inventory_items table
    const { data: medication, error: insertError } = await supabase
      .from("inventory_items")
      .insert({
        name,
        description: description || null,
        quantity: Number.parseInt(quantity) || 0,
        min_par_level: Number.parseInt(min_par_level) || 0,
        unit_of_measure: unit_of_measure || "each",
        expiration_date: expiration_date || null,
        lot_number: lot_number || null,
        location_id,
        storage_unit_id: storage_unit_id || null,
        category: "medication", // Mark as medication category
        notes: notes || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] [API] Failed to create medication:", insertError)
      return NextResponse.json({ error: "Failed to create medication", details: insertError.message }, { status: 500 })
    }

    console.log("[v0] [API] Medication created successfully:", medication.id)

    // Create initial transaction record
    const { error: transactionError } = await supabase.from("inventory_transactions").insert({
      item_id: medication.id,
      transaction_type: "restock",
      quantity_change: Number.parseInt(quantity) || 0,
      quantity_after: Number.parseInt(quantity) || 0,
      notes: "Initial medication stock",
      created_by: user.id,
    })

    if (transactionError) {
      console.error("[v0] [API] Failed to create transaction:", transactionError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      medication,
      message: "Medication created successfully",
    })
  } catch (error) {
    console.error("[v0] [API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
