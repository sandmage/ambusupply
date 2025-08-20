import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's profile to check organization
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Fetch storage unit types for the user's organization
    const { data: storageTypes, error } = await supabase
      .from("storage_unit_types")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("name")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: storageTypes })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's profile to check organization and role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Check if user is admin
    if (profile.role !== "admin") {
      return NextResponse.json({ error: "Only administrators can manage storage unit types" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, capacity_type, default_capacity } = body

    // Create storage unit type with user's organization_id
    const { data, error } = await supabase
      .from("storage_unit_types")
      .insert([
        {
          name,
          description,
          capacity_type,
          default_capacity,
          organization_id: profile.organization_id,
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's profile to check organization and role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Check if user is admin
    if (profile.role !== "admin") {
      return NextResponse.json({ error: "Only administrators can manage storage unit types" }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, description, capacity_type, default_capacity } = body

    // Update storage unit type (only if it belongs to user's organization)
    const { data, error } = await supabase
      .from("storage_unit_types")
      .update({
        name,
        description,
        capacity_type,
        default_capacity,
      })
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's profile to check organization and role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Check if user is admin
    if (profile.role !== "admin") {
      return NextResponse.json({ error: "Only administrators can manage storage unit types" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Storage unit type ID is required" }, { status: 400 })
    }

    // Delete storage unit type (only if it belongs to user's organization)
    const { error } = await supabase
      .from("storage_unit_types")
      .delete()
      .eq("id", id)
      .eq("organization_id", profile.organization_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
