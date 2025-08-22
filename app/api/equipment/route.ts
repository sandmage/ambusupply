import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] [API] Starting equipment creation...")

    const supabase = createServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] [API] Authentication failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] [API] User authenticated:", user.id)

    const body = await request.json()
    console.log("[v0] [API] Creating equipment:", {
      equipment_type_id: body.equipment_type_id,
      serial_number: body.serial_number,
      status: body.status,
    })

    // Insert equipment into database
    const { data: equipment, error: equipmentError } = await supabase
      .from("equipment")
      .insert({
        equipment_type_id: body.equipment_type_id,
        serial_number: body.serial_number,
        asset_tag: body.asset_tag,
        status: body.status || "in_service",
        purchase_date: body.purchase_date,
        purchase_cost: body.purchase_cost,
        warranty_expiration: body.warranty_expiration,
        location_id: body.location_id,
        assigned_vehicle_id: body.assigned_vehicle_id,
        notes: body.notes,
      })
      .select()
      .single()

    if (equipmentError) {
      console.log("[v0] [API] Failed to create equipment:", equipmentError.message)
      return NextResponse.json({ error: "Failed to create equipment" }, { status: 500 })
    }

    console.log("[v0] [API] Equipment created successfully:", equipment.id)

    // Create equipment assignment record if assigned to vehicle or location
    if (body.assigned_vehicle_id || body.location_id) {
      try {
        const { error: assignmentError } = await supabase.from("equipment_assignments").insert({
          equipment_id: equipment.id,
          vehicle_id: body.assigned_vehicle_id,
          location_id: body.location_id,
          assigned_by: user.id,
          assignment_notes: "Initial assignment during equipment creation",
        })

        if (assignmentError) {
          console.log("[v0] [API] Assignment creation failed (non-critical):", assignmentError.message)
        } else {
          console.log("[v0] [API] Assignment record created successfully")
        }
      } catch (assignmentError) {
        console.log("[v0] [API] Assignment creation error (non-critical):", assignmentError)
      }
    }

    return NextResponse.json({ success: true, equipment })
  } catch (error) {
    console.error("[v0] [API] Equipment creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("[v0] [API] Starting equipment update...")

    const supabase = createServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] [API] Authentication failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const equipmentId = body.id

    if (!equipmentId) {
      return NextResponse.json({ error: "Equipment ID is required" }, { status: 400 })
    }

    console.log("[v0] [API] Updating equipment:", equipmentId)

    // Update equipment in database
    const { data: equipment, error: equipmentError } = await supabase
      .from("equipment")
      .update({
        equipment_type_id: body.equipment_type_id,
        serial_number: body.serial_number,
        asset_tag: body.asset_tag,
        status: body.status,
        purchase_date: body.purchase_date,
        purchase_cost: body.purchase_cost,
        warranty_expiration: body.warranty_expiration,
        location_id: body.location_id,
        assigned_vehicle_id: body.assigned_vehicle_id,
        notes: body.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", equipmentId)
      .select()
      .single()

    if (equipmentError) {
      console.log("[v0] [API] Failed to update equipment:", equipmentError.message)
      return NextResponse.json({ error: "Failed to update equipment" }, { status: 500 })
    }

    console.log("[v0] [API] Equipment updated successfully")

    return NextResponse.json({ success: true, equipment })
  } catch (error) {
    console.error("[v0] [API] Equipment update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
