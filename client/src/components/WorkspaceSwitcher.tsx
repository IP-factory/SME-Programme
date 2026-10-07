import { trpc } from "@/lib/trpc";
import { BUSINESS_ROLE_LABELS } from "@shared/businessCapabilities";
import type { AccountSessionView } from "@shared/auth";
import React from "react";
import { toast } from "sonner";

/**
 * Lets a person who belongs to several businesses choose the one they are working in. Shown only with two or more
 * memberships: with one there is nothing to choose. The server verifies the choice against the person's memberships,
 * stores it on the session and returns the refreshed context; nothing here is proof of access.
 */
export default function WorkspaceSwitcher({ account }: { account: AccountSessionView }) {
  const utils = trpc.useUtils();
  const switchWorkspace = trpc.account.switchWorkspace.useMutation({
    onSuccess: view => {
      utils.account.me.setData(undefined, view);
      void utils.account.business.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  if (account.memberships.length < 2) return null;
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">Workspace</span>
      <select
        aria-label="Workspace"
        className="border border-line bg-white px-2 py-1 text-sm"
        disabled={switchWorkspace.isPending}
        value={account.activeBusiness?.businessId ?? ""}
        onChange={event => switchWorkspace.mutate({ businessId: Number(event.target.value) })}
      >
        {account.memberships.map(item => (
          <option key={item.businessId} value={item.businessId}>{item.businessName} · {BUSINESS_ROLE_LABELS[item.role]}</option>
        ))}
      </select>
    </label>
  );
}
