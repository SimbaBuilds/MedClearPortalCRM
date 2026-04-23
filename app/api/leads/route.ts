import { createServiceClient } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const url = req.nextUrl.searchParams

  let query = supabase.from("leads").select("*")

  const status = url.get("status")
  if (status && status !== "all") query = query.eq("status", status)

  const metro = url.get("metro")
  if (metro && metro !== "all") query = query.eq("metro", metro)

  const tier = url.get("tier")
  if (tier && tier !== "all") query = query.eq("tier", tier)

  const search = url.get("search")
  if (search) {
    query = query.or(
      `physician.ilike.%${search}%,associated_medspa.ilike.%${search}%,notes.ilike.%${search}%,medspa_location.ilike.%${search}%`
    )
  }

  query = query.order("tier", { ascending: true }).order("physician", { ascending: true })

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = createServiceClient()
  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const { data, error } = await supabase
    .from("leads")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
