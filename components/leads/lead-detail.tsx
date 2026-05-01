"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { StatusBadge } from "./status-badge"
import type { Lead, LeadStatus, EmailSequence, OutreachLogEntry, SequenceStep } from "@/lib/types"
import { interpolate } from "@/lib/interpolate"
import {
  ExternalLink,
  Mail,
  Phone,
  Link,
  Send,
  Eye,
  PlayCircle,
  MessageSquare,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Check,
} from "lucide-react"
import { toast } from "sonner"

interface LeadDetailProps {
  lead: Lead
  sequences: EmailSequence[]
  onUpdate: (lead: Lead) => void
  onClose: () => void
}

export function LeadDetail({ lead, sequences, onUpdate, onClose }: LeadDetailProps) {
  const [outreachLog, setOutreachLog] = useState<OutreachLogEntry[]>([])
  const [email, setEmail] = useState(lead.email ?? "")
  const [linkedinUrl, setLinkedinUrl] = useState(lead.linkedin_url ?? "")
  const [phone, setPhone] = useState(lead.phone ?? "")
  const [practiceEmail, setPracticeEmail] = useState(lead.practice_email ?? "")
  const [sendSubject, setSendSubject] = useState("")
  const [sendBody, setSendBody] = useState("")
  const [noteBody, setNoteBody] = useState("")
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteBody, setEditingNoteBody] = useState("")
  const [sendDialogOpen, setSendDialogOpen] = useState(false)

  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSequence, setPreviewSequence] = useState<EmailSequence | null>(null)
  const [previewStepIdx, setPreviewStepIdx] = useState(0)

  const fetchLog = useCallback(async () => {
    const res = await fetch(`/api/outreach?lead_id=${lead.id}`)
    if (res.ok) setOutreachLog(await res.json())
  }, [lead.id])

  useEffect(() => {
    fetchLog()
  }, [fetchLog])

  async function updateLead(updates: Partial<Lead> & { clear_followup_override?: boolean }) {
    const res = await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lead.id, ...updates }),
    })
    if (res.ok) {
      const updated = await res.json()
      onUpdate(updated)
      toast.success("Lead updated")
    }
  }

  function followupInputValue(): string {
    if (!lead.next_followup_at) return ""
    const d = new Date(lead.next_followup_at)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }

  async function saveContactInfo() {
    const updates: Partial<Lead> = { email: email || null, linkedin_url: linkedinUrl || null, phone: phone || null, practice_email: practiceEmail || null } as Partial<Lead>
    if (linkedinUrl && lead.linkedin_not_found) {
      ;(updates as Partial<Lead>).linkedin_not_found = false
    }
    await updateLead(updates)
  }

  function openPreview(seq: EmailSequence) {
    setPreviewSequence(seq)
    setPreviewStepIdx(0)
    setPreviewOpen(true)
  }

  async function confirmEnroll() {
    if (!previewSequence) return
    const res = await fetch("/api/outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "enroll_sequence", lead_id: lead.id, sequence_id: previewSequence.id }),
    })
    if (res.ok) {
      const data = await res.json()
      toast.success(`Enrolled — ${data.scheduled} emails scheduled`)
      setPreviewOpen(false)
      fetchLog()
      const leadRes = await fetch(`/api/leads?search=${encodeURIComponent(lead.physician ?? "")}`)
      if (leadRes.ok) {
        const leads = await leadRes.json()
        const updated = leads.find((l: Lead) => l.id === lead.id)
        if (updated) onUpdate(updated)
      }
    } else {
      toast.error("Failed to enroll")
    }
  }

  function prefillFromStep(step: SequenceStep) {
    setSendSubject(interpolate(step.subject_template, lead))
    setSendBody(interpolate(step.body_template, lead))
    setSendDialogOpen(true)
  }

  async function sendEmail() {
    if (!email) {
      toast.error("Add an email address first")
      return
    }
    const res = await fetch("/api/outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send_email",
        lead_id: lead.id,
        subject: sendSubject,
        body: sendBody,
        to_email: email,
      }),
    })
    if (res.ok) {
      toast.success("Email logged (Resend integration pending)")
      setSendDialogOpen(false)
      setSendSubject("")
      setSendBody("")
      fetchLog()
    }
  }

  async function saveEditedNote() {
    if (!editingNoteId) return
    const res = await fetch("/api/outreach", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingNoteId, body: editingNoteBody }),
    })
    if (res.ok) {
      toast.success("Note updated")
      setEditingNoteId(null)
      setEditingNoteBody("")
      fetchLog()
    } else {
      toast.error("Failed to update note")
    }
  }

  async function logNote() {
    if (!noteBody.trim()) return
    const res = await fetch("/api/outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "log_note", lead_id: lead.id, body: noteBody }),
    })
    if (res.ok) {
      toast.success("Note logged")
      setNoteBody("")
      fetchLog()
    }
  }

  // Preview helpers
  const previewSteps = previewSequence?.steps ?? []
  const currentPreviewStep = previewSteps[previewStepIdx]

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div>
          <h2 className="font-semibold text-lg">{lead.physician || lead.associated_medspa || "Unknown"}</h2>
          <div className="flex items-center gap-2 mt-1.5">
            <StatusBadge status={lead.status} />
            {lead.metro && <Badge variant="outline" className="text-[11px]">{lead.metro}</Badge>}
            {lead.tier && <Badge className="bg-brand-subtle text-brand border-0 text-[11px]">Tier {lead.tier}</Badge>}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Contact Info */}
        <Card className="shadow-sm">
          <CardHeader className="py-3 pb-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Email</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Add email..."
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">LinkedIn</Label>
                <Input
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="Add LinkedIn URL..."
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Add phone..."
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Practice Email</Label>
                <Input
                  type="email"
                  value={practiceEmail}
                  onChange={(e) => setPracticeEmail(e.target.value)}
                  placeholder="Office email from call..."
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* LinkedIn state toggles — connection cycles: none → requested → connected */}
            <div className="flex items-center gap-3 pt-1 flex-wrap">
              <button
                type="button"
                disabled={lead.linkedin_not_found}
                onClick={() => {
                  let updates: Partial<Lead>
                  if (lead.linkedin_connected) {
                    // Connected → reset to none
                    updates = { linkedin_connected: false, linkedin_connection_requested: false } as Partial<Lead>
                  } else if (lead.linkedin_connection_requested) {
                    // Requested → connected
                    updates = { linkedin_connected: true, linkedin_connection_requested: true } as Partial<Lead>
                  } else {
                    // None → requested
                    updates = { linkedin_connection_requested: true } as Partial<Lead>
                  }
                  updateLead(updates)
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  lead.linkedin_connected
                    ? "bg-brand-subtle text-brand"
                    : lead.linkedin_connection_requested
                      ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
                title={lead.linkedin_not_found ? "Disabled — marked as no profile found" : "Click to cycle: Not sent → Requested → Connected"}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    lead.linkedin_connected
                      ? "bg-brand"
                      : lead.linkedin_connection_requested
                        ? "bg-amber-500"
                        : "bg-slate-400"
                  }`}
                />
                {lead.linkedin_connected
                  ? "Connected"
                  : lead.linkedin_connection_requested
                    ? "Request sent"
                    : "Not connected"}
              </button>
              <button
                type="button"
                disabled={lead.linkedin_not_found}
                onClick={() => updateLead({ linkedin_messaged: !lead.linkedin_messaged } as Partial<Lead>)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  lead.linkedin_messaged
                    ? "bg-blue-50 text-blue-600"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${lead.linkedin_messaged ? "bg-blue-500" : "bg-slate-400"}`} />
                {lead.linkedin_messaged ? "Messaged" : "Not messaged"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (lead.linkedin_not_found) {
                    updateLead({ linkedin_not_found: false } as Partial<Lead>)
                  } else {
                    updateLead({
                      linkedin_not_found: true,
                      linkedin_connection_requested: false,
                      linkedin_connected: false,
                      linkedin_messaged: false,
                    } as Partial<Lead>)
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  lead.linkedin_not_found
                    ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
                title="Mark that no LinkedIn profile exists for this lead"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${lead.linkedin_not_found ? "bg-rose-500" : "bg-slate-400"}`} />
                {lead.linkedin_not_found ? "No profile found" : "Mark no profile found"}
              </button>
            </div>
            {lead.website && (
              <div className="flex items-center gap-2 text-sm">
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                <a
                  href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  {lead.website}
                </a>
              </div>
            )}
            <Button size="sm" variant="outline" onClick={saveContactInfo}>
              Save Contact Info
            </Button>
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="shadow-sm">
          <CardHeader className="py-3 pb-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {lead.credentials && (
              <div>
                <span className="text-muted-foreground">Credentials:</span>{" "}
                {lead.credentials}
              </div>
            )}
            {lead.own_practice && (
              <div>
                <span className="text-muted-foreground">Own Practice:</span>{" "}
                {lead.own_practice}
              </div>
            )}
            {lead.associated_medspa && (
              <div>
                <span className="text-muted-foreground">Medspa:</span>{" "}
                {lead.associated_medspa}
              </div>
            )}
            {lead.medspa_owner_operator && (
              <div>
                <span className="text-muted-foreground">Owner/Operator:</span>{" "}
                {lead.medspa_owner_operator}
              </div>
            )}
            {lead.medspa_location && (
              <div>
                <span className="text-muted-foreground">Location:</span>{" "}
                {lead.medspa_location}
              </div>
            )}
            {lead.notes && (
              <div>
                <span className="text-muted-foreground">Notes:</span>{" "}
                {lead.notes}
              </div>
            )}
            {lead.source_url && (
              <div>
                <span className="text-muted-foreground">Source:</span>{" "}
                <a
                  href={lead.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Link
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status */}
        <Card className="shadow-sm">
          <CardHeader className="py-3 pb-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={lead.status}
              onValueChange={(val) => updateLead({ status: val as LeadStatus })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="practice_email_obtained">Practice Email Obtained</SelectItem>
                <SelectItem value="sequence_active">Sequence Active</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="meeting_booked">Meeting Booked</SelectItem>
                <SelectItem value="closed_won">Closed Won</SelectItem>
                <SelectItem value="closed_lost">Closed Lost</SelectItem>
                <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                <SelectItem value="low_priority">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Next Follow-up */}
        <Card className="shadow-sm">
          <CardHeader className="py-3 pb-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Next Follow-up
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={followupInputValue()}
                  onChange={(e) => {
                    const val = e.target.value
                    updateLead({
                      next_followup_at: val ? new Date(`${val}T12:00:00`).toISOString() : null,
                    } as Partial<Lead>)
                  }}
                  className="h-8 text-sm"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateLead({ clear_followup_override: true })}
                disabled={!lead.next_followup_manual_override}
                title="Recompute as 7 business days after the most recent outreach"
              >
                Reset to auto
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {lead.next_followup_manual_override
                ? "Manually set — won't be auto-updated by new outreach."
                : "Auto: 7 business days after the most recent outreach log entry."}
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="shadow-sm border-brand/20">
          <CardHeader className="py-3 pb-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-brand">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              {/* Send Email Dialog */}
              <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
                <DialogTrigger render={<Button size="sm" variant="outline" />}>
                  <Mail className="h-3.5 w-3.5 mr-1.5" />
                  Send Email
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Send Email to {lead.physician || "Lead"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>To</Label>
                      <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
                    </div>
                    <div>
                      <Label>Subject</Label>
                      <Input value={sendSubject} onChange={(e) => setSendSubject(e.target.value)} />
                    </div>
                    <div>
                      <Label>Body</Label>
                      <Textarea value={sendBody} onChange={(e) => setSendBody(e.target.value)} rows={10} className="text-sm font-mono" />
                    </div>
                    <Button onClick={sendEmail}>
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {lead.linkedin_url && (
                <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline">
                    <Link className="h-3.5 w-3.5 mr-1.5" />
                    LinkedIn
                  </Button>
                </a>
              )}

              {lead.phone && (
                <a href={`tel:${lead.phone}`}>
                  <Button size="sm" variant="outline">
                    <Phone className="h-3.5 w-3.5 mr-1.5" />
                    Call
                  </Button>
                </a>
              )}
            </div>

            <Separator />

            {/* Enroll in sequence — now with preview */}
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Email Sequence</Label>
              <div className="space-y-2">
                {sequences.map((seq) => {
                  const isActive = lead.current_sequence_id === seq.id
                  return (
                    <div key={seq.id} className={`rounded-lg border p-3 ${isActive ? "bg-brand-subtle/50 border-brand/20" : "bg-muted/30"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{seq.name}</span>
                        {isActive && <Badge className="bg-brand text-white border-0 text-[10px]">Active</Badge>}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant={isActive ? "secondary" : "default"}
                          className={isActive ? "" : "bg-brand hover:bg-brand-light"}
                          onClick={() => openPreview(seq)}
                          disabled={isActive}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          Preview & Enroll
                        </Button>
                        {seq.steps?.map((step) => (
                          <Button
                            key={step.id}
                            size="sm"
                            variant="ghost"
                            className="text-xs h-8"
                            onClick={() => prefillFromStep(step)}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Step {step.step_number}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <Separator />

            {/* Log a note */}
            <div>
              <Label className="text-xs mb-1.5 block">Log a Note</Label>
              <div className="flex gap-2">
                <Textarea
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="LinkedIn DM sent, left voicemail, etc..."
                  rows={2}
                  className="text-sm"
                />
                <Button size="sm" onClick={logNote} className="shrink-0">
                  <MessageSquare className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outreach History */}
        <Card className="shadow-sm">
          <CardHeader className="py-3 pb-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outreach History</CardTitle>
          </CardHeader>
          <CardContent>
            {outreachLog.length === 0 ? (
              <p className="text-sm text-muted-foreground">No outreach yet</p>
            ) : (
              <div className="space-y-3">
                {outreachLog.map((entry) => (
                  <div key={entry.id} className="flex gap-3 text-sm">
                    <div className="shrink-0 mt-0.5">
                      {entry.channel === "email" && <Mail className="h-4 w-4 text-blue-500" />}
                      {entry.channel === "linkedin" && <Link className="h-4 w-4 text-blue-700" />}
                      {entry.channel === "phone" && <Phone className="h-4 w-4 text-green-600" />}
                      {entry.channel === "manual_note" && <MessageSquare className="h-4 w-4 text-gray-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {entry.status}
                        </Badge>
                        {entry.step_number && (
                          <span className="text-xs text-muted-foreground">Step {entry.step_number}</span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {entry.status === "scheduled" && entry.scheduled_for
                            ? new Date(entry.scheduled_for).toLocaleDateString()
                            : entry.sent_at
                              ? new Date(entry.sent_at).toLocaleDateString()
                              : ""}
                        </span>
                      </div>
                      {entry.subject && (
                        <div className="font-medium mt-0.5 truncate">{entry.subject}</div>
                      )}
                      {entry.channel === "manual_note" && editingNoteId === entry.id ? (
                        <div className="mt-1 space-y-1">
                          <Textarea
                            value={editingNoteBody}
                            onChange={(e) => setEditingNoteBody(e.target.value)}
                            rows={3}
                            className="text-sm"
                          />
                          <div className="flex gap-1">
                            <Button size="sm" onClick={saveEditedNote} className="h-7">
                              <Check className="h-3.5 w-3.5 mr-1" /> Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingNoteId(null)
                                setEditingNoteBody("")
                              }}
                              className="h-7"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          {entry.body && (
                            <div className="text-muted-foreground mt-0.5 line-clamp-2 flex-1">{entry.body}</div>
                          )}
                          {entry.channel === "manual_note" && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNoteId(entry.id)
                                setEditingNoteBody(entry.body ?? "")
                              }}
                              className="text-muted-foreground hover:text-foreground shrink-0 p-0.5"
                              title="Edit note"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sequence Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Preview: {previewSequence?.name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Showing personalized emails for <strong>{lead.physician || lead.associated_medspa}</strong>
            </p>
          </DialogHeader>

          {currentPreviewStep && (
            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Step navigation */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    Step {currentPreviewStep.step_number} of {previewSteps.length}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Day {currentPreviewStep.delay_days}
                  </span>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {currentPreviewStep.channel}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={previewStepIdx === 0}
                    onClick={() => setPreviewStepIdx((i) => i - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={previewStepIdx === previewSteps.length - 1}
                    onClick={() => setPreviewStepIdx((i) => i + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Subject */}
              <div>
                <Label className="text-xs text-muted-foreground">Subject</Label>
                <div className="text-sm font-medium border rounded-md px-3 py-2 bg-muted/30">
                  {interpolate(currentPreviewStep.subject_template, lead)}
                </div>
              </div>

              {/* Body */}
              <div>
                <Label className="text-xs text-muted-foreground">Body</Label>
                <div className="text-sm border rounded-md px-3 py-3 bg-muted/30 whitespace-pre-wrap leading-relaxed max-h-[40vh] overflow-y-auto">
                  {interpolate(currentPreviewStep.body_template, lead)}
                </div>
              </div>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmEnroll}>
              <PlayCircle className="h-4 w-4 mr-2" />
              Enroll in Sequence ({previewSteps.length} emails)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
