import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, KeyRound, MailCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function AdminPasswordResetPage() {
  const [, setLocation] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const completeReset = trpc.adminAccess.confirmPasswordReset.useMutation({
    onSuccess: () => {
      toast.success("Your JUMP administrator password has been reset. Kindly sign in again.");
      setPassword("");
      setConfirmPassword("");
      setLocation("/admin/login");
    },
    onError: (error) => toast.error(error.message),
  });

  return <div className="flex min-h-screen items-center justify-center bg-[#FBF9F5] p-6 text-[#1A1A1A]"><div className="w-full max-w-md space-y-6"><button onClick={() => setLocation("/admin/login")} className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#1F4E79] hover:underline"><ArrowLeft className="h-4 w-4" />Back to secure admin sign in</button><Card className="rounded-none border-[#E5E0D5] bg-white shadow-sm"><CardHeader className="space-y-3 pb-6"><div className="flex h-10 w-10 items-center justify-center bg-[#EAF1F8] text-[#1F4E79]"><MailCheck className="h-5 w-5" /></div><CardTitle className="font-serif text-2xl font-bold tracking-tight">Choose a new admin password</CardTitle><CardDescription className="text-sm text-[#6A6760]">This secure email link is single-use. On completion, all current JUMP administrator sessions will be closed.</CardDescription></CardHeader><CardContent>{!token ? <div className="space-y-4 border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"><p className="font-semibold">This reset link is incomplete.</p><p>Kindly request a new password-reset email from the administrator sign-in page.</p><Button onClick={() => setLocation("/admin/login")} className="rounded-none bg-[#1F4E79] text-xs uppercase tracking-wider text-white hover:bg-[#153554]">Return to sign in</Button></div> : <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); completeReset.mutate({ token, password, confirmPassword }); }}><div className="space-y-2"><Label htmlFor="new-admin-password">New JUMP administrator password</Label><Input id="new-admin-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 12 characters" /></div><div className="space-y-2"><Label htmlFor="new-admin-password-confirm">Confirm new password</Label><Input id="new-admin-password-confirm" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div><Button disabled={completeReset.isPending} type="submit" size="lg" className="w-full rounded-none bg-[#1F4E79] text-xs uppercase tracking-wider text-white hover:bg-[#153554]"><KeyRound className="mr-2 h-4 w-4" />{completeReset.isPending ? "Securing new password…" : "Set new administrator password"}</Button><p className="text-[11px] leading-4 text-[#6A6760]">Use at least 12 characters and at least three of uppercase letters, lowercase letters, numbers, and symbols.</p></form>}</CardContent></Card></div></div>;
}
