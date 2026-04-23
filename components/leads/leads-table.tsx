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
import { ExternalLink } from "lucide-react"

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
            <TableHead className="w-[56px] text-[11px] uppercase tracking-wider font-semibold">Tier</TableHead>
            <TableHead className="w-[100px] text-[11px] uppercase tracking-wider font-semibold">Metro</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Physician</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Medspa</TableHead>
            <TableHead className="w-[120px] text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="w-[110px] text-[11px] uppercase tracking-wider font-semibold">Phone</TableHead>
            <TableHead className="w-[44px] text-[11px] uppercase tracking-wider font-semibold">Web</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                No leads found
              </TableCell>
            </TableRow>
          )}
          {leads.map((lead) => (
            <TableRow
              key={lead.id}
              className={`cursor-pointer transition-colors ${
                selectedId === lead.id
                  ? "bg-brand-subtle/60 border-l-2 border-l-brand"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => onSelect(lead)}
            >
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
              <TableCell>
                <div className="font-medium text-sm">{lead.physician || "—"}</div>
                {lead.credentials && (
                  <div className="text-xs text-muted-foreground truncate max-w-[250px]">
                    {lead.credentials}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="text-sm">{lead.associated_medspa || "—"}</div>
                {lead.medspa_owner_operator && (
                  <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {lead.medspa_owner_operator}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <StatusBadge status={lead.status} />
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{lead.phone || "—"}</TableCell>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
