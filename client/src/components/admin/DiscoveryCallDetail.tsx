import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminSectionId } from "@/lib/adminSections";
import { trpc } from "@/lib/trpc";
import type { FunnelStatus } from "@shared/businessCheck/funnelStatus";
import { AREA_NAMES } from "@shared/businessCheck/questions";
import React, { useState } from "react";
import { toast } from "sonner";
import { DetailField, DetailSection, StatusBadge } from "./AdminPrimitives";
import { ContactLines } from "./BusinessCheckDetail";
import { combineDateAndTime, formatDate, formatTime, readinessShort, toDateInput, toTimeInput } from "./format";

type Row = {
  id: number;
  fullName: string;
  businessName: string | null;
  email: string;
  whatsapp: string | null;
  primaryArea: number | null;
  readiness: string | null;
  callRequestedAt: Date | string | null;
  callScheduledFor: Date | string | null;
  status: FunnelStatus;
};

const OUTCOME_FOR_STATUS: Partial<Record<FunnelStatus, "fit" | "refer" | "decline">> = { fit: "fit", referred: "refer", declined: "decline" };
const OUTCOME_NAME = { fit: "Fit", refer: "Referred", decline: "Declined" } as const;

/**
 * One discovery call: who to contact, when it is, and what came of it. Scheduling and the outcome use the existing
 * mutations unchanged; "Fit" does not create an account, it points to Client Onboarding as a separate, deliberate step.
 */
export default function DiscoveryCallDetail({ row, onOpenSection, onClose }: { row: Row; onOpenSection: (section: AdminSectionId) => void; onClose: () => void }) {
  const utils = trpc.useUtils();
  const refresh = () => {
    void utils.businessSupport.discoveryCalls.invalidate();
    void utils.businessSupport.checks.invalidate();
    void utils.onboarding.candidates.invalidate();
  };
  const schedule = trpc.businessSupport.scheduleCall.useMutation({ onSuccess: () => { toast.success("Call schedule saved."); refresh(); }, onError: error => toast.error(error.message) });
  const decide = trpc.businessSupport.recordOutcome.useMutation({ onSuccess: () => { toast.success("Outcome recorded."); refresh(); }, onError: error => toast.error(error.message) });

  const [date, setDate] = useState(toDateInput(row.callScheduledFor));
  const [time, setTime] = useState(toTimeInput(row.callScheduledFor));
  const when = combineDateAndTime(date, time);
  const busy = schedule.isPending || decide.isPending;

  const status = row.status;
  const undecided = status === "call_requested" || status === "call_scheduled";
  const decided = OUTCOME_FOR_STATUS[status];
  const afterOnboarding = status === "onboarding" || status === "onboarded" || status === "won";
  const go = (section: AdminSectionId) => {
    onClose();
    onOpenSection(section);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2"><StatusBadge status={status} /></div>

      <DetailSection title="Contact"><ContactLines email={row.email} whatsapp={row.whatsapp} /></DetailSection>

      <DetailSection title="Request">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          <DetailField label="Requested">{formatDate(row.callRequestedAt)}</DetailField>
          <DetailField label="Main area">{row.primaryArea !== null ? AREA_NAMES[row.primaryArea] ?? `Area ${row.primaryArea}` : "-"}</DetailField>
          <DetailField label="Readiness">{row.readiness ? readinessShort(row.readiness) : "-"}</DetailField>
        </dl>
      </DetailSection>

      <DetailSection title="Schedule discovery call">
        {row.callScheduledFor && (
          <dl className="mb-3 grid grid-cols-2 gap-x-6">
            <DetailField label="Scheduled for">{formatDate(row.callScheduledFor)}</DetailField>
            <DetailField label="Time">{formatTime(row.callScheduledFor)}</DetailField>
          </dl>
        )}
        {undecided ? (
          <form
            className="space-y-3"
            onSubmit={event => {
              event.preventDefault();
              if (when) schedule.mutate({ businessCheckId: row.id, scheduledFor: when });
            }}
          >
            <p className="text-xs text-ink-muted">Agree the time with them by WhatsApp or email, then record it here.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label htmlFor={`call-date-${row.id}`}>Date</Label><Input id={`call-date-${row.id}`} type="date" value={date} onChange={event => setDate(event.target.value)} className="h-9 rounded-none" /></div>
              <div className="space-y-1"><Label htmlFor={`call-time-${row.id}`}>Time</Label><Input id={`call-time-${row.id}`} type="time" value={time} onChange={event => setTime(event.target.value)} className="h-9 rounded-none" /></div>
            </div>
            <Button type="submit" variant="outline" disabled={busy || !when} className="rounded-none text-xs uppercase tracking-wider">{row.callScheduledFor ? "Reschedule call" : "Save call schedule"}</Button>
          </form>
        ) : !row.callScheduledFor ? <p className="text-sm text-ink-muted">No time was recorded for this call.</p> : null}
      </DetailSection>

      {!afterOnboarding && (
        <DetailSection title="Record call outcome">
          {decided && <p className="mb-3 text-sm text-ink-muted">Recorded: <span className="font-medium text-ink">{OUTCOME_NAME[decided]}</span>. You can change it.</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={busy || decided === "fit"} className="rounded-none bg-brand text-xs uppercase tracking-wider text-white" onClick={() => decide.mutate({ businessCheckId: row.id, outcome: "fit" })}>Fit</Button>
            <Button type="button" variant="outline" disabled={busy || decided === "refer"} className="rounded-none text-xs uppercase tracking-wider" onClick={() => decide.mutate({ businessCheckId: row.id, outcome: "refer" })}>Refer</Button>
            <Button type="button" variant="outline" disabled={busy || decided === "decline"} className="rounded-none border-rose-200 text-xs uppercase tracking-wider text-rose-800 hover:bg-rose-50" onClick={() => decide.mutate({ businessCheckId: row.id, outcome: "decline" })}>Decline</Button>
          </div>
        </DetailSection>
      )}

      {status === "fit" && (
        <section aria-label="Suitable to proceed" className="space-y-3 border border-emerald-200 bg-emerald-50 p-4">
          <h3 className="text-sm font-semibold text-emerald-950">Suitable to proceed</h3>
          <p className="text-sm text-emerald-950">Confirm commercial approval/payment before sending the onboarding invitation.</p>
          <Button type="button" className="rounded-none bg-brand text-xs uppercase tracking-wider text-white" onClick={() => go("onboarding")}>Continue to Client Onboarding</Button>
        </section>
      )}
      {status === "onboarding" && (
        <section className="space-y-3 border border-brand-line bg-brand-tint p-4">
          <p className="text-sm text-ink">An onboarding link has been generated for this prospect.</p>
          <Button type="button" variant="outline" className="rounded-none text-xs uppercase tracking-wider" onClick={() => go("onboarding")}>View the onboarding link</Button>
        </section>
      )}
    </>
  );
}
