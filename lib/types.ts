export type LeadStatus =
  | "new"
  | "contacted"
  | "practice_email_obtained"
  | "sequence_active"
  | "replied"
  | "meeting_booked"
  | "closed_won"
  | "closed_lost"
  | "unsubscribed"
  | "low_priority"

export interface Lead {
  id: string
  tier: string | null
  metro: string | null
  physician: string | null
  credentials: string | null
  own_practice: string | null
  associated_medspa: string | null
  medspa_owner_operator: string | null
  medspa_location: string | null
  phone: string | null
  practice_email: string | null
  website: string | null
  source_url: string | null
  notes: string | null
  status: LeadStatus
  email: string | null
  linkedin_url: string | null
  linkedin_not_found: boolean
  linkedin_connection_requested: boolean
  linkedin_connected: boolean
  linkedin_messaged: boolean
  current_sequence_id: string | null
  current_step_number: number
  last_contacted_at: string | null
  next_scheduled_at: string | null
  next_followup_at: string | null
  next_followup_manual_override: boolean
  tags: string[]
  created_at: string
  updated_at: string
  latest_note: string | null
  latest_note_at: string | null
}

export interface EmailSequence {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  steps?: SequenceStep[]
}

export interface SequenceStep {
  id: string
  sequence_id: string
  step_number: number
  delay_days: number
  subject_template: string
  body_template: string
  channel: "email" | "linkedin" | "phone"
  created_at: string
}

export interface OutreachLogEntry {
  id: string
  lead_id: string
  sequence_id: string | null
  step_number: number | null
  channel: "email" | "linkedin" | "phone" | "manual_note"
  subject: string | null
  body: string | null
  status: "sent" | "delivered" | "opened" | "clicked" | "replied" | "bounced" | "failed" | "scheduled" | "cancelled"
  scheduled_for: string | null
  sent_at: string | null
  resend_message_id: string | null
  created_at: string
}

export type ScheduledTaskType = "sms"
export type ScheduledTaskStatus = "scheduled" | "completed" | "failed" | "cancelled"

export interface ScheduledTask {
  id: string
  task_type: ScheduledTaskType
  payload: Record<string, unknown>
  scheduled_for: string
  status: ScheduledTaskStatus
  attempts: number
  last_error: string | null
  last_response: Record<string, unknown> | null
  completed_at: string | null
  idempotency_key: string | null
  notes: string | null
  created_at: string
}

export interface SmsTaskPayload {
  phone: string
  message: string
}
