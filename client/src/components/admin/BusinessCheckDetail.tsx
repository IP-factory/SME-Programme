import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import type { AdminSectionId } from "@/lib/adminSections";
import { READINESS_LABELS } from "@shared/businessCheck/engine";
import { funnelStatus, isReadyToOnboard } from "@shared/businessCheck/funnelStatus";
import { AREA_NAMES, type Health } from "@shared/businessCheck/questions";
import React from "react";
import { CopyButton, DetailField, DetailSection, StatusBadge } from "./AdminPrimitives";
import { formatDate, formatDateTime, ROUTE_LABELS, whatsappLink } from "./format";

const HEALTH: Record<Health, { label: string; className: string }> = {
  clear: { label: "Clear", className: "border-emerald-200 bg-emerald-50 text-emerald-900" },
  watch: { label: "Watch", className: "border-amber-200 bg-amber-50 text-amber-900" },
  stuck: { label: "Stuck", className: "border-rose-200 bg-rose-50 text-rose-900" },
};

/** Email and WhatsApp as plain, copyable contact lines. WhatsApp opens a chat only when the number is usable. */
export function ContactLines({ email, whatsapp }: { email: string; whatsapp: string | null }) {
  const link = whatsappLink(whatsapp);
  return (
    <dl className="space-y-2">
      <DetailField label="Email">
        <span className="flex items-center gap-1">
          <a href={`mailto:${email}`} className="break-all text-brand underline-offset-2 hover:underline">{email}</a>
          <CopyButton value={email} label="email" />
        </span>
      </DetailField>
      <DetailField label="WhatsApp">
        {whatsapp ? (
          <span className="flex items-center gap-1">
            {link ? <a href={link} target="_blank" rel="noopener noreferrer" className="text-brand underline-offset-2 hover:underline">{whatsapp}</a> : <span>{whatsapp}</span>}
            <CopyButton value={whatsapp} label="WhatsApp number" />
          </span>
        ) : <span className="text-ink-muted">Not given</span>}
      </DetailField>
    </dl>
  );
}

/**
 * The whole business check for one prospect, as it was saved when they finished it. Nothing is recalculated, no
 * recommendation is created here, and the owner's raw answers are not shown.
 */
export default function BusinessCheckDetail({ businessCheckId, onOpenSection, onClose }: { businessCheckId: number; onOpenSection: (section: AdminSectionId) => void; onClose: () => void }) {
  const detail = trpc.businessSupport.checkDetail.useQuery({ businessCheckId }, { retry: false, refetchOnWindowFocus: false });
  if (detail.isLoading) return <p className="text-sm text-ink-muted">Loading the record…</p>;
  if (detail.error || !detail.data) return <p role="alert" className="text-sm text-rose-900">{detail.error?.message ?? "This record is not available."}</p>;

  const check = detail.data;
  const status = funnelStatus(check);
  const mainArea = check.primaryAreaNumber !== null ? AREA_NAMES[check.primaryAreaNumber] ?? `Area ${check.primaryAreaNumber}` : null;
  const nextStep: { label: string; section: AdminSectionId; primary: boolean } | null =
    isReadyToOnboard(status) ? { label: "Continue to Client Onboarding", section: "onboarding", primary: true }
    : status === "onboarding" ? { label: "View the onboarding link", section: "onboarding", primary: false }
    : status === "call_requested" || status === "call_scheduled" ? { label: "Go to Discovery Call", section: "calls", primary: false }
    : null;
  const go = (section: AdminSectionId) => {
    onClose();
    onOpenSection(section);
  };

  const history = [
    { label: check.completedAt ? "Check completed" : "Check started", at: check.completedAt ?? check.createdAt },
    ...(check.callRequestedAt ? [{ label: "Call requested", at: check.callRequestedAt }] : []),
    ...(check.callScheduledFor ? [{ label: "Call scheduled for", at: check.callScheduledFor, withTime: true }] : []),
  ];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={status} />
        {!check.completedAt && <span className="text-xs text-ink-muted">The owner has not finished the check.</span>}
      </div>

      <DetailSection title="Contact"><ContactLines email={check.email} whatsapp={check.whatsapp} /></DetailSection>

      <DetailSection title="Business Check">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          <DetailField label={check.completedAt ? "Completed" : "Started"}>{formatDate(check.completedAt ?? check.createdAt)}</DetailField>
          <DetailField label="Main area">{mainArea ?? "-"}</DetailField>
          <DetailField label="Readiness">{check.readiness ? READINESS_LABELS[check.readiness] : "-"}</DetailField>
          <DetailField label="Route">{check.route ? ROUTE_LABELS[check.route] ?? check.route : "-"}</DetailField>
        </dl>
      </DetailSection>

      {check.summary ? (
        <DetailSection title="What we found">
          <div className="space-y-3 text-sm leading-relaxed text-ink">
            <p>{check.summary.found}</p>
            <p><span className="font-medium">What we think it is: </span>{check.summary.think}</p>
          </div>
        </DetailSection>
      ) : (
        <DetailSection title="What we found"><p className="text-sm text-ink-muted">No result yet.</p></DetailSection>
      )}

      {check.outline && check.outline.length > 0 && (
        <DetailSection title="Business outline">
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {check.outline.map(row => (
              <li key={row.area} className={`flex items-center justify-between gap-2 border px-2.5 py-1.5 text-[13px] ${row.area === check.primaryAreaNumber ? "border-brand-line bg-brand-tint" : "border-line-soft"}`}>
                <span className="min-w-0 truncate">{row.name}{row.area === check.primaryAreaNumber && <span className="ml-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand">Start here</span>}</span>
                <span className={`shrink-0 border px-1.5 py-0.5 text-[11px] font-medium ${HEALTH[row.health].className}`}>{HEALTH[row.health].label}</span>
              </li>
            ))}
          </ul>
        </DetailSection>
      )}

      {check.summary && check.summary.offerings.length > 0 && (
        <DetailSection title="Recommended support">
          <ul className="space-y-2.5">
            {check.summary.offerings.map(offering => (
              <li key={offering.id} className="text-sm">
                <p className="font-medium text-ink">{offering.name}</p>
                <p className="text-[13px] text-ink-muted">{offering.why}</p>
              </li>
            ))}
          </ul>
        </DetailSection>
      )}

      <DetailSection title="Funnel">
        <ol className="space-y-1.5 text-sm">
          {history.map(event => (
            <li key={event.label} className="flex justify-between gap-4"><span className="text-ink-muted">{event.label}</span><span>{"withTime" in event && event.withTime ? formatDateTime(event.at) : formatDate(event.at)}</span></li>
          ))}
          <li className="flex items-center justify-between gap-4 border-t border-line-soft pt-2"><span className="text-ink-muted">Current stage</span><StatusBadge status={status} /></li>
        </ol>
      </DetailSection>

      {/* Only the action that fits where this prospect is. A check with nothing to do next shows no actions. */}
      {nextStep && (
        <DetailSection title="Next step">
          <Button type="button" variant={nextStep.primary ? "default" : "outline"} className={`rounded-none text-xs uppercase tracking-wider ${nextStep.primary ? "bg-brand text-white" : ""}`} onClick={() => go(nextStep.section)}>{nextStep.label}</Button>
        </DetailSection>
      )}
    </>
  );
}
