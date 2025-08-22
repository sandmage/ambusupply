import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// POST /api/mobile/upload - Handle file uploads from mobile (photos, signatures)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verify authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const fileType = formData.get("type") as string // "photo" or "signature"
    const submissionId = formData.get("submission_id") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!["photo", "signature"].includes(fileType)) {
      return NextResponse.json({ error: "Invalid file type. Must be 'photo' or 'signature'" }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size too large. Maximum 10MB allowed" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file format. Only JPEG, PNG, and WebP allowed" }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop()
    const fileName = `${fileType}_${submissionId}_${timestamp}.${fileExtension}`
    const filePath = `daily-checks/${session.user.id}/${fileName}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("daily-check-files")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 400 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("daily-check-files").getPublicUrl(filePath)

    // If this is for a specific submission, update the submission record
    if (submissionId) {
      if (fileType === "signature") {
        await supabase
          .from("daily_check_submissions")
          .update({ signature_data: publicUrl })
          .eq("id", submissionId)
          .eq("submitted_by", session.user.id)
      } else if (fileType === "photo") {
        // Add photo URL to issues or create a new issue record
        // This would depend on your specific implementation
      }
    }

    return NextResponse.json({
      success: true,
      file: {
        name: fileName,
        url: publicUrl,
        type: fileType,
        size: file.size,
      },
      message: "File uploaded successfully",
    })
  } catch (error) {
    console.error("File upload API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
