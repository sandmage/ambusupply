import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

function validateSupabaseConfig(url: string, key: string) {
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables in API route")
  }

  // Check if URL is properly formatted
  if (!url.match(/^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/)) {
    throw new Error(`Invalid Supabase URL format in API route: ${url}`)
  }

  // Check if key is properly formatted
  if (key.length < 100) {
    throw new Error("Invalid Supabase API key format in API route")
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate main environment variables
validateSupabaseConfig(supabaseUrl, supabaseAnonKey)

// Validate service role key if present
if (serviceRoleKey && serviceRoleKey.length < 100) {
  throw new Error("Invalid Supabase service role key format")
}

console.log("[v0] API Route - Environment variables check:", {
  supabaseUrl: !!supabaseUrl,
  anonKey: !!supabaseAnonKey,
  serviceRoleKey: !!serviceRoleKey,
})

const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] GET /api/storage-unit-types - Starting request")

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[v0] Auth check:", { user: !!user, error: !!authError })

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clientToUse = supabaseAdmin || supabase
    console.log("[v0] Using client:", supabaseAdmin ? "admin" : "regular")

    // Get user's profile to check organization
    const { data: profile, error: profileError } = await clientToUse
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single()

    console.log("[v0] Profile check:", { profile: !!profile, error: !!profileError })

    if (profileError || !profile?.organization_id) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Fetch storage unit types
    const { data: storageTypes, error } = await clientToUse
      .from("storage_unit_types")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("name")

    console.log("[v0] Storage types query:", { count: storageTypes?.length, error: !!error })

    if (error) {
      console.log("[v0] Storage types error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: storageTypes || [] })
  } catch (error: any) {
    console.log("[v0] GET error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] POST /api/storage-unit-types - Starting request")

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clientToUse = supabaseAdmin || supabase

    // Get user's profile to check organization and role
    const { data: profile, error: profileError } = await clientToUse
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

    console.log("[v0] Creating storage unit type:", { name, capacity_type, organization_id: profile.organization_id })

    // Create storage unit type
    const { data, error } = await clientToUse
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
      console.log("[v0] Insert error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Storage unit type created successfully")
    return NextResponse.json({ data })
  } catch (error: any) {
    console.log("[v0] POST error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("[v0] PUT /api/storage-unit-types - Starting request")

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clientToUse = supabaseAdmin || supabase

    // Get user's profile to check organization and role
    const { data: profile, error: profileError } = await clientToUse
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

    console.log("[v0] Updating storage unit type:", {
      id,
      name,
      capacity_type,
      organization_id: profile.organization_id,
    })

    // Update storage unit type
    const { data, error } = await clientToUse
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
      console.log("[v0] Update error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Storage unit type updated successfully")
    return NextResponse.json({ data })
  } catch (error: any) {
    console.log("[v0] PUT error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log("[v0] DELETE /api/storage-unit-types - Starting request")

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clientToUse = supabaseAdmin || supabase

    // Get user's profile to check organization and role
    const { data: profile, error: profileError } = await clientToUse
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

    console.log("[v0] Deleting storage unit type:", { id, organization_id: profile.organization_id })

    // Delete storage unit type
    const { error } = await clientToUse
      .from("storage_unit_types")
      .delete()
      .eq("id", id)
      .eq("organization_id", profile.organization_id)

    if (error) {
      console.log("[v0] Delete error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Storage unit type deleted successfully")
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.log("[v0] DELETE error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
