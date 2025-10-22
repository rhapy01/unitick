import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || (!serviceKey && !anonKey)) {
    return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 })
  }

  // Prefer service key to bypass RLS; otherwise fall back to anon (will return only allowed rows)
  const supabase = createSupabaseClient(supabaseUrl, serviceKey || anonKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await supabase.from("vendors").select("*")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sort: verified first, then rating desc, likes desc, ratings desc
  const sorted = (data || []).sort((a: any, b: any) => {
    if (a.is_verified && !b.is_verified) return -1
    if (!a.is_verified && b.is_verified) return 1
    if ((a.average_rating || 0) !== (b.average_rating || 0)) return (b.average_rating || 0) - (a.average_rating || 0)
    if ((a.like_count || 0) !== (b.like_count || 0)) return (b.like_count || 0) - (a.like_count || 0)
    return (b.rating_count || 0) - (a.rating_count || 0)
  })

  return NextResponse.json(sorted)
}


