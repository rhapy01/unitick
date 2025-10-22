import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Enforce a simple size cap (1MB for listing images)
    if (file.size > 1 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 1MB)" }, { status: 413 })
    }

    // Prefer Vercel Blob if token available
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN
    const useVercelBlob = !!blobToken

    if (useVercelBlob) {
      try {
        const blob = await put(file.name, file, {
          access: "public",
          token: blobToken,
          addRandomSuffix: true,
        })

        return NextResponse.json({
          url: blob.url,
          filename: file.name,
          size: file.size,
          type: file.type,
          storage: "vercel-blob",
        })
      } catch (err: any) {
        return NextResponse.json({ error: err?.message || "Blob upload failed" }, { status: 500 })
      }
    }

    // Fallback: Supabase Storage (expects an existing bucket: listing-images)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "No upload backend configured" }, { status: 500 })
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const fileExt = file.name.split(".").pop() || "bin"
    const objectPath = `listings/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from("listing-images")
      .upload(objectPath, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: publicUrl } = supabase.storage.from("listing-images").getPublicUrl(objectPath)

    return NextResponse.json({
      url: publicUrl.publicUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
      storage: "supabase-storage",
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
