import { createServiceClient } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .eq("id", true)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = createServiceClient()
  const body = await req.json()
  const updates: Record<string, unknown> = {}
  if (typeof body.followup_business_days === "number") {
    updates.followup_business_days = body.followup_business_days
  }
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from("app_settings")
    .update(updates)
    .eq("id", true)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
