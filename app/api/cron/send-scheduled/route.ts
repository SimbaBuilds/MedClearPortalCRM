import { createServiceClient } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  // Verify cron secret in production (Vercel sets this header automatically)
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceClient()
  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Cameron <cameron@medclearportal.com>"

  // Find all scheduled outreach entries that are due
  const now = new Date().toISOString()
  const { data: scheduled, error: fetchError } = await supabase
    .from("outreach_log")
    .select("*, leads!outreach_log_lead_id_fkey(email, physician)")
    .eq("status", "scheduled")
    .eq("channel", "email")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(20) // Process in batches to stay within function timeout

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!scheduled || scheduled.length === 0) {
    return NextResponse.json({ processed: 0, message: "No scheduled emails due" })
  }

  const results: { id: string; status: string; error?: string }[] = []

  for (const entry of scheduled) {
    const lead = entry.leads as { email: string | null; physician: string | null } | null
    const toEmail = lead?.email

    if (!toEmail) {
      // Mark as failed — no email address on lead
      await supabase
        .from("outreach_log")
        .update({ status: "failed" })
        .eq("id", entry.id)
      results.push({ id: entry.id, status: "failed", error: "No email on lead" })
      continue
    }

    try {
      const { data: emailResult, error: sendError } = await resend.emails.send({
        from: fromEmail,
        to: toEmail,
        subject: entry.subject || "(no subject)",
        text: entry.body || "",
      })

      if (sendError) {
        await supabase
          .from("outreach_log")
          .update({ status: "failed", sent_at: new Date().toISOString() })
          .eq("id", entry.id)
        results.push({ id: entry.id, status: "failed", error: sendError.message })
        continue
      }

      // Mark as sent
      await supabase
        .from("outreach_log")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          resend_message_id: emailResult?.id ?? null,
        })
        .eq("id", entry.id)

      // Update lead's last_contacted_at and advance step
      await supabase
        .from("leads")
        .update({
          status: "contacted",
          last_contacted_at: new Date().toISOString(),
          current_step_number: entry.step_number ?? 1,
        })
        .eq("id", entry.lead_id)

      results.push({ id: entry.id, status: "sent" })
    } catch (err) {
      await supabase
        .from("outreach_log")
        .update({ status: "failed", sent_at: new Date().toISOString() })
        .eq("id", entry.id)
      results.push({
        id: entry.id,
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  const sent = results.filter((r) => r.status === "sent").length
  const failed = results.filter((r) => r.status === "failed").length

  return NextResponse.json({ processed: results.length, sent, failed, results })
}
