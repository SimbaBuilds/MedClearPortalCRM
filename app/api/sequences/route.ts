import { createServiceClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = createServiceClient()

  const { data: sequences, error } = await supabase
    .from("email_sequences")
    .select("*, steps:sequence_steps(*)")
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sort steps within each sequence
  for (const seq of sequences ?? []) {
    if (seq.steps) {
      seq.steps.sort((a: { step_number: number }, b: { step_number: number }) => a.step_number - b.step_number)
    }
  }

  return NextResponse.json(sequences)
}
