import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] [API] Fetching equipment maintenance records...")

    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] [API] Authentication failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const equipmentId = searchParams.get("equipment_id")

    let query = supabase
      .from("equipment_maintenance")
      .select(`
        *,
        equipment (
          id,
          serial_number,
          equipment_types (
            name,
            manufacturer,
            model
          )
        ),
        profiles (
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false })

    if (equipmentId) {
      query = query.eq("equipment_id", equipmentId)
    }

    const { data: maintenanceRecords, error: maintenanceError } = await query

    if (maintenanceError) {
      console.log("[v0] [API] Failed to fetch maintenance records:", maintenanceError.message)
      return NextResponse.json({ error: "Failed to fetch maintenance records" }, { status: 500 })
    }

    console.log("[v0] [API] Maintenance records fetched successfully:", maintenanceRecords?.length || 0)

    return NextResponse.json({ maintenanceRecords })
  } catch (error) {
    console.error("[v0] [API] Maintenance fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] [API] Creating maintenance record...")

    const supabase = await createServerClient()

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
    console.log("[v0] [API] Creating maintenance record for equipment:", body.equipment_id)

    // Insert maintenance record into database
    const { data: maintenanceRecord, error: maintenanceError } = await supabase
      .from("equipment_maintenance")
      .insert({
        equipment_id: body.equipment_id,
        maintenance_type: body.maintenance_type,
        description: body.description,
        scheduled_date: body.scheduled_date,
        completed_date: body.completed_date,
        cost: body.cost,
        service_provider: body.service_provider,
        parts_replaced: body.parts_replaced,
        next_service_due: body.next_service_due,
        maintenance_notes: body.maintenance_notes,
        performed_by: user.id,
      })
      .select()
      .single()

    if (maintenanceError) {
      console.log("[v0] [API] Failed to create maintenance record:", maintenanceError.message)
      return NextResponse.json({ error: "Failed to create maintenance record" }, { status: 500 })
    }

    console.log("[v0] [API] Maintenance record created successfully:", maintenanceRecord.id)

    // Update equipment's next maintenance due date if provided
    if (body.next_service_due) {
      try {
        const { error: equipmentUpdateError } = await supabase
          .from("equipment")
          .update({
            next_maintenance_due: body.next_service_due,
            last_maintenance_date: body.completed_date || new Date().toISOString().split("T")[0],
          })
          .eq("id", body.equipment_id)

        if (equipmentUpdateError) {
          console.log("[v0] [API] Equipment update failed (non-critical):", equipmentUpdateError.message)
        } else {
          console.log("[v0] [API] Equipment maintenance dates updated successfully")
        }
      } catch (equipmentError) {
        console.log("[v0] [API] Equipment update error (non-critical):", equipmentError)
      }
    }

    return NextResponse.json({ success: true, maintenanceRecord })
  } catch (error) {
    console.error("[v0] [API] Maintenance creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("[v0] [API] Updating maintenance record...")

    const supabase = await createServerClient()

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
    const maintenanceId = body.id

    if (!maintenanceId) {
      return NextResponse.json({ error: "Maintenance record ID is required" }, { status: 400 })
    }

    console.log("[v0] [API] Updating maintenance record:", maintenanceId)

    // Update maintenance record in database
    const { data: maintenanceRecord, error: maintenanceError } = await supabase
      .from("equipment_maintenance")
      .update({
        maintenance_type: body.maintenance_type,
        description: body.description,
        scheduled_date: body.scheduled_date,
        completed_date: body.completed_date,
        cost: body.cost,
        service_provider: body.service_provider,
        parts_replaced: body.parts_replaced,
        next_service_due: body.next_service_due,
        maintenance_notes: body.maintenance_notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", maintenanceId)
      .select()
      .single()

    if (maintenanceError) {
      console.log("[v0] [API] Failed to update maintenance record:", maintenanceError.message)
      return NextResponse.json({ error: "Failed to update maintenance record" }, { status: 500 })
    }

    console.log("[v0] [API] Maintenance record updated successfully")

    // Update equipment's next maintenance due date if provided
    if (body.next_service_due) {
      try {
        const { error: equipmentUpdateError } = await supabase
          .from("equipment")
          .update({
            next_maintenance_due: body.next_service_due,
            last_maintenance_date: body.completed_date || new Date().toISOString().split("T")[0],
          })
          .eq("id", body.equipment_id)

        if (equipmentUpdateError) {
          console.log("[v0] [API] Equipment update failed (non-critical):", equipmentUpdateError.message)
        }
      } catch (equipmentError) {
        console.log("[v0] [API] Equipment update error (non-critical):", equipmentError)
      }
    }

    return NextResponse.json({ success: true, maintenanceRecord })
  } catch (error) {
    console.error("[v0] [API] Maintenance update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
