import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { READINESS_LABELS } from "@shared/businessCheck/engine";
import { PIPELINE_LABELS, PIPELINE_STAGES } from "@shared/businessCheck/pipeline";
import { AREA_NAMES } from "@shared/businessCheck/questions";
import React, { useMemo, useState } from "react";

export const formatDate = (value: Date | string | null | undefined) => (value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "-");
export const formatDateTime = (value: Date | string | null | undefined) => (value ? new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-");
export const stageName = (stage: string) => PIPELINE_LABELS[stage as keyof typeof PIPELINE_LABELS]?.name ?? stage;

/**
 * Every Free Business Check: prospects, not clients. Finished checks and people who only left their details are both
 * here. Nothing on this screen creates a user or a business.
 */
export default function BusinessChecksView() {
  const checks = trpc.businessSupport.checks.useQuery(undefined, { retry: false });
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("all");
  const [callOnly, setCallOnly] = useState(false);

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (checks.data ?? []).filter(row => {
      if (stage !== "all" && row.pipelineStage !== stage) return false;
      if (callOnly && !row.callRequestedAt) return false;
      if (!needle) return true;
      return [row.fullName, row.businessName, row.email, row.whatsapp].some(value => value?.toLowerCase().includes(needle));
    });
  }, [checks.data, search, stage, callOnly]);

  if (checks.error) return <p role="alert" className="p-6 text-sm text-rose-900">{checks.error.message}</p>;
  return (
    <div className="space-y-4 p-6">
      <p className="text-sm text-ink-muted">Everyone who started the Free Business Check. They are prospects: no account or business exists for them until they are onboarded.</p>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input aria-label="Search business checks" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, business, email or WhatsApp" className="rounded-none md:max-w-sm" />
        <select aria-label="Filter by stage" value={stage} onChange={event => setStage(event.target.value)} className="border border-line bg-white px-2 py-2 text-sm">
          <option value="all">All stages</option>
          {PIPELINE_STAGES.map(item => <option key={item} value={item}>{PIPELINE_LABELS[item].name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={callOnly} onChange={event => setCallOnly(event.target.checked)} /> Call requested only</label>
        <span className="text-xs text-ink-muted md:ml-auto">{rows.length} of {checks.data?.length ?? 0}</span>
      </div>
      {checks.isLoading ? <p className="text-sm text-ink-muted">Loading…</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-line text-xs uppercase tracking-wider text-ink-muted"><th className="py-2 pr-3">Name</th><th className="pr-3">Business</th><th className="pr-3">Email</th><th className="pr-3">WhatsApp</th><th className="pr-3">Completed</th><th className="pr-3">Main area</th><th className="pr-3">Readiness</th><th className="pr-3">Route</th><th className="pr-3">Stage</th><th className="pr-3">Call requested</th></tr></thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} className="border-b border-line-soft align-top">
                  <td className="py-2 pr-3">{row.fullName}</td>
                  <td className="pr-3">{row.businessName ?? "-"}</td>
                  <td className="pr-3">{row.email}</td>
                  <td className="pr-3">{row.whatsapp ?? "-"}</td>
                  <td className="pr-3">{row.completedAt ? formatDate(row.completedAt) : "Not finished"}</td>
                  <td className="pr-3">{row.primaryArea !== null ? AREA_NAMES[row.primaryArea] ?? `Area ${row.primaryArea}` : "-"}</td>
                  <td className="pr-3">{row.readiness ? READINESS_LABELS[row.readiness] ?? row.readiness : "-"}</td>
                  <td className="pr-3 capitalize">{row.route ?? "-"}</td>
                  <td className="pr-3">{stageName(row.pipelineStage)}</td>
                  <td className="pr-3">{row.callRequestedAt ? `Yes, ${formatDate(row.callRequestedAt)}` : "No"}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={10} className="py-4 text-ink-muted">No business checks match.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
