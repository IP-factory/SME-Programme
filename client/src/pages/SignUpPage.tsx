import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccount } from "@/hooks/useAccount";
import { trpc } from "@/lib/trpc";
import { validateAccountPassword } from "@shared/auth";
import React, { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";

export default function SignUpPage() {
  const [, setLocation] = useLocation();
  const { account } = useAccount();
  const utils = trpc.useUtils();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "", businessName: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (account) setLocation("/dashboard");
  }, [account, setLocation]);

  const signUp = trpc.account.signUp.useMutation({
    onSuccess: view => {
      utils.account.me.setData(undefined, view);
      setLocation("/dashboard");
    },
    onError: failure => setError(failure.message),
  });

  const set = (key: keyof typeof form) => (event: { target: { value: string } }) => {
    setForm(current => ({ ...current, [key]: event.target.value }));
    setError(null);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.fullName.trim().length < 2) return setError("Enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError("Enter a valid email address.");
    const passwordProblem = validateAccountPassword(form.password);
    if (passwordProblem) return setError(passwordProblem);
    if (form.password !== form.confirmPassword) return setError("The password confirmation does not match.");
    if (form.businessName.trim().length < 2) return setError("Enter your business name.");
    setError(null);
    signUp.mutate(form);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-6 text-ink">
      <div className="w-full max-w-md space-y-6">
        <Card className="rounded-none border-line-soft bg-white shadow-sm">
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="font-serif text-2xl font-bold tracking-tight">Create your account</CardTitle>
            <CardDescription className="text-sm text-ink-muted">Your account is you. Your business is the workspace it belongs to.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" noValidate onSubmit={submit}>
              {error && <div role="alert" className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="signup-full-name">Full name</Label>
                <Input id="signup-full-name" autoComplete="name" value={form.fullName} onChange={set("fullName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" autoComplete="email" value={form.email} onChange={set("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input id="signup-password" type="password" autoComplete="new-password" value={form.password} onChange={set("password")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">Confirm password</Label>
                <Input id="signup-confirm-password" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={set("confirmPassword")} />
              </div>
              <div className="space-y-2 border-t border-line-soft pt-4">
                <Label htmlFor="signup-business-name">Business name</Label>
                <Input id="signup-business-name" autoComplete="organization" value={form.businessName} onChange={set("businessName")} />
              </div>
              <Button disabled={signUp.isPending} type="submit" size="lg" className="w-full rounded-none bg-brand text-xs uppercase tracking-wider text-white hover:bg-brand-deep-hover">
                {signUp.isPending ? "Creating account…" : "Create account"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-sm text-ink-muted">Already have an account? <Link href="/login" className="text-brand underline">Sign in</Link></p>
      </div>
    </main>
  );
}
