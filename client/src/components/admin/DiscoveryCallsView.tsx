import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import React, { useState } from "react";
import { toast } from "sonner";
import { formatDate, formatDateTime, stageName } from "./BusinessChecksView";

/**
 * Business checks whose owner asked for the free discovery call. No booking provider exists yet, so the team agrees the
 * time with the owner by WhatsApp or email and records it here. "Fit" does not create an account: onboarding is a
 * separate, deliberate step.
 */
export default function DiscoveryCallsView() {
  const utils = trpc.useUtils();
  const calls = trpc.businessSupport.discoveryCalls.useQuery(undefined, { retry: false });
  const [times, setTimes] = useState<Record<number, string>>({});
  const refresh = () => {
    void utils.businessSupport.discoveryCalls.invalidate();
    void utils.businessSupport.checks.invalidate();
    void utils.onboarding.candidates.invalidate();
  };
  const schedule = trpc.businessSupport.scheduleCall.useMutation({ onSuccess: () => { toast.success("Call time recorded."); refresh(); }, onError: error => toast.error(error.message) });
  const decide = trpc.businessSupport.recordOutcome.useMutation({ onSuccess: () => { toast.success("Outcome recorded."); refresh(); }, onError: error => toast.error(error.message) });

  if (calls.error) return <p role="alert" className="p-6 text-sm text-rose-900">{calls.error.message}</p>;
  const busy = schedule.isPending || decide.isPending;
  return (
    <div className="space-y-4 p-6">
      <p className="text-sm text-ink-muted">People who asked for the free 20-minute call. Agree a time with them by WhatsApp or email, record it here, then record the outcome after the call.</p>
      {calls.isLoading ? <p className="text-sm text-ink-muted">Loading…</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-line text-xs uppercase tracking-wider text-ink-muted"><th className="py-2 pr-3">Name</th><th className="pr-3">Business</th><th className="pr-3">Email</th><th className="pr-3">WhatsApp</th><th className="pr-3">Requested</th><th className="pr-3">Call time</th><th className="pr-3">Stage</th><th>Actions</th></tr></thead>
            <tbody>
              {calls.data?.map(row => (
                <tr key={row.id} className="border-b border-line-soft align-top">
                  <td className="py-2 pr-3">{row.fullName}</td>
                  <td className="pr-3">{row.businessName ?? "-"}</td>
                  <td className="pr-3">{row.email}</td>
                  <td className="pr-3">{row.whatsapp ?? "-"}</td>
                  <td className="pr-3">{formatDate(row.callRequestedAt)}</td>
                  <td className="pr-3">{row.callScheduledFor ? formatDateTime(row.callScheduledFor) : "Not scheduled"}</td>
                  <td className="pr-3">{stageName(row.pipelineStage)}</td>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      <input type="datetime-local" aria-label={`Call time for ${row.fullName}`} value={times[row.id] ?? ""} onChange={event => setTimes(current => ({ ...current, [row.id]: event.target.value }))} className="border border-line bg-white px-2 py-1 text-xs" />
                      <Button type="button" size="sm" variant="outline" disabled={busy || !times[row.id]} className="rounded-none text-xs" onClick={() => schedule.mutate({ businessCheckId: row.id, scheduledFor: new Date(times[row.id]) })}>Mark call scheduled</Button>
                      <Button type="button" size="sm" disabled={busy} className="rounded-none bg-brand text-xs text-white" onClick={() => decide.mutate({ businessCheckId: row.id, outcome: "fit" })}>Mark fit</Button>
                      <Button type="button" size="sm" variant="outline" disabled={busy} className="rounded-none text-xs" onClick={() => decide.mutate({ businessCheckId: row.id, outcome: "refer" })}>Refer</Button>
                      <Button type="button" size="sm" variant="outline" disabled={busy} className="rounded-none text-xs" onClick={() => decide.mutate({ businessCheckId: row.id, outcome: "decline" })}>Decline</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {calls.data?.length === 0 && <tr><td colSpan={8} className="py-4 text-ink-muted">No one has asked for a discovery call yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
