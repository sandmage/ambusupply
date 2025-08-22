import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] [API] Fetching equipment assignments...")

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
    const vehicleId = searchParams.get("vehicle_id")

    let query = supabase
      .from("equipment_assignments")
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
        vehicles (
          id,
          vehicle_number,
          make,
          model
        ),
        locations (
          id,
          name
        ),
        profiles (
          full_name,
          email
        )
      `)
      .is("unassigned_at", null)
      .order("assigned_at", { ascending: false })

    if (equipmentId) {
      query = query.eq("equipment_id", equipmentId)
    }

    if (vehicleId) {
      query = query.eq("vehicle_id", vehicleId)
    }

    const { data: assignments, error: assignmentsError } = await query

    if (assignmentsError) {
      console.log("[v0] [API] Failed to fetch assignments:", assignmentsError.message)
      return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 })
    }

    console.log("[v0] [API] Assignments fetched successfully:", assignments?.length || 0)

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error("[v0] [API] Assignment fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] [API] Creating equipment assignment...")

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
    console.log("[v0] [API] Creating assignment for equipment:", body.equipment_id)

    // First, unassign any existing assignments for this equipment
    const { error: unassignError } = await supabase
      .from("equipment_assignments")
      .update({ unassigned_at: new Date().toISOString() })
      .eq("equipment_id", body.equipment_id)
      .is("unassigned_at", null)

    if (unassignError) {
      console.log("[v0] [API] Failed to unassign existing assignments:", unassignError.message)
    }

    // Create new assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from("equipment_assignments")
      .insert({
        equipment_id: body.equipment_id,
        vehicle_id: body.vehicle_id,
        location_id: body.location_id,
        assigned_by: user.id,
        assignment_notes: body.assignment_notes,
      })
      .select()
      .single()

    if (assignmentError) {
      console.log("[v0] [API] Failed to create assignment:", assignmentError.message)
      return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 })
    }

    console.log("[v0] [API] Assignment created successfully:", assignment.id)

    // Update equipment status and assignment fields
    const updateData: any = {
      status: body.vehicle_id ? "assigned" : "in_service",
      assigned_vehicle_id: body.vehicle_id,
      location_id: body.location_id,
    }

    const { error: equipmentUpdateError } = await supabase
      .from("equipment")
      .update(updateData)
      .eq("id", body.equipment_id)

    if (equipmentUpdateError) {
      console.log("[v0] [API] Equipment update failed (non-critical):", equipmentUpdateError.message)
    } else {
      console.log("[v0] [API] Equipment updated successfully")
    }

    return NextResponse.json({ success: true, assignment })
  } catch (error) {
    console.error("[v0] [API] Assignment creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("[v0] [API] Updating equipment assignment...")

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
    const assignmentId = body.id

    if (!assignmentId) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 })
    }

    console.log("[v0] [API] Updating assignment:", assignmentId)

    // End current assignment
    const { error: endAssignmentError } = await supabase
      .from("equipment_assignments")
      .update({ unassigned_at: new Date().toISOString() })
      .eq("id", assignmentId)

    if (endAssignmentError) {
      console.log("[v0] [API] Failed to end current assignment:", endAssignmentError.message)
      return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 })
    }

    // Create new assignment with updated details
    const { data: newAssignment, error: newAssignmentError } = await supabase
      .from("equipment_assignments")
      .insert({
        equipment_id: body.equipment_id,
        vehicle_id: body.vehicle_id,
        location_id: body.location_id,
        assigned_by: user.id,
        assignment_notes: body.assignment_notes,
      })
      .select()
      .single()

    if (newAssignmentError) {
      console.log("[v0] [API] Failed to create new assignment:", newAssignmentError.message)
      return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 })
    }

    console.log("[v0] [API] Assignment updated successfully")

    // Update equipment status and assignment fields
    const updateData: any = {
      status: body.vehicle_id ? "assigned" : "in_service",
      assigned_vehicle_id: body.vehicle_id,
      location_id: body.location_id,
    }

    const { error: equipmentUpdateError } = await supabase
      .from("equipment")
      .update(updateData)
      .eq("id", body.equipment_id)

    if (equipmentUpdateError) {
      console.log("[v0] [API] Equipment update failed (non-critical):", equipmentUpdateError.message)
    }

    return NextResponse.json({ success: true, assignment: newAssignment })
  } catch (error) {
    console.error("[v0] [API] Assignment update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log("[v0] [API] Unassigning equipment...")

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
    const assignmentId = searchParams.get("id")
    const equipmentId = searchParams.get("equipment_id")

    if (!assignmentId || !equipmentId) {
      return NextResponse.json({ error: "Assignment ID and Equipment ID are required" }, { status: 400 })
    }

    console.log("[v0] [API] Unassigning equipment:", equipmentId)

    // End assignment
    const { error: unassignError } = await supabase
      .from("equipment_assignments")
      .update({ unassigned_at: new Date().toISOString() })
      .eq("id", assignmentId)

    if (unassignError) {
      console.log("[v0] [API] Failed to unassign equipment:", unassignError.message)
      return NextResponse.json({ error: "Failed to unassign equipment" }, { status: 500 })
    }

    // Update equipment to remove assignment
    const { error: equipmentUpdateError } = await supabase
      .from("equipment")
      .update({
        status: "in_service",
        assigned_vehicle_id: null,
        location_id: null,
      })
      .eq("id", equipmentId)

    if (equipmentUpdateError) {
      console.log("[v0] [API] Equipment update failed:", equipmentUpdateError.message)
      return NextResponse.json({ error: "Failed to update equipment" }, { status: 500 })
    }

    console.log("[v0] [API] Equipment unassigned successfully")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] [API] Unassignment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
