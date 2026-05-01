"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "./status-badge"
import type { Lead } from "@/lib/types"
import { ExternalLink, Mail } from "lucide-react"

interface LeadsTableProps {
  leads: Lead[]
  selectedId: string | null
  onSelect: (lead: Lead) => void
}

const TIER_STYLES: Record<string, string> = {
  "1": "bg-brand text-white",
  "2": "bg-blue-100 text-blue-700",
  "3": "bg-slate-100 text-slate-500",
  REF: "bg-amber-100 text-amber-700",
}

export function LeadsTable({ leads, selectedId, onSelect }: LeadsTableProps) {
  return (
    <div className="border rounded-lg overflow-auto bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="w-[44px] text-[11px] uppercase tracking-wider font-semibold">#</TableHead>
            <TableHead className="w-[56px] text-[11px] uppercase tracking-wider font-semibold">Tier</TableHead>
            <TableHead className="w-[100px] text-[11px] uppercase tracking-wider font-semibold">Metro</TableHead>
            <TableHead className="w-[260px] text-[11px] uppercase tracking-wider font-semibold">Physician</TableHead>
            <TableHead className="w-[260px] text-[11px] uppercase tracking-wider font-semibold">Medspa</TableHead>
            <TableHead className="w-[120px] text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="w-[80px] text-[11px] uppercase tracking-wider font-semibold" title="LinkedIn: requested / connected / messaged">LI</TableHead>
            <TableHead className="w-[110px] text-[11px] uppercase tracking-wider font-semibold">Phone</TableHead>
            <TableHead className="w-[44px] text-[11px] uppercase tracking-wider font-semibold" title="Practice email obtained">PE</TableHead>
            <TableHead className="w-[44px] text-[11px] uppercase tracking-wider font-semibold">Web</TableHead>
            <TableHead className="w-[110px] text-[11px] uppercase tracking-wider font-semibold" title="Next follow-up date (auto = 7 business days after last outreach)">Next F/U</TableHead>
            <TableHead className="w-[240px] text-[11px] uppercase tracking-wider font-semibold">Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 && (
            <TableRow>
              <TableCell colSpan={12} className="text-center text-muted-foreground py-12">
                No leads found
              </TableCell>
            </TableRow>
          )}
          {leads.map((lead, index) => (
            <TableRow
              key={lead.id}
              className={`cursor-pointer transition-colors ${
                selectedId === lead.id
                  ? "bg-brand-subtle/60 border-l-2 border-l-brand"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => onSelect(lead)}
            >
              <TableCell className="text-xs text-muted-foreground tabular-nums">
                {index + 1}
              </TableCell>
              <TableCell>
                {lead.tier && (
                  <Badge className={`text-[11px] px-1.5 py-0 font-semibold ${TIER_STYLES[lead.tier] ?? "bg-slate-100 text-slate-500"}`}>
                    {lead.tier}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {lead.metro && (
                  <span className="text-xs font-medium text-muted-foreground">{lead.metro}</span>
                )}
              </TableCell>
              <TableCell className="max-w-[260px]">
                <div className="font-medium text-sm truncate" title={lead.physician ?? undefined}>
                  {lead.physician || "—"}
                </div>
                {lead.credentials && (
                  <div className="text-xs text-muted-foreground truncate" title={lead.credentials}>
                    {lead.credentials}
                  </div>
                )}
              </TableCell>
              <TableCell className="max-w-[260px]">
                <div className="text-sm truncate" title={lead.associated_medspa ?? undefined}>
                  {lead.associated_medspa || "—"}
                </div>
                {lead.medspa_owner_operator && (
                  <div className="text-xs text-muted-foreground truncate" title={lead.medspa_owner_operator}>
                    {lead.medspa_owner_operator}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <StatusBadge status={lead.status} />
              </TableCell>
              <TableCell>
                {lead.linkedin_not_found ? (
                  <span
                    className="text-rose-500 text-xs font-semibold"
                    title="No LinkedIn profile found"
                  >
                    ✕
                  </span>
                ) : (
                  <div className="flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${lead.linkedin_connection_requested ? "bg-amber-500" : "bg-slate-200"}`}
                      title={lead.linkedin_connection_requested ? "Connection request sent" : "No request sent"}
                    />
                    <span
                      className={`w-2 h-2 rounded-full ${lead.linkedin_connected ? "bg-brand" : "bg-slate-200"}`}
                      title={lead.linkedin_connected ? "Connected on LinkedIn" : "Not connected"}
                    />
                    <span
                      className={`w-2 h-2 rounded-full ${lead.linkedin_messaged ? "bg-blue-500" : "bg-slate-200"}`}
                      title={lead.linkedin_messaged ? "Messaged on LinkedIn" : "Not messaged"}
                    />
                  </div>
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{lead.phone || "—"}</TableCell>
              <TableCell>
                {lead.practice_email ? (
                  <span title={lead.practice_email} className="inline-flex">
                    <Mail className="h-3.5 w-3.5 text-teal-600" />
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-200 inline-block" title="No practice email" />
                )}
              </TableCell>
              <TableCell>
                {lead.website && (
                  <a
                    href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-brand hover:text-brand-light"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </TableCell>
              <TableCell className="text-xs">
                {lead.next_followup_at ? (
                  <span
                    className={
                      lead.next_followup_manual_override
                        ? "text-amber-700 font-medium"
                        : "text-muted-foreground"
                    }
                    title={
                      lead.next_followup_manual_override
                        ? "Manually set"
                        : "Auto: 7 business days after last outreach"
                    }
                  >
                    {new Date(lead.next_followup_at).toLocaleDateString()}
                    {lead.next_followup_manual_override && " *"}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="max-w-[240px]">
                {lead.latest_note ? (
                  <div className="text-xs text-muted-foreground truncate" title={lead.latest_note}>
                    {lead.latest_note}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
