"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { EmailSequence, SequenceStep } from "@/lib/types"
import { Mail, Link, Phone, Clock, Pencil, Save, X } from "lucide-react"
import { toast } from "sonner"

interface SequenceViewProps {
  sequences: EmailSequence[]
  onRefresh: () => void
}

const CHANNEL_ICON = {
  email: Mail,
  linkedin: Link,
  phone: Phone,
}

export function SequenceView({ sequences, onRefresh }: SequenceViewProps) {
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [editSubject, setEditSubject] = useState("")
  const [editBody, setEditBody] = useState("")
  const [editDelay, setEditDelay] = useState(0)
  const [editChannel, setEditChannel] = useState<"email" | "linkedin" | "phone">("email")
  const [saving, setSaving] = useState(false)

  function startEdit(step: SequenceStep) {
    setEditingStepId(step.id)
    setEditSubject(step.subject_template)
    setEditBody(step.body_template)
    setEditDelay(step.delay_days)
    setEditChannel(step.channel)
  }

  function cancelEdit() {
    setEditingStepId(null)
  }

  async function saveStep() {
    if (!editingStepId) return
    setSaving(true)
    const res = await fetch("/api/sequences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "step",
        id: editingStepId,
        subject_template: editSubject,
        body_template: editBody,
        delay_days: editDelay,
        channel: editChannel,
      }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success("Step saved")
      setEditingStepId(null)
      onRefresh()
    } else {
      toast.error("Failed to save")
    }
  }

  return (
    <div className="space-y-6">
      {sequences.map((seq) => (
        <Card key={seq.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{seq.name}</CardTitle>
              <Badge variant={seq.is_active ? "default" : "secondary"}>
                {seq.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            {seq.description && (
              <p className="text-sm text-muted-foreground">{seq.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {seq.steps?.map((step, idx) => {
                const Icon = CHANNEL_ICON[step.channel] ?? Mail
                const isEditing = editingStepId === step.id

                return (
                  <div key={step.id}>
                    {idx > 0 && <Separator className="mb-4" />}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-sm font-semibold">
                          {step.step_number}
                        </div>
                        {idx < (seq.steps?.length ?? 0) - 1 && (
                          <div className="w-px flex-1 bg-border mt-2" />
                        )}
                      </div>

                      {isEditing ? (
                        /* ─── Edit Mode ─── */
                        <div className="flex-1 pb-2 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <Label className="text-xs">Channel</Label>
                              <Select
                                value={editChannel}
                                onValueChange={(v) => v && setEditChannel(v as "email" | "linkedin" | "phone")}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                                  <SelectItem value="phone">Phone</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-24">
                              <Label className="text-xs">Delay (days)</Label>
                              <Input
                                type="number"
                                min={0}
                                value={editDelay}
                                onChange={(e) => setEditDelay(Number(e.target.value))}
                                className="h-8"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs">Subject Template</Label>
                            <Input
                              value={editSubject}
                              onChange={(e) => setEditSubject(e.target.value)}
                              className="text-sm"
                              placeholder="Use {{physician}}, {{medspa}}, {{metro}}, etc."
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Body Template</Label>
                            <Textarea
                              value={editBody}
                              onChange={(e) => setEditBody(e.target.value)}
                              rows={12}
                              className="text-sm font-mono"
                              placeholder="Use {{physician}}, {{medspa}}, {{metro}}, {{medspa_count}}, etc."
                            />
                            <p className="text-[11px] text-muted-foreground mt-1">
                              Variables: {"{{physician}}"}, {"{{medspa}}"}, {"{{metro}}"}, {"{{location}}"}, {"{{medspa_count}}"}, {"{{credentials}}"}, {"{{practice}}"}, {"{{owner}}"}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveStep} disabled={saving}>
                              <Save className="h-3.5 w-3.5 mr-1.5" />
                              {saving ? "Saving..." : "Save"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              <X className="h-3.5 w-3.5 mr-1.5" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* ─── View Mode ─── */
                        <div className="flex-1 pb-2 group">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm capitalize">{step.channel}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Day {step.delay_days}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2"
                              onClick={() => startEdit(step)}
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                          </div>
                          <div className="text-sm font-medium">{step.subject_template}</div>
                          <div className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-4">
                            {step.body_template}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
