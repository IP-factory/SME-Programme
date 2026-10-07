import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccount } from "@/hooks/useAccount";
import { trpc } from "@/lib/trpc";
import type { BusinessMembershipRole } from "@shared/businessMemberships";
import React, { useEffect } from "react";
import { useLocation } from "wouter";

const ROLE_LABELS: Record<BusinessMembershipRole, string> = { owner: "Owner", business_admin: "Business admin", member: "Member" };

/** The signed-in home. The server session decides who sees this; the redirect below is only a convenience. */
export default function AccountDashboard() {
  const [, setLocation] = useLocation();
  const { account, loading } = useAccount();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!loading && !account) setLocation("/login");
  }, [loading, account, setLocation]);

  const signOut = trpc.account.signOut.useMutation({
    onSuccess: () => {
      utils.account.me.setData(undefined, null);
      setLocation("/login");
    },
  });

  if (loading || !account) {
    return <main className="flex min-h-screen items-center justify-center bg-paper p-6 text-sm text-ink-muted">Loading…</main>;
  }

  const firstName = account.user.fullName.split(" ")[0] || account.user.fullName;
  const business = account.activeBusiness;

  return (
    <main className="min-h-screen bg-paper p-6 text-ink">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <header className="flex items-start justify-between gap-4">
          <h1 className="font-serif text-3xl font-bold tracking-tight">Welcome, {firstName}</h1>
          <Button variant="outline" disabled={signOut.isPending} onClick={() => signOut.mutate()} className="rounded-none text-xs uppercase tracking-wider">
            {signOut.isPending ? "Signing out…" : "Sign out"}
          </Button>
        </header>

        <Card className="rounded-none border-line-soft bg-white shadow-sm">
          <CardHeader className="space-y-1 pb-3">
            <CardDescription className="text-xs uppercase tracking-widest">Your business</CardDescription>
            <CardTitle className="font-serif text-2xl font-bold tracking-tight">{business ? business.businessName : "No business yet"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {business ? (
              <>
                <p>Business profile: <strong>{business.profileComplete ? "Complete" : "Incomplete"}</strong></p>
                <p className="text-ink-muted">Your role: {ROLE_LABELS[business.role]}</p>
                <Button disabled title="Business profile editing arrives in the next update" className="rounded-none text-xs uppercase tracking-wider">
                  Complete business profile
                </Button>
              </>
            ) : account.memberships.length > 1 ? (
              <ul className="list-disc pl-5">{account.memberships.map(item => <li key={item.businessId}>{item.businessName}</li>)}</ul>
            ) : (
              <p className="text-ink-muted">You are not a member of a business yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-none border-line-soft bg-white shadow-sm">
          <CardHeader className="space-y-1 pb-3">
            <CardDescription className="text-xs uppercase tracking-widest">Your account</CardDescription>
            <CardTitle className="text-lg font-semibold">{account.user.fullName}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-ink-muted">
            <p>{account.user.email}</p>
            <p className="mt-2">Your account is you. Your business is the workspace you act inside.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
