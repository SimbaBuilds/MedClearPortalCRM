import { createServiceClient } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Get outreach log for a lead
export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const leadId = req.nextUrl.searchParams.get("lead_id")

  if (!leadId) return NextResponse.json({ error: "lead_id required" }, { status: 400 })

  const { data, error } = await supabase
    .from("outreach_log")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// Log a manual outreach action or enroll in sequence
export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const body = await req.json()

  // If enrolling in a sequence
  if (body.action === "enroll_sequence") {
    const { lead_id, sequence_id } = body

    // Get sequence steps
    const { data: steps } = await supabase
      .from("sequence_steps")
      .select("*")
      .eq("sequence_id", sequence_id)
      .order("step_number")

    if (!steps || steps.length === 0) {
      return NextResponse.json({ error: "Sequence has no steps" }, { status: 400 })
    }

    // Schedule all steps
    const now = new Date()
    const logs = steps.map((step) => {
      const scheduledDate = new Date(now)
      scheduledDate.setDate(scheduledDate.getDate() + step.delay_days)
      return {
        lead_id,
        sequence_id,
        step_number: step.step_number,
        channel: step.channel,
        subject: step.subject_template,
        body: step.body_template,
        status: "scheduled" as const,
        scheduled_for: scheduledDate.toISOString(),
        sent_at: null,
      }
    })

    const { error: logError } = await supabase.from("outreach_log").insert(logs)
    if (logError) return NextResponse.json({ error: logError.message }, { status: 500 })

    // Update lead status
    const { error: leadError } = await supabase
      .from("leads")
      .update({
        status: "sequence_active",
        current_sequence_id: sequence_id,
        current_step_number: 1,
        next_scheduled_at: logs[0].scheduled_for,
      })
      .eq("id", lead_id)

    if (leadError) return NextResponse.json({ error: leadError.message }, { status: 500 })

    return NextResponse.json({ scheduled: logs.length })
  }

  // If sending a manual email now
  if (body.action === "send_email") {
    const { lead_id, subject, body: emailBody, to_email } = body

    // TODO: Actually send via Resend when API key is configured
    // For now, just log it
    const logEntry = {
      lead_id,
      channel: "email" as const,
      subject,
      body: emailBody,
      status: "sent" as const,
      sent_at: new Date().toISOString(),
    }

    const { error: logError } = await supabase.from("outreach_log").insert(logEntry)
    if (logError) return NextResponse.json({ error: logError.message }, { status: 500 })

    // Update lead
    await supabase
      .from("leads")
      .update({ status: "contacted", last_contacted_at: new Date().toISOString() })
      .eq("id", lead_id)

    return NextResponse.json({ sent: true, note: "Resend integration pending — logged only" })
  }

  // Manual note
  if (body.action === "log_note") {
    const { lead_id, channel, body: noteBody } = body

    const { error } = await supabase.from("outreach_log").insert({
      lead_id,
      channel: channel || "manual_note",
      body: noteBody,
      status: "sent",
      sent_at: new Date().toISOString(),
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ logged: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
