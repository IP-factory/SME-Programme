import { Button } from "@/components/ui/button";
import WorkspaceSwitcher from "@/components/WorkspaceSwitcher";
import { useAccount } from "@/hooks/useAccount";
import { trpc } from "@/lib/trpc";
import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";

/**
 * The signed-in shell: who you are (account), where you are working (workspace) and where you can go. The server
 * session decides; the redirect to sign-in below is only a convenience.
 */
export default function AccountLayout({ children, heading }: { children: (account: NonNullable<ReturnType<typeof useAccount>["account"]>) => React.ReactNode; heading?: string }) {
  const [location, setLocation] = useLocation();
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

  const link = (href: string, label: string) => (
    <Link href={href} className={`text-sm ${location === href ? "font-semibold text-brand" : "text-ink-muted hover:text-brand"}`}>{label}</Link>
  );

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 p-4">
          <nav aria-label="Account" className="flex flex-wrap items-center gap-4">
            {link("/dashboard", "Dashboard")}
            {account.activeBusiness && link("/settings/business", "Business settings")}
            {link("/settings/account", "Account settings")}
            {account.platformRoles.length > 0 && <a href="/admin" className="text-sm text-ink-muted hover:text-brand">Internal area</a>}
          </nav>
          <div className="flex items-center gap-3">
            <WorkspaceSwitcher account={account} />
            <Button variant="outline" disabled={signOut.isPending} onClick={() => signOut.mutate()} className="rounded-none text-xs uppercase tracking-wider">
              {signOut.isPending ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
        {heading && <h1 className="font-serif text-3xl font-bold tracking-tight">{heading}</h1>}
        {children(account)}
      </div>
    </main>
  );
}
