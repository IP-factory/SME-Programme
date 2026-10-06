import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, KeyRound, Lock, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function AdminLoginPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetRequested, setResetRequested] = useState(false);
  const access = trpc.adminAccess.status.useQuery(undefined, { enabled: Boolean(user), retry: false });
  const utils = trpc.useUtils();

  const enroll = trpc.adminAccess.enrollOwnerPassword.useMutation({
    onSuccess: () => {
      toast.success("Your JUMP administrator password is active.");
      void utils.adminAccess.status.invalidate();
      setLocation("/admin");
    },
    onError: (error) => toast.error(error.message),
  });
  const verify = trpc.adminAccess.verifyPassword.useMutation({
    onSuccess: () => {
      toast.success("Administrator access verified.");
      void utils.adminAccess.status.invalidate();
      setLocation("/admin");
    },
    onError: (error) => toast.error(error.message),
  });
  const requestReset = trpc.adminAccess.requestPasswordReset.useMutation({
    onSuccess: () => {
      toast.success("A single-use password-reset link has been sent to your verified administrator email.");
      setPassword("");
      setResetRequested(true);
    },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    if (access.data?.passwordVerified) setLocation("/admin");
  }, [access.data?.passwordVerified, setLocation]);

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col justify-center items-center p-6 text-[#1A1A1A]">
      <div className="max-w-md w-full space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#1F4E79] hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to Public Home
          </button>
          <span className="text-xs uppercase tracking-[0.22em] text-[#6A6760]">JUMP 2026</span>
        </div>
        <Card className="border-[#E5E0D5] bg-white shadow-sm rounded-none">
          <CardHeader className="space-y-3 pb-6">
            <div className="w-10 h-10 bg-[#EAF1F8] flex items-center justify-center text-[#1F4E79]"><Lock className="w-5 h-5" /></div>
            <CardTitle className="font-serif text-2xl font-bold tracking-tight">Admin Sign In</CardTitle>
            <CardDescription className="text-sm text-[#6A6760]">Your verified Google identity and a separate JUMP administrator password are both required.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? <p className="text-sm text-[#6A6760]">Checking your secure sign-in…</p> : null}
            {!loading && !user ? <>
              <div className="p-4 bg-[#FBF9F5] border border-[#E5E0D5] text-xs text-[#6A6760] space-y-2"><p className="font-semibold text-[#1A1A1A]">Step 1 of 2 — Verify identity</p><p>Sign in with your authorised Gmail account. Emmanuel’s super-admin account is emmanueltarfa@gmail.com.</p></div>
              <Button onClick={() => startLogin()} size="lg" className="w-full bg-[#1F4E79] hover:bg-[#153554] text-white rounded-none uppercase tracking-wider text-xs h-12">Continue with authorised Gmail</Button>
            </> : null}
            {!loading && user && access.isLoading ? <p className="text-sm text-[#6A6760]">Checking account permissions…</p> : null}
            {!loading && user && access.data && !access.data.isAdmin ? <div className="p-4 bg-rose-50 border border-rose-200 text-sm text-rose-900 space-y-2"><ShieldAlert className="w-5 h-5" /><p className="font-semibold">This Gmail account is not an authorised JUMP administrator.</p><p className="text-xs">Kindly return to the account selection screen and use the invited Gmail account.</p></div> : null}
            {!loading && user && access.data?.isAdmin && !access.data.hasPassword && access.data.isOwner ? <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); enroll.mutate({ password, confirmPassword }); }}>
              <div className="p-4 bg-[#EAF1F8] border border-[#C6D7E6] text-xs leading-5 text-[#254B6A]"><p className="font-semibold text-[#1A1A1A]">Step 2 of 2 — Create your JUMP password</p><p className="mt-1">Your Gmail confirms who you are. This password protects the JUMP administration console on this device and any future device.</p></div>
              <div className="space-y-2"><Label htmlFor="owner-password">New JUMP administrator password</Label><Input id="owner-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 12 characters" /></div>
              <div className="space-y-2"><Label htmlFor="owner-password-confirm">Confirm password</Label><Input id="owner-password-confirm" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div>
              <Button disabled={enroll.isPending} type="submit" size="lg" className="w-full bg-[#1F4E79] hover:bg-[#153554] text-white rounded-none uppercase tracking-wider text-xs h-12"><KeyRound className="mr-2 w-4 h-4" />{enroll.isPending ? "Securing access…" : "Create secure admin access"}</Button>
            </form> : null}
            {!loading && user && access.data?.isAdmin && access.data.hasPassword ? <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); verify.mutate({ password }); }}>
              <div className="p-4 bg-[#FBF9F5] border border-[#E5E0D5] text-xs text-[#6A6760]"><p className="font-semibold text-[#1A1A1A]">Verified Gmail: {access.data.email}</p><p className="mt-1">Enter your JUMP administrator password to open the console.</p></div>
              <div className="space-y-2"><Label htmlFor="admin-password">JUMP administrator password</Label><Input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></div>
              <Button disabled={verify.isPending} type="submit" size="lg" className="w-full bg-[#1F4E79] hover:bg-[#153554] text-white rounded-none uppercase tracking-wider text-xs h-12"><Lock className="mr-2 w-4 h-4" />{verify.isPending ? "Verifying…" : "Unlock admin console"}</Button>
              <Button type="button" variant="link" disabled={requestReset.isPending || resetRequested} onClick={() => requestReset.mutate()} className="h-auto px-0 text-xs font-semibold text-[#1F4E79] hover:text-[#153554]">{requestReset.isPending ? "Sending reset email…" : "Forgot your JUMP administrator password? Email me a secure reset link."}</Button>
              {resetRequested ? <p className="border border-[#C6D7E6] bg-[#EAF1F8] p-3 text-xs leading-5 text-[#254B6A]">A single-use reset link has been sent to your verified administrator email. Kindly open that email to choose a new password; it expires after 20 minutes.</p> : null}
              <p className="text-[11px] leading-4 text-[#6A6760]">A reset link is sent only after the authorised Gmail account has been verified. For security, the link is single-use and existing administrator sessions are closed after a successful reset.</p>
            </form> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
