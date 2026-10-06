import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, LockKeyhole } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BRAND } from "@shared/brand";

type PackageName = "Foundation" | "Engine Room" | "Boardroom";
type PackageInterest = PackageName | "Not sure yet";
const packageNames: PackageName[] = ["Foundation", "Engine Room", "Boardroom"];

const ageOptions = ["Idea stage, not trading yet", "Less than a year", "1 to 3 years", "3 to 7 years", "7 to 15 years", "More than 15 years"] as const;
const revenueOptions = ["No revenue yet", "Under ₦10m", "₦10m to ₦50m", "₦50m to ₦250m", "₦250m to ₦1bn", "Above ₦1bn", "I would rather not say"] as const;
const teamOptions = ["Just me", "2 to 5", "6 to 20", "21 to 50", "51 to 200", "More than 200"] as const;
const trajectoryOptions = ["Growing fast", "Growing steadily", "Flat, stuck at the same level", "Declining", "Too early to tell"] as const;
const moneyOptions = ["I turn input into units, I make things", "I buy, move and sell, I trade things", "I sell expertise, something you cannot hold", "A mix, and I am not sure which dominates"] as const;
const constraintOptions = ["Not enough customers", "We sell, but we do not make money", "Cash is always tight", "Everything runs through me", "We cannot deliver consistently", "We have no plan, just activity", "We are stuck at a ceiling", "Something else"] as const;
const weakAreaOptions = ["Strategy and direction", "Business model and pricing", "Market and competition", "Brand, marketing and sales", "Operations and systems", "Finance, cash and funding", "People and organisation", "Risk and what could go wrong", "Exit and succession"] as const;
const urgencyOptions = ["We are in trouble now", "A big decision in the next 90 days", "Building towards next year", "I simply want to learn this properly"] as const;
const sourceOptions = ["A past participant", "Emmanuel directly", "LinkedIn", "WhatsApp", "Instagram or Facebook", "Somewhere else"] as const;

type FormData = {
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  businessDescription: string;
  businessAge: typeof ageOptions[number] | "";
  revenueBand: typeof revenueOptions[number] | "";
  teamSize: typeof teamOptions[number] | "";
  trajectory: typeof trajectoryOptions[number] | "";
  moneyMechanism: typeof moneyOptions[number] | "";
  primaryConstraint: typeof constraintOptions[number] | "";
  weakAreas: typeof weakAreaOptions[number][];
  urgency: typeof urgencyOptions[number] | "";
  packageInterest: PackageInterest;
  boardroomDecision: string;
  source: typeof sourceOptions[number] | "";
  consent: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPackage: PackageName;
};

type Readout = {
  stage: string;
  engineRoom: string;
  constraint: string;
  constraintMeaning: string;
  classes: [string, string];
  urgencyLine?: string;
};

type SubmitResult = {
  success: boolean;
  status: string;
  message: string;
  emailStatus?: "Sent" | "Simulated" | "Failed";
  diagnostic?: Readout;
};

function freshForm(packageInterest: PackageName): FormData {
  return {
    fullName: "",
    email: "",
    phone: "",
    businessName: "",
    businessDescription: "",
    businessAge: "",
    revenueBand: "",
    teamSize: "",
    trajectory: "",
    moneyMechanism: "",
    primaryConstraint: "",
    weakAreas: [],
    urgency: "",
    packageInterest,
    boardroomDecision: "",
    source: "",
    consent: false,
  };
}

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || "There";
}

export default function DiagnosticRegistrationDialog({ open, onOpenChange, selectedPackage }: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(() => freshForm(selectedPackage));
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<SubmitResult | null>(null);
  const referralCode = useMemo(() => new URLSearchParams(window.location.search).get("ref")?.trim() || undefined, []);
  const registerMutation = trpc.registration.submit.useMutation({
    onSuccess: (result) => {
      setSubmitted(result);
      toast.success("Your mirror readout is ready.");
    },
    onError: (err) => {
      setError(err.message || "We could not save your application. Please try again.");
      toast.error(err.message || "We could not save your application.");
    },
  });

  useEffect(() => {
    if (open) {
      setStep(1);
      setError("");
      setSubmitted(null);
      setForm(freshForm(selectedPackage));
    }
  }, [open, selectedPackage]);

  const progress = useMemo(() => `${(step / 4) * 100}%`, [step]);
  const setField = <K extends keyof FormData>(field: K, value: FormData[K]) => setForm((current) => ({ ...current, [field]: value }));
  const toggleWeakArea = (value: typeof weakAreaOptions[number]) => {
    setForm((current) => {
      if (current.weakAreas.includes(value)) return { ...current, weakAreas: current.weakAreas.filter((item) => item !== value) };
      if (current.weakAreas.length >= 2) {
        setError("Choose exactly two areas. The discipline of choosing is part of the exercise.");
        return current;
      }
      return { ...current, weakAreas: [...current.weakAreas, value] };
    });
  };

  const validateStep = () => {
    if (step === 1) {
      if (!form.fullName || !form.email || !form.phone || !form.businessName) return "Please complete your contact details before continuing.";
      if (form.businessDescription.trim().length < 10) return "Describe what the business does in one plain-language sentence.";
    }
    if (step === 2 && (!form.businessAge || !form.revenueBand || !form.teamSize || !form.trajectory || !form.moneyMechanism)) return "Choose one answer in each section so we can reflect the business accurately.";
    if (step === 3 && (!form.primaryConstraint || form.weakAreas.length !== 2 || !form.urgency)) return "Choose one constraint, exactly two weak areas, and one urgency level.";
    if (step === 4 && (!form.packageInterest || !form.source || !form.consent)) return `Choose a package direction, tell us how you heard about ${BRAND.programmeShortName}, and give consent to review your application.`;
    return "";
  };

  const handleContinue = () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    if (step < 4) setStep((current) => current + 1);
    else {
      const businessModel = form.moneyMechanism === "I turn input into units, I make things" ? "Maker" : form.moneyMechanism === "I buy, move and sell, I trade things" ? "Trader" : "Expert";
      const storedPackage: PackageName = form.packageInterest === "Not sure yet" ? "Foundation" : form.packageInterest;
      registerMutation.mutate({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        businessName: form.businessName,
        businessDescription: form.businessDescription,
        businessModel,
        package: storedPackage,
        question: [form.primaryConstraint, form.boardroomDecision, form.source].filter(Boolean).join(" · "),
        diagnostic: {
          businessAge: form.businessAge as typeof ageOptions[number],
          revenueBand: form.revenueBand as typeof revenueOptions[number],
          teamSize: form.teamSize as typeof teamOptions[number],
          trajectory: form.trajectory as typeof trajectoryOptions[number],
          moneyMechanism: form.moneyMechanism as typeof moneyOptions[number],
          primaryConstraint: form.primaryConstraint as typeof constraintOptions[number],
          weakAreas: form.weakAreas as typeof weakAreaOptions[number][],
          urgency: form.urgency as typeof urgencyOptions[number],
          packageInterest: form.packageInterest,
          boardroomDecision: form.boardroomDecision || undefined,
          source: form.source as typeof sourceOptions[number],
          consent: true,
        },
        referralCode,
      });
    }
  };

  const renderChips = (options: readonly string[], value: string, onChange: (next: string) => void) => (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button key={option} type="button" onClick={() => onChange(option)} className={`min-h-11 rounded-full border px-3 py-2 text-left text-xs transition-colors ${value === option ? "border-brand bg-brand font-semibold text-paper" : "border-line-stronger bg-paper text-ink-600 hover:border-brand hover:bg-brand-tint"}`}>{option}</button>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-paper border border-line text-ink max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-bold">The {BRAND.programmeName} mirror</DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-ink-soft">Four short steps. No wrong answers, no grading, and no essays. You will receive a first read of what your answers suggest before you leave this form.</DialogDescription>
          {!submitted && <div className="pt-3"><div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-ink-muted"><span>Step {step} of 4</span><span>About three minutes</span></div><div className="mt-2 h-1.5 bg-line"><div className="h-1.5 bg-brand transition-all" style={{ width: progress }} /></div></div>}
        </DialogHeader>

        {submitted ? (
          <div className="space-y-6 py-4">
            <div className="text-center"><CheckCircle2 className="mx-auto h-14 w-14 text-emerald-700" /><h3 className="mt-4 font-serif text-3xl font-bold">{firstName(form.fullName)}, here is what we can already see.</h3><p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">{submitted.message}</p></div>
            {submitted.diagnostic ? <>
              <div className="grid gap-3 sm:grid-cols-3"><ReadoutItem label="Your stage" value={submitted.diagnostic.stage} /><ReadoutItem label="Your Engine Room" value={submitted.diagnostic.engineRoom} /><ReadoutItem label="The constraint you named" value={submitted.diagnostic.constraint} /></div>
              <div className="border-l-2 border-brand bg-paper-sunken p-5"><p className="text-[10px] uppercase tracking-[0.18em] text-ink-muted">What that usually means</p><p className="mt-2 font-serif text-lg leading-relaxed">{submitted.diagnostic.constraintMeaning}</p></div>
              <div><p className="text-[10px] uppercase tracking-[0.18em] text-ink-muted">The two classes that will matter most to you</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{submitted.diagnostic.classes.map((item) => <div key={item} className="bg-ink p-5 text-paper"><p className="font-serif text-xl">{item}</p><p className="mt-2 text-xs leading-relaxed text-on-dark-muted">You will work this against the assigned textbook and your own numbers, not just listen to a lecture.</p></div>)}</div></div>
              {submitted.diagnostic.urgencyLine && <div className="border border-brand-line bg-brand-tint p-4 text-sm text-brand">{submitted.diagnostic.urgencyLine}</div>}
            </> : null}
            <div className="border-t border-line pt-4 text-xs italic leading-relaxed text-ink-muted">This is a first read from five answers, not a diagnosis. The real one happens in the room, against your numbers.</div>
            <div className="flex items-start gap-3 border border-brand-line bg-brand-tint p-4 text-xs leading-relaxed text-brand"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" /><span>Your answers are private and visible only to the {BRAND.programmeShortName} programme owner. If your application is accepted and the 40% commitment is confirmed, you will receive a private link to choose your Decide, Learn, or Apply sessions.</span></div>
            <Button onClick={() => onOpenChange(false)} className="w-full rounded-none bg-ink py-6 text-xs uppercase tracking-wider text-paper">Close and return to the programme</Button>
          </div>
        ) : (
          <div className="space-y-6 pt-4">
            {step === 1 && <div className="space-y-5"><StepIntro number="01" title="About you" copy="Start with the business in plain language. This is the first exercise in the programme, and it is harder than it looks." /><div className="grid gap-4 sm:grid-cols-2"><Field label="Full name" value={form.fullName} onChange={(value) => setField("fullName", value)} placeholder="Your full name" /><Field label="Email address" type="email" value={form.email} onChange={(value) => setField("email", value)} placeholder="you@company.com" /><Field label="Phone (WhatsApp)" value={form.phone} onChange={(value) => setField("phone", value)} placeholder="+234 ..." /><Field label="Business name" value={form.businessName} onChange={(value) => setField("businessName", value)} placeholder="Your business name" /></div><div className="space-y-2"><Label className="text-xs uppercase tracking-wider text-ink-muted">What does your business do?</Label><Textarea value={form.businessDescription} onChange={(event) => setField("businessDescription", event.target.value)} rows={3} placeholder="One plain-language sentence. No adjectives." className="border-line bg-paper-sunken" /><p className="text-[11px] text-ink-muted">This is the first exercise in the programme, and it is harder than it looks.</p></div></div>}
            {step === 2 && <div className="space-y-6"><StepIntro number="02" title="Where the business is" copy={`Ranges are fine. Nobody sees this but ${BRAND.facilitatorFirstName}.`} /><Question label="How long has the business been running?" options={ageOptions} value={form.businessAge} onChange={(value) => setField("businessAge", value as FormData["businessAge"])} renderChips={renderChips} /><Question label="Revenue in the last twelve months" options={revenueOptions} value={form.revenueBand} onChange={(value) => setField("revenueBand", value as FormData["revenueBand"])} renderChips={renderChips} /><Question label="How many people work in the business?" options={teamOptions} value={form.teamSize} onChange={(value) => setField("teamSize", value as FormData["teamSize"])} renderChips={renderChips} /><Question label="Which way has it been moving this past year?" options={trajectoryOptions} value={form.trajectory} onChange={(value) => setField("trajectory", value as FormData["trajectory"])} renderChips={renderChips} /><Question label="How does the business actually make its money?" options={moneyOptions} value={form.moneyMechanism} onChange={(value) => setField("moneyMechanism", value as FormData["moneyMechanism"])} renderChips={renderChips} /></div>}
            {step === 3 && <div className="space-y-6"><StepIntro number="03" title="Where it hurts" copy="Choose one main constraint and be honest about the two areas you understand least." /><Question label="If you could fix one thing tomorrow, what would it be?" options={constraintOptions} value={form.primaryConstraint} onChange={(value) => setField("primaryConstraint", value as FormData["primaryConstraint"])} renderChips={renderChips} /><div className="space-y-2"><QuestionLabel>Which two do you understand least?</QuestionLabel><div className="flex flex-wrap gap-2">{weakAreaOptions.map((option) => <button key={option} type="button" onClick={() => toggleWeakArea(option)} className={`min-h-11 rounded-full border px-3 py-2 text-left text-xs transition-colors ${form.weakAreas.includes(option) ? "border-brand bg-brand font-semibold text-paper" : "border-line-stronger bg-paper text-ink-600 hover:border-brand hover:bg-brand-tint"}`}>{option}</button>)}</div><p className="text-[11px] text-ink-muted">Pick exactly two. Honesty here is worth more than modesty.</p></div><Question label="How urgent is this for you?" options={urgencyOptions} value={form.urgency} onChange={(value) => setField("urgency", value as FormData["urgency"])} renderChips={renderChips} /></div>}
            {step === 4 && <div className="space-y-6"><StepIntro number="04" title={`How you want to work with ${BRAND.facilitatorFirstName}`} copy="This is not binding. If you are not sure, say so and we will advise you honestly." /><Question label="Which package interests you?" options={[...packageNames, "Not sure yet"]} value={form.packageInterest} onChange={(value) => setField("packageInterest", value as PackageInterest)} renderChips={renderChips} /><div className="border border-brand-line bg-brand-tint p-3 text-[11px] leading-relaxed text-brand">Note: Selecting a higher tier (Engine Room or Boardroom) comprehensively includes all foundational access. Tiers are cumulative, so there is no double payment.</div>{form.packageInterest === "Boardroom" && <div className="space-y-2"><QuestionLabel>What decision are you trying to make in the next 90 days?</QuestionLabel><Textarea value={form.boardroomDecision} onChange={(event) => setField("boardroomDecision", event.target.value)} rows={3} placeholder={`This helps ${BRAND.facilitatorFirstName} understand the fit for the Boardroom.`} className="border-line bg-paper-sunken" /></div>}<Question label={`How did you hear about ${BRAND.programmeShortName}?`} options={sourceOptions} value={form.source} onChange={(value) => setField("source", value as FormData["source"])} renderChips={renderChips} /><label className="flex items-start gap-3 border border-line bg-paper-sunken p-4 text-xs leading-relaxed text-ink-soft"><input type="checkbox" checked={form.consent} onChange={(event) => setField("consent", event.target.checked)} className="mt-0.5 h-4 w-4 accent-brand" />I consent to {BRAND.facilitatorFirstName} and the {BRAND.programmeShortName} programme team reviewing my application and contacting me about fit, payment, and scheduling.</label></div>}
            {error && <div className="flex items-start gap-2 border border-danger-line bg-danger-tint p-3 text-xs text-danger-strong"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
            <div className="flex flex-col-reverse gap-3 border-t border-line pt-4 sm:flex-row sm:justify-between"><Button type="button" variant="outline" onClick={() => { setError(""); setStep((current) => Math.max(1, current - 1)); }} disabled={step === 1 || registerMutation.isPending} className="rounded-none border-brand text-brand"><ChevronLeft className="mr-2 h-4 w-4" />Back</Button><Button type="button" onClick={handleContinue} disabled={registerMutation.isPending} className="rounded-none bg-ink py-6 text-xs uppercase tracking-wider text-paper">{registerMutation.isPending ? "Saving your mirror..." : step === 4 ? "Send my interest" : "Continue"}{!registerMutation.isPending && (step === 4 ? <CheckCircle2 className="ml-2 h-4 w-4" /> : <ChevronRight className="ml-2 h-4 w-4" />)}</Button></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StepIntro({ number, title, copy }: { number: string; title: string; copy: string }) { return <div><p className="text-[10px] uppercase tracking-[0.18em] text-brand">Step {number}</p><h3 className="mt-1 font-serif text-3xl font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-ink-soft">{copy}</p></div>; }
function QuestionLabel({ children }: { children: React.ReactNode }) { return <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{children}</p>; }
function Question({ label, options, value, onChange, renderChips }: { label: string; options: readonly string[]; value: string; onChange: (value: string) => void; renderChips: (options: readonly string[], value: string, onChange: (next: string) => void) => React.ReactNode }) { return <div className="space-y-2"><QuestionLabel>{label}</QuestionLabel>{renderChips(options, value, onChange)}</div>; }
function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) { return <div className="space-y-2"><Label className="text-xs uppercase tracking-wider text-ink-muted">{label} *</Label><Input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="border-line bg-paper-sunken" required /></div>; }
function ReadoutItem({ label, value }: { label: string; value: string }) { return <div className="border border-line bg-paper-sunken p-4"><p className="text-[10px] uppercase tracking-[0.16em] text-ink-muted">{label}</p><p className="mt-2 font-serif text-lg leading-snug">{value}</p></div>; }
