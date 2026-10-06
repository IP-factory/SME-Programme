import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { getParticipantPasswordRecoveryMessage, PARTICIPANT_PASSWORD_HELP, validateParticipantPassword } from "@/lib/participantPasswordValidation";
import { ArrowLeft, KeyRound, MailCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { BRAND } from "@shared/brand";

export default function ParticipantPasswordPage() {
  const [, setLocation] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const completePassword = trpc.participant.completePassword.useMutation({
    onSuccess: () => {
      toast.success("Your participant password is ready. Opening your private portal now.");
      window.setTimeout(() => setLocation("/portal"), 250);
    },
    onError: (error) => {
      const message = getParticipantPasswordRecoveryMessage(error.message);
      setFormError(message);
      toast.error(message);
    },
  });

  const submitPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateParticipantPassword(password, confirmPassword);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    completePassword.mutate({ token, password, confirmPassword });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FBF9F5] p-6 text-[#1A1A1A]">
      <div className="w-full max-w-md space-y-6">
        <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#1F4E79] hover:underline">
          <ArrowLeft className="h-4 w-4" />Back to {BRAND.programmeShortName} sign in
        </button>
        <Card className="rounded-none border-[#E5E0D5] bg-white shadow-sm">
          <CardHeader className="space-y-3 pb-6">
            <div className="flex h-10 w-10 items-center justify-center bg-[#EAF1F8] text-[#1F4E79]"><MailCheck className="h-5 w-5" /></div>
            <CardTitle className="font-serif text-2xl font-bold tracking-tight">Set your participant password</CardTitle>
            <CardDescription className="text-sm text-[#6A6760]">This secure email link is single-use. Once complete, use your registered email and password whenever you return to {BRAND.programmeShortName}.</CardDescription>
          </CardHeader>
          <CardContent>
            {!token ? (
              <div className="space-y-4 border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                <p className="font-semibold">This password link is incomplete.</p>
                <p>Return to {BRAND.programmeShortName} and request a new secure password link using your registered email address.</p>
                <Button onClick={() => setLocation("/")} className="rounded-none bg-[#1F4E79] text-xs uppercase tracking-wider text-white hover:bg-[#153554]">Return to sign in</Button>
              </div>
            ) : (
              <form className="space-y-4" noValidate onSubmit={submitPassword}>
                {formError && (
                  <div id="participant-password-error" role="alert" className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-900">
                    <p className="font-semibold">Please review your password.</p>
                    <p className="mt-1">{formError}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="new-participant-password">New participant password</Label>
                  <Input id="new-participant-password" type="password" autoComplete="new-password" value={password} onChange={(event) => { setPassword(event.target.value); setFormError(null); }} placeholder="At least 5 characters" aria-invalid={Boolean(formError)} aria-describedby="participant-password-help participant-password-error" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-participant-password-confirm">Confirm new password</Label>
                  <Input id="new-participant-password-confirm" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setFormError(null); }} aria-invalid={Boolean(formError)} aria-describedby="participant-password-help participant-password-error" />
                </div>
                <Button disabled={completePassword.isPending} type="submit" size="lg" className="w-full rounded-none bg-[#1F4E79] text-xs uppercase tracking-wider text-white hover:bg-[#153554]">
                  <KeyRound className="mr-2 h-4 w-4" />{completePassword.isPending ? "Saving password…" : "Set participant password"}
                </Button>
                <p id="participant-password-help" className="text-[11px] leading-4 text-[#6A6760]">{PARTICIPANT_PASSWORD_HELP}</p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
