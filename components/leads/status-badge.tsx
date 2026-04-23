import { Badge } from "@/components/ui/badge"
import type { LeadStatus } from "@/lib/types"

const STATUS_CONFIG: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-slate-100 text-slate-600 hover:bg-slate-100 border-0" },
  contacted: { label: "Contacted", className: "bg-blue-50 text-blue-600 hover:bg-blue-50 border-0" },
  sequence_active: { label: "In Sequence", className: "bg-violet-50 text-violet-600 hover:bg-violet-50 border-0" },
  replied: { label: "Replied", className: "bg-sky-50 text-sky-600 hover:bg-sky-50 border-0" },
  meeting_booked: { label: "Meeting Booked", className: "bg-amber-50 text-amber-700 hover:bg-amber-50 border-0" },
  closed_won: { label: "Won", className: "bg-brand-subtle text-brand hover:bg-brand-subtle border-0" },
  closed_lost: { label: "Lost", className: "bg-red-50 text-red-600 hover:bg-red-50 border-0" },
  unsubscribed: { label: "Unsubscribed", className: "bg-orange-50 text-orange-600 hover:bg-orange-50 border-0" },
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.new
  return <Badge className={`text-[11px] font-medium ${config.className}`}>{config.label}</Badge>
}
