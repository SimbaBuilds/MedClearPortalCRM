"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LeadsTable } from "@/components/leads/leads-table"
import { LeadDetail } from "@/components/leads/lead-detail"
import { SequenceView } from "@/components/sequences/sequence-view"
import type { Lead, EmailSequence } from "@/lib/types"
import { Search, Users, Mail, BarChart3, Target, Activity } from "lucide-react"
import { ActivityFeed } from "@/components/activity-feed"

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [sequences, setSequences] = useState<EmailSequence[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [metroFilter, setMetroFilter] = useState("all")
  const [tierFilter, setTierFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [followupDays, setFollowupDays] = useState<number>(7)

  const fetchLeads = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (statusFilter !== "all") params.set("status", statusFilter)
    if (metroFilter !== "all") params.set("metro", metroFilter)
    if (tierFilter !== "all") params.set("tier", tierFilter)

    const res = await fetch(`/api/leads?${params}`)
    if (res.ok) {
      setLeads(await res.json())
    }
    setLoading(false)
  }, [search, statusFilter, metroFilter, tierFilter])

  const fetchSequences = useCallback(async () => {
    const res = await fetch("/api/sequences")
    if (res.ok) setSequences(await res.json())
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  useEffect(() => {
    fetchSequences()
  }, [fetchSequences])

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (s?.followup_business_days) setFollowupDays(s.followup_business_days)
      })
  }, [])

  async function saveFollowupDays(n: number) {
    setFollowupDays(n)
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followup_business_days: n }),
    })
  }

  // Debounced search
  const [searchInput, setSearchInput] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  function handleLeadUpdate(updated: Lead) {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
    setSelectedLead(updated)
  }

  // Compute stats
  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    active: leads.filter((l) => ["contacted", "sequence_active", "replied"].includes(l.status)).length,
    booked: leads.filter((l) => l.status === "meeting_booked").length,
    won: leads.filter((l) => l.status === "closed_won").length,
  }

  const metros = [...new Set(leads.map((l) => l.metro).filter(Boolean))]
  const tiers = [...new Set(leads.map((l) => l.tier).filter(Boolean))].sort()

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white px-6 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
              <h1 className="font-semibold text-lg">MedClearPortal Customer Acquisition</h1>
            </div>
            <Badge className="bg-brand-subtle text-brand border-0 text-xs font-medium">
              {stats.total} leads
            </Badge>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <label className="flex items-center gap-1.5 text-muted-foreground" title="Default follow-up cadence (business days after last outreach)">
              <span className="text-xs">Follow-up after</span>
              <Input
                type="number"
                min={1}
                max={60}
                value={followupDays}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10)
                  if (!Number.isNaN(n) && n >= 1 && n <= 60) saveFollowupDays(n)
                }}
                className="h-7 w-14 text-xs"
              />
              <span className="text-xs">biz days</span>
            </label>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span className="font-medium text-foreground">{stats.new}</span> new
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="font-medium text-foreground">{stats.active}</span> active
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="font-medium text-foreground">{stats.booked}</span> booked
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-brand" />
              <span className="font-medium text-foreground">{stats.won}</span> won
            </span>
          </div>
        </div>
      </header>

      <Tabs defaultValue="leads" className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b px-6 bg-white">
          <TabsList className="h-10">
            <TabsTrigger value="leads" className="gap-1.5">
              <Users className="h-4 w-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="sequences" className="gap-1.5">
              <Mail className="h-4 w-4" />
              Sequences
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-1.5">
              <BarChart3 className="h-4 w-4" />
              Pipeline
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="leads" className="flex-1 flex overflow-hidden m-0">
          <div className={`flex-1 flex flex-col overflow-hidden ${selectedLead ? "border-r" : ""}`}>
            {/* Filters */}
            <div className="px-4 py-3 border-b bg-muted/30 flex gap-3 items-end flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Physicians, medspas, locations..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-9 h-9 bg-white"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Status</Label>
                <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
                  <SelectTrigger className="w-[150px] h-9 bg-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="practice_email_obtained">Practice Email Obtained</SelectItem>
                    <SelectItem value="sequence_active">Sequence Active</SelectItem>
                    <SelectItem value="replied">Replied</SelectItem>
                    <SelectItem value="meeting_booked">Meeting Booked</SelectItem>
                    <SelectItem value="closed_won">Closed Won</SelectItem>
                    <SelectItem value="closed_lost">Closed Lost</SelectItem>
                    <SelectItem value="low_priority">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Metro</Label>
                <Select value={metroFilter} onValueChange={(v) => v && setMetroFilter(v)}>
                  <SelectTrigger className="w-[140px] h-9 bg-white">
                    <SelectValue placeholder="Metro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Metros</SelectItem>
                    {metros.map((m) => (
                      <SelectItem key={m} value={m!}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Tier</Label>
                <Select value={tierFilter} onValueChange={(v) => v && setTierFilter(v)}>
                  <SelectTrigger className="w-[120px] h-9 bg-white">
                    <SelectValue placeholder="Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    {tiers.map((t) => (
                      <SelectItem key={t} value={t!}>
                        Tier {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  Loading leads...
                </div>
              ) : (
                <LeadsTable
                  leads={leads}
                  selectedId={selectedLead?.id ?? null}
                  onSelect={setSelectedLead}
                />
              )}
            </div>
          </div>

          {/* Detail panel */}
          {selectedLead && (
            <div className="w-[480px] shrink-0 overflow-hidden border-l bg-muted/20">
              <LeadDetail
                key={selectedLead.id}
                lead={selectedLead}
                sequences={sequences}
                onUpdate={handleLeadUpdate}
                onClose={() => setSelectedLead(null)}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="sequences" className="flex-1 overflow-auto m-0 p-6 bg-muted/20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-lg font-semibold mb-1">Email Sequences</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Pre-built outreach sequences. Enroll leads from the lead detail panel.
            </p>
            <SequenceView sequences={sequences} onRefresh={fetchSequences} />
          </div>
        </TabsContent>

        <TabsContent value="activity" className="flex-1 overflow-auto m-0 p-6 bg-muted/20">
          <div className="max-w-3xl mx-auto">
            <ActivityFeed />
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="flex-1 overflow-auto m-0 p-6 bg-muted/20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold mb-6">Pipeline Overview</h2>
            <div className="grid grid-cols-4 gap-4 mb-10">
              {[
                { label: "New", count: stats.new, bg: "bg-white", border: "border-slate-200", dot: "bg-slate-400" },
                { label: "Active Outreach", count: stats.active, bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500" },
                { label: "Meeting Booked", count: stats.booked, bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
                { label: "Closed Won", count: stats.won, bg: "bg-brand-subtle", border: "border-brand/20", dot: "bg-brand" },
              ].map((stage) => (
                <div key={stage.label} className={`${stage.bg} border ${stage.border} rounded-xl p-5`}>
                  <div className="text-3xl font-bold mb-1">{stage.count}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
                    {stage.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Metro breakdown */}
            <h3 className="font-semibold mb-3">By Metro</h3>
            <div className="grid grid-cols-2 gap-4">
              {metros.map((metro) => {
                const metroLeads = leads.filter((l) => l.metro === metro)
                const t1 = metroLeads.filter((l) => l.tier === "1").length
                const t2 = metroLeads.filter((l) => l.tier === "2").length
                const t3 = metroLeads.filter((l) => l.tier === "3").length
                return (
                  <div key={metro} className="bg-white border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">{metro}</span>
                      <Badge className="bg-brand-subtle text-brand border-0 text-xs">{metroLeads.length}</Badge>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <span className="w-4 h-1.5 rounded-full bg-brand" />
                        {t1} Tier 1
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-4 h-1.5 rounded-full bg-blue-400" />
                        {t2} Tier 2
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-4 h-1.5 rounded-full bg-slate-300" />
                        {t3} Tier 3
                      </span>
                    </div>
                    {/* Mini bar */}
                    <div className="flex mt-3 h-1.5 rounded-full overflow-hidden bg-muted">
                      {t1 > 0 && <div className="bg-brand" style={{ width: `${(t1 / metroLeads.length) * 100}%` }} />}
                      {t2 > 0 && <div className="bg-blue-400" style={{ width: `${(t2 / metroLeads.length) * 100}%` }} />}
                      {t3 > 0 && <div className="bg-slate-300" style={{ width: `${(t3 / metroLeads.length) * 100}%` }} />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
