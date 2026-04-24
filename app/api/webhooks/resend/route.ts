import { createServiceClient } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"
import { Webhook } from "svix"

export const dynamic = "force-dynamic"

// Resend webhook event types we care about
const EVENT_TO_STATUS: Record<string, string> = {
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "bounced", // spam complaint → treat as bounce
}

export async function POST(req: NextRequest) {
  const signingSecret = process.env.RESEND_WEBHOOK_SECRET
  if (!signingSecret) {
    console.error("RESEND_WEBHOOK_SECRET not configured")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  // Verify webhook signature via Svix
  const body = await req.text()
  const svixId = req.headers.get("svix-id")
  const svixTimestamp = req.headers.get("svix-timestamp")
  const svixSignature = req.headers.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing Svix headers" }, { status: 400 })
  }

  let event: { type: string; data: { email_id: string; [key: string]: unknown } }
  try {
    const wh = new Webhook(signingSecret)
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof event
  } catch {
    console.error("Webhook signature verification failed")
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const newStatus = EVENT_TO_STATUS[event.type]
  if (!newStatus) {
    // Event type we don't track — acknowledge and move on
    return NextResponse.json({ ignored: true })
  }

  const resendMessageId = event.data.email_id
  if (!resendMessageId) {
    return NextResponse.json({ error: "No email_id in payload" }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Find the outreach log entry by resend_message_id
  const { data: logEntry, error: fetchError } = await supabase
    .from("outreach_log")
    .select("id, lead_id, status")
    .eq("resend_message_id", resendMessageId)
    .single()

  if (fetchError || !logEntry) {
    // Message not in our system — could be from a different project
    console.warn(`No outreach_log entry for resend message ${resendMessageId}`)
    return NextResponse.json({ skipped: true })
  }

  // Only advance status forward (don't go from "opened" back to "delivered")
  const STATUS_RANK: Record<string, number> = {
    sent: 0,
    delivered: 1,
    opened: 2,
    clicked: 3,
    replied: 4,
    bounced: 5, // terminal
    failed: 5,  // terminal
  }

  const currentRank = STATUS_RANK[logEntry.status] ?? 0
  const newRank = STATUS_RANK[newStatus] ?? 0

  if (newRank <= currentRank && newStatus !== "bounced") {
    // Don't regress status (but always allow bounce to override)
    return NextResponse.json({ already: logEntry.status })
  }

  // Update outreach log status
  const { error: updateError } = await supabase
    .from("outreach_log")
    .update({ status: newStatus })
    .eq("id", logEntry.id)

  if (updateError) {
    console.error("Failed to update outreach_log:", updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Side effects on specific events
  if (newStatus === "bounced") {
    // Mark lead so we don't keep emailing a dead address
    await supabase
      .from("leads")
      .update({ status: "closed_lost" })
      .eq("id", logEntry.lead_id)

    // Cancel remaining scheduled emails for this lead
    await supabase
      .from("outreach_log")
      .update({ status: "cancelled" })
      .eq("lead_id", logEntry.lead_id)
      .eq("status", "scheduled")
  }

  return NextResponse.json({ updated: newStatus })
}
