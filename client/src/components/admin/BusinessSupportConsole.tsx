import { Button } from "@/components/ui/button";
import ClientOnboardingPanel from "@/components/ClientOnboardingPanel";
import { ADMIN_SECTIONS, visibleAdminSections, type AdminAccessView, type AdminSectionId } from "@/lib/adminSections";
import React, { useState } from "react";
import BusinessChecksView from "./BusinessChecksView";
import ClientsView from "./ClientsView";
import DiscoveryCallsView from "./DiscoveryCallsView";

type Access = AdminAccessView & { email?: string | null; platformRoles?: readonly string[] };

const TITLES: Record<AdminSectionId, string> = {
  checks: "Business Checks",
  calls: "Discovery Calls",
  onboarding: "Client Onboarding",
  clients: "Clients",
  team: "Administration Team",
  jump: "JUMP programme (legacy)",
};

/**
 * The IPF Business Support admin console: the funnel in order (Free Business Check, discovery call, onboarding, clients),
 * then the admin team, with the earlier JUMP programme desk kept in its own legacy section. Sections come from the
 * permissions the server resolved; the server still decides every action.
 */
export default function BusinessSupportConsole({ access, team, jump }: { access: Access; team: React.ReactNode; jump: React.ReactNode }) {
  const sections = visibleAdminSections(access);
  const [chosen, setChosen] = useState<AdminSectionId | null>(null);
  const active = sections.find(section => section.id === chosen) ?? sections[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-brand">IPF Business Support / Admin</p>
        <h1 className="font-serif text-4xl font-bold tracking-tight">{active ? TITLES[active.id] : "Admin"}</h1>
        {access.email && (
          <p className="mt-2 text-xs text-ink-muted">Signed in as {access.email}{access.platformRoles?.length ? ` · ${access.platformRoles.map(role => role.replace(/_/g, " ")).join(", ")}` : ""}</p>
        )}
      </div>

      {sections.length === 0 ? (
        <p role="note" className="border border-line bg-white p-6 text-sm text-ink-muted">Your account is signed in, but no admin responsibilities have been assigned to it yet. Ask the Super Admin to grant them.</p>
      ) : (
        <>
          <nav aria-label="Admin sections" className="flex flex-wrap gap-2 border-b border-line pb-2">
            {sections.map(section => (
              <Button
                key={section.id}
                type="button"
                variant={active?.id === section.id ? "default" : "outline"}
                aria-current={active?.id === section.id ? "page" : undefined}
                onClick={() => setChosen(section.id)}
                className={`rounded-none text-xs uppercase tracking-wider ${active?.id === section.id ? "bg-brand text-paper" : "border-brand-line-strong text-brand"}`}
              >
                {ADMIN_SECTIONS.find(item => item.id === section.id)?.label}
              </Button>
            ))}
          </nav>
          <div className="border border-line bg-paper shadow-sm">
            {active?.id === "checks" && <BusinessChecksView />}
            {active?.id === "calls" && <DiscoveryCallsView />}
            {active?.id === "onboarding" && <ClientOnboardingPanel />}
            {active?.id === "clients" && <ClientsView />}
            {active?.id === "team" && team}
            {active?.id === "jump" && <div className="p-4">{jump}</div>}
          </div>
        </>
      )}
    </div>
  );
}
