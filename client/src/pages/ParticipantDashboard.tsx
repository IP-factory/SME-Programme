import { useRoute } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Video, CheckCircle2, Clock, ShieldAlert, ArrowRight, ExternalLink, Sparkles, Copy, Share2, Gift } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProgrammeProgressTracker } from "@/components/ProgrammeProgressTracker";
import { StructuredDiagnostic } from "@/components/StructuredDiagnostic";
import PricingRequestDialog from "@/components/PricingRequestDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BRAND } from "@shared/brand";

const FOUNDATION_CLASSES = [
  { date: "Sunday, 6 September 2026", time: "9:00 pm" },
  { date: "Sunday, 13 September 2026", time: "9:00 pm" },
  { date: "Saturday, 19 September 2026", time: "7:00 pm" },
  { date: "Sunday, 27 September 2026", time: "9:00 pm" },
  { date: "Saturday, 3 October 2026", time: "7:00 pm" },
] as const;

function getInitialPortalTab() {
  if (typeof window === "undefined") return "assessment";

  const requestedTab = new URLSearchParams(window.location.search).get("tab");
  if (requestedTab === "programme" || requestedTab === "assessment" || requestedTab === "payment" || requestedTab === "documents" || requestedTab === "sessions") {
    return requestedTab;
  }

  return "assessment";
}

export default function ParticipantDashboard() {
  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.participant.dashboard.useQuery(undefined, { retry: false });

  const { data: assignments } = trpc.participant.listAssignments.useQuery();
  const { data: paymentReceipts } = trpc.participant.listPaymentReceipts.useQuery(undefined, {
    enabled: Boolean(data?.engagement.hasConsented),
  });

  const { data: paymentGuidance } = trpc.participant.paymentGuidance.useQuery(undefined, {
    enabled: Boolean(data),
    retry: false,
  });
  const { data: referralShare } = trpc.referrals.share.useQuery(undefined, {
    enabled: Boolean(data?.engagement.hasConsented),
    retry: false,
  });

  const [hasReadBrief, setHasReadBrief] = useState(false);
  const [referralLinkCopied, setReferralLinkCopied] = useState(false);
  const [isAssignmentUploading, setIsAssignmentUploading] = useState(false);
  const [isReceiptUploading, setIsReceiptUploading] = useState(false);
  const [receiptMilestone, setReceiptMilestone] = useState<"deposit" | "instalment_1" | "instalment_2" | "full_upfront">("deposit");
  const [receiptNote, setReceiptNote] = useState("");
  const [activePortalTab, setActivePortalTab] = useState(getInitialPortalTab);
  const [isPricingRequestOpen, setIsPricingRequestOpen] = useState(false);

  useEffect(() => {
    const syncRequestedTab = () => setActivePortalTab(getInitialPortalTab());
    syncRequestedTab();
    window.addEventListener("popstate", syncRequestedTab);
    return () => window.removeEventListener("popstate", syncRequestedTab);
  }, []);

  const copyReferralLink = async () => {
    if (!referralShare?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(referralShare.shareUrl);
      setReferralLinkCopied(true);
      window.setTimeout(() => setReferralLinkCopied(false), 1800);
    } catch {
      alert(`Kindly copy this link manually: ${referralShare.shareUrl}`);
    }
  };

  const uploadAssignmentMutation = trpc.participant.uploadAssignment.useMutation({
    onSuccess: () => {
      utils.participant.listAssignments.invalidate();
      alert("Assignment submitted successfully!");
    },
    onError: (err) => {
      alert("Failed to submit assignment: " + err.message);
    },
  });

  const submitPaymentReceiptMutation = trpc.participant.submitPaymentReceipt.useMutation({
    onSuccess: () => {
      utils.participant.listPaymentReceipts.invalidate();
      setReceiptNote("");
      alert(`Your payment receipt has been submitted for ${BRAND.facilitatorFirstName}’s confirmation. Your payment status will not change until it is reviewed.`);
    },
    onError: (err) => {
      alert("We could not record your payment receipt: " + err.message);
    },
  });

  const acknowledgeBriefMutation = trpc.participant.acknowledgeEngagementBrief.useMutation({
    onSuccess: () => {
      utils.participant.dashboard.invalidate();
    },
    onError: (err) => {
      alert("We could not record your acknowledgement: " + err.message);
    },
  });

  if (error || (!data && !isLoading)) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-[#1F4E79]/20 shadow-lg bg-white">
          <CardHeader className="text-center space-y-2">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <CardTitle className="font-serif text-2xl text-[#1F4E79]">Sign in to your private portal</CardTitle>
            <CardDescription>
              Use your registered email address and {BRAND.programmeShortName} participant password to return to your private portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            <Button type="button" onClick={() => window.location.assign("/?participant_signin=1")} className="w-full bg-[#1F4E79] hover:bg-[#163859] text-white">
              Sign in with email and password
            </Button>
            <p className="text-center text-xs leading-5 text-slate-500">First time here or forgotten your password? The sign-in page can send a short-lived, single-use password setup or reset link to your registered email address.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#1F4E79] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif text-lg text-[#1F4E79]">Loading your {BRAND.programmeName} participant portal...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { applicant, bookings, briefs, engagement } = data;

  if (!engagement.hasConsented) {
    const brief = engagement.brief;
    return (
      <div className="min-h-screen bg-[#FBF9F5] text-slate-900">
        <header className="bg-[#1F4E79] px-6 py-7 text-white shadow-md md:px-12">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">{BRAND.programmeName} · Private participant portal</p>
            <h1 className="mt-2 font-serif text-3xl">Your engagement brief</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-100">Review your personalised brief and payment guidance. Acknowledging the brief unlocks the assessment, document sharing, and eligible session selection.</p>
          </div>
        </header>

        <main className="mx-auto max-w-4xl space-y-6 px-5 py-8 md:px-8 md:py-12">
          <ProgrammeProgressTracker
            briefAcknowledged={false}
            pathway={applicant.package as "Foundation" | "Engine Room" | "Boardroom"}
          />

          <div className="border-l-4 border-l-amber-400 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1F4E79]">Prepared for {applicant.businessName}</p>
            <p className="mt-3 font-serif text-2xl leading-snug text-[#1F4E79]">{brief.welcome}</p>
          </div>

          <Card className="border-[#1F4E79]/20 bg-white shadow-sm" aria-labelledby="initial-perspective-heading">
            <CardHeader>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Personalised starting point</p>
              <CardTitle id="initial-perspective-heading" className="mt-1 font-serif text-2xl text-[#1F4E79]">{brief.initialPerspective.heading}</CardTitle>
              <CardDescription className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{brief.initialPerspective.summary}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
                <p className="font-semibold text-amber-900">Potential challenge to explore</p>
                <p className="mt-2">{brief.initialPerspective.potentialChallenge}</p>
              </div>
              <div className="rounded-xl border border-[#1F4E79]/15 bg-[#F2F6FA] p-5 text-sm leading-6 text-[#1F4E79]">
                <p className="font-semibold">What this may point to in the sessions</p>
                <p className="mt-2">{brief.initialPerspective.exploration}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#1F4E79]/20 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-2xl text-[#1F4E79]">{brief.programme.heading}</CardTitle>
              <CardDescription className="max-w-3xl text-sm leading-6 text-slate-600">{brief.programme.body}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {brief.programme.outcomes.map((outcome) => (
                  <div key={outcome} className="flex gap-3 rounded-lg border border-[#1F4E79]/10 bg-[#FBF9F5] p-4 text-sm leading-6 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{outcome}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#1F4E79]/20 bg-white shadow-sm">
            <CardHeader>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">Your selected pathway · {brief.selectedPackage}</p>
              <CardTitle className="font-serif text-xl text-[#1F4E79]">{brief.package.heading}</CardTitle>
              <CardDescription className="leading-6">{brief.package.summary}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {brief.package.included.map((item) => <div key={item} className="rounded-md bg-[#F4F1E8] p-3 text-sm leading-6 text-slate-700">{item}</div>)}
            </CardContent>
          </Card>

          <Card className="border-[#1F4E79]/20 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-xl text-[#1F4E79]">{brief.calendar.heading}</CardTitle>
              <CardDescription className="leading-6">{brief.calendar.body}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-l-4 border-l-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>Current State Assessment:</strong> {brief.diagnostic}</div>
              <div className="border-l-4 border-l-emerald-600 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><strong>Payment framework:</strong> {brief.payment.body}</div>
            </CardContent>
          </Card>
          {paymentGuidance && <Card className="border-[#1F4E79]/20 bg-white shadow-sm" aria-labelledby="pre-consent-payment-guidance-heading">
            <CardHeader>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Private payment guidance</p>
              <CardTitle id="pre-consent-payment-guidance-heading" className="mt-1 font-serif text-2xl text-[#1F4E79]">Your {paymentGuidance.packageName} payment schedule</CardTitle>
              <CardDescription className="mt-2 max-w-3xl leading-6">Your pathway-specific fee, instalment schedule, and approved payment routes are available below. You may review this before acknowledging your engagement brief.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border border-[#1F4E79]/10 bg-[#FBF9F5] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Programme fee</p><p className="mt-1 font-serif text-lg text-[#1F4E79]">{paymentGuidance.fullProgrammeFee}</p></div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-amber-800">First commitment · 40%</p><p className="mt-1 font-serif text-lg text-amber-950">{paymentGuidance.commitmentPayment}</p></div>
                <div className="rounded-lg border border-[#1F4E79]/10 bg-[#FBF9F5] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">End September · 30%</p><p className="mt-1 font-serif text-lg text-[#1F4E79]">{paymentGuidance.firstInstalment}</p></div>
                <div className="rounded-lg border border-[#1F4E79]/10 bg-[#FBF9F5] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mid October · 30%</p><p className="mt-1 font-serif text-lg text-[#1F4E79]">{paymentGuidance.secondInstalment}</p></div>
              </div>
              <div className="rounded-lg border-l-4 border-l-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>10% full-upfront option:</strong> {paymentGuidance.fullUpfrontFee}. {paymentGuidance.fullUpfrontNote}</div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {paymentGuidance.paymentRoutes.map((route) => <section key={route.id} className="rounded-xl border border-[#1F4E79]/15 bg-[#FBF9F5] p-5" aria-label={`${route.title} payment instructions`}><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">{route.eyebrow}</p><h3 className="mt-1 font-serif text-xl text-[#1F4E79]">{route.title}</h3><dl className="mt-4 space-y-2 text-sm leading-5 text-slate-700">{route.details.map((detail) => <div key={detail.label} className="flex flex-col gap-0.5 border-b border-[#1F4E79]/10 pb-2 last:border-b-0"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{detail.label}</dt><dd className="font-medium text-slate-900">{detail.value}</dd></div>)}</dl><p className="mt-4 border-l-2 border-amber-400 pl-3 text-xs leading-5 text-slate-700">{route.note}</p></section>)}
              </div>
              <p className="text-sm leading-6 text-slate-600">{paymentGuidance.confirmationNote} Payment-receipt upload and session selection become available after you acknowledge your engagement brief.</p>
            </CardContent>
          </Card>}
          <Card className="border-[#1F4E79] bg-[#1F4E79] text-white shadow-lg">
            <CardHeader>
              <CardTitle className="font-serif text-2xl text-white">Acknowledge and continue</CardTitle>
              <CardDescription className="leading-6 text-blue-100">{brief.consentStatement}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-white/25 bg-white/10 p-4 text-sm leading-6 text-white">
                <input type="checkbox" checked={hasReadBrief} onChange={(event) => setHasReadBrief(event.target.checked)} className="mt-1 h-4 w-4 accent-amber-400" />
                <span>I have read this personalised project brief and am ready to proceed to the next steps.</span>
              </label>
              <Button
                disabled={!hasReadBrief || acknowledgeBriefMutation.isPending}
                onClick={() => acknowledgeBriefMutation.mutate({ confirmed: true })}
                className="w-full bg-amber-400 py-6 text-sm font-semibold text-[#1F4E79] hover:bg-amber-300"
              >
                {acknowledgeBriefMutation.isPending ? "Recording your acknowledgement…" : "I have read and consent to the terms"}
                {!acknowledgeBriefMutation.isPending && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
              <p className="text-center text-xs leading-5 text-blue-100">A dated confirmation will be emailed to you, with {BRAND.facilitatorFirstName}’s office copied privately for the programme record.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-slate-900 font-sans">
      {/* Top Banner */}
      <header className="bg-[#1F4E79] text-white py-6 px-6 md:px-12 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-300 text-xs tracking-widest uppercase font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" /> {BRAND.programmeFullName}
            </div>
            <h1 className="font-serif text-3xl font-normal tracking-tight">
              Welcome, {applicant.fullName}
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              {applicant.businessName} • <span className="text-amber-200 font-medium">{applicant.package} Track</span> ({applicant.businessModel})
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-lg border border-white/20">
            <div className="text-right">
              <p className="text-xs text-blue-200 uppercase tracking-wider">Status</p>
              <p className="font-medium text-sm text-amber-300">{applicant.status}</p>
            </div>
            <div className="h-8 w-px bg-white/20 mx-1" />
            <div>
              <p className="text-xs text-blue-200 uppercase tracking-wider">Commitment</p>
              <p className="font-medium text-sm text-emerald-300">
                {applicant.depositPaid === "Paid" ? "40% Paid" : "Pending 40%"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 md:px-12 py-10">
        <Tabs value={activePortalTab} onValueChange={setActivePortalTab} className="gap-8">
          <div className="overflow-x-auto pb-1">
            <TabsList className="h-auto min-w-max gap-1 bg-[#EAF1F8] p-1.5">
              <TabsTrigger value="programme" className="px-4 py-2.5 text-[#1F4E79] data-[state=active]:bg-white data-[state=active]:text-[#1F4E79]">Programme</TabsTrigger>
              <TabsTrigger value="assessment" className="px-4 py-2.5 text-[#1F4E79] data-[state=active]:bg-white data-[state=active]:text-[#1F4E79]">Current State Assessment</TabsTrigger>
              <TabsTrigger value="payment" className="px-4 py-2.5 text-[#1F4E79] data-[state=active]:bg-white data-[state=active]:text-[#1F4E79]">Payment</TabsTrigger>
              <TabsTrigger value="documents" className="px-4 py-2.5 text-[#1F4E79] data-[state=active]:bg-white data-[state=active]:text-[#1F4E79]">Documents</TabsTrigger>
              <TabsTrigger value="sessions" className="px-4 py-2.5 text-[#1F4E79] data-[state=active]:bg-white data-[state=active]:text-[#1F4E79]">Sessions</TabsTrigger>
            </TabsList>
          </div>

        {activePortalTab === "programme" && (
          <div className="space-y-10">
        <Card className="border-[#1F4E79]/20 bg-[#EAF1F8] shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1F4E79]">Brief acknowledged</p>
                <CardTitle className="mt-1 font-serif text-2xl text-[#1F4E79]">Your next steps</CardTitle>
                <CardDescription className="mt-2 max-w-2xl leading-6 text-slate-600">Your personalised engagement brief has been recorded. Move through these steps at your own pace; your assessment responses will shape the advisory work around your business.</CardDescription>
              </div>
              <Badge className="w-fit border-emerald-200 bg-emerald-50 text-emerald-800">Acknowledged {engagement.acknowledgedAt ? new Date(engagement.acknowledgedAt).toLocaleDateString() : ""}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-[#1F4E79]/10 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wider text-[#1F4E79]">01 · Start here</p><p className="mt-2 text-sm leading-6 text-slate-700">Complete the Current State Assessment so {BRAND.facilitatorFirstName} can add depth to the initial diagnosis.</p></div>
            <div className="rounded-lg border border-[#1F4E79]/10 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wider text-[#1F4E79]">02 · Confirm commitment</p><p className="mt-2 text-sm leading-6 text-slate-700">Review your payment status and follow the 40/30/30 structure communicated in your brief.</p></div>
            <div className="rounded-lg border border-[#1F4E79]/10 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wider text-[#1F4E79]">03 · Choose sessions</p><p className="mt-2 text-sm leading-6 text-slate-700">After the 40% commitment is confirmed, eligible calendar slots open on a first-come, first-served basis.</p></div>
          </CardContent>
        </Card>

        <ProgrammeProgressTracker
          briefAcknowledged
          pathway={(paymentGuidance?.packageName ?? "Foundation") as "Foundation" | "Engine Room" | "Boardroom"}
        />

        {referralShare && (
          <Card className="border-[#1F4E79]/20 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">{BRAND.programmeShortName} community introduction</p>
                  <CardTitle className="mt-1 flex items-center gap-2 font-serif text-2xl text-[#1F4E79]"><Share2 className="h-5 w-5" />Share this programme with someone</CardTitle>
                  <CardDescription className="mt-2 max-w-3xl leading-6 text-slate-600">If you know a business leader who may genuinely benefit, kindly share your personal programme link. We will record the introduction when they apply; any credit is reviewed by {BRAND.facilitatorFirstName}, never applied automatically.</CardDescription>
                </div>
                <Badge className="w-fit border-amber-200 bg-amber-50 text-amber-900"><Gift className="mr-1 h-3.5 w-3.5" />{referralShare.availableCreditSlots} credit {referralShare.availableCreditSlots === 1 ? "place" : "places"} available</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-[#1F4E79]/10 bg-[#F2F6FA] p-4 text-sm leading-6 text-[#1F4E79]">{referralShare.policySummary}</div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={copyReferralLink} variant="outline" className="border-[#1F4E79]/30 text-[#1F4E79] hover:bg-[#EAF1F8]"><Copy className="mr-2 h-4 w-4" />{referralLinkCopied ? "Personal link copied" : "Copy my personal link"}</Button>
                <Button asChild className="bg-[#1F4E79] text-white hover:bg-[#153554]"><a href={`https://wa.me/?text=${encodeURIComponent(`I thought this ${BRAND.programmeName} programme may be useful for your business. Kindly take a look here: ${referralShare.shareUrl}`)}`} target="_blank" rel="noreferrer"><Share2 className="mr-2 h-4 w-4" />Share by WhatsApp</a></Button>
              </div>
              {referralShare.referrals.length > 0 && <p className="text-xs leading-5 text-slate-500">Your recorded introductions: {referralShare.referrals.length}. Approved referral credits: {referralShare.approvedCount}.</p>}
            </CardContent>
          </Card>
        )}
          </div>
        )}

        {activePortalTab === "payment" && paymentGuidance && (
          <Card className="border-[#1F4E79]/20 bg-white shadow-sm" aria-labelledby="payment-guidance-heading">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Private payment guidance</p>
                  <CardTitle id="payment-guidance-heading" className="mt-1 font-serif text-2xl text-[#1F4E79]">Confirm your commitment</CardTitle>
                  <CardDescription className="mt-2 max-w-3xl leading-6">Your selected {paymentGuidance.packageName} pathway follows a {paymentGuidance.structure} structure. Kindly select the private Nigeria, UK, or U.S. route that is most suitable for you, then submit your confirmation below.</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2"><Badge className="w-fit border-amber-200 bg-amber-50 text-amber-900">Payment awaiting confirmation</Badge><Button type="button" variant="outline" size="sm" onClick={() => setIsPricingRequestOpen(true)} className="border-[#1F4E79]/30 text-xs text-[#1F4E79] hover:bg-[#EAF1F8]">Request programme pricing</Button></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-[#1F4E79]/10 bg-[#FBF9F5] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Programme fee</p><p className="mt-1 font-serif text-lg text-[#1F4E79]">{paymentGuidance.fullProgrammeFee}</p></div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-amber-800">First commitment · 40%</p><p className="mt-1 font-serif text-lg text-amber-950">{paymentGuidance.commitmentPayment}</p></div>
                <div className="rounded-lg border border-[#1F4E79]/10 bg-[#FBF9F5] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">End September · 30%</p><p className="mt-1 font-serif text-lg text-[#1F4E79]">{paymentGuidance.firstInstalment}</p></div>
                <div className="rounded-lg border border-[#1F4E79]/10 bg-[#FBF9F5] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mid October · 30%</p><p className="mt-1 font-serif text-lg text-[#1F4E79]">{paymentGuidance.secondInstalment}</p></div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border-l-4 border-l-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>10% full-upfront option:</strong> {paymentGuidance.fullUpfrontFee}. {paymentGuidance.fullUpfrontNote}</div>
                <div className="rounded-lg border-l-4 border-l-[#1F4E79] bg-[#F2F6FA] p-4 text-sm leading-6 text-[#1F4E79]"><strong>Private payment instructions:</strong> {paymentGuidance.paymentInstructions}</div>
              </div>

              <section className="rounded-xl border border-[#1F4E79]/15 bg-[#FBF9F5] p-5" aria-labelledby="paystack-payment-table-heading">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">Paystack checkout</p>
                    <h3 id="paystack-payment-table-heading" className="mt-1 font-serif text-xl text-[#1F4E79]">Approved payment table</h3>
                  </div>
                  <p className="max-w-xl text-xs leading-5 text-slate-600">Choose the row for your selected pathway and payment option. The full-payment rows include the approved 10% discount. Please confirm the amount and currency at checkout before paying.</p>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <Table className="min-w-[680px]">
                    <TableHeader>
                      <TableRow className="border-[#1F4E79]/15 hover:bg-transparent">
                        <TableHead className="text-xs uppercase tracking-wide text-slate-500">Tier</TableHead>
                        <TableHead className="text-xs uppercase tracking-wide text-slate-500">Payment option</TableHead>
                        <TableHead className="text-right text-xs uppercase tracking-wide text-slate-500">Naira</TableHead>
                        <TableHead className="text-right text-xs uppercase tracking-wide text-slate-500">US$</TableHead>
                        <TableHead className="text-right text-xs uppercase tracking-wide text-slate-500">Checkout</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentGuidance.paystackOptions.map((option) => (
                        <TableRow key={`${option.packageName}-${option.lineItem}`} className={option.packageName === paymentGuidance.packageName ? "border-[#1F4E79]/15 bg-white" : "border-[#1F4E79]/10"}>
                          <TableCell className="font-medium text-[#1F4E79]">{option.packageName}{option.packageName === paymentGuidance.packageName && <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-amber-700">Your pathway</span>}</TableCell>
                          <TableCell className="text-slate-700">{option.lineItem}</TableCell>
                          <TableCell className="text-right font-medium text-slate-900">{option.naira}</TableCell>
                          <TableCell className="text-right font-medium text-slate-900">{option.usd}</TableCell>
                          <TableCell className="text-right"><Button asChild type="button" size="sm" className="bg-[#1F4E79] text-white hover:bg-[#153554]"><a href={option.url} target="_blank" rel="noreferrer">Pay with Paystack <ExternalLink className="ml-1 h-3 w-3" /></a></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>

              <div className="space-y-4">
                <section className="rounded-xl border border-[#1F4E79]/15 bg-[#F2F6FA] p-5" aria-labelledby="north-america-paystack-heading">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">North America · USD</p>
                  <h3 id="north-america-paystack-heading" className="mt-1 font-serif text-xl text-[#1F4E79]">Paystack <span className="font-sans text-sm font-semibold tracking-normal text-slate-600">(Payments in North America)</span></h3>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">Use the approved Paystack checkout link in the table above that matches your pathway and payment option. The amounts include the approved 10% discount where full payment is selected.</p>
                </section>

                <section aria-labelledby="other-payment-options-heading">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#1F4E79]/15" />
                    <h3 id="other-payment-options-heading" className="font-serif text-xl text-[#1F4E79]">Other payment options</h3>
                    <div className="h-px flex-1 bg-[#1F4E79]/15" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {paymentGuidance.paymentRoutes.filter((route) => route.id !== "north_america").map((route) => <section key={route.id} className="rounded-xl border border-[#1F4E79]/15 bg-[#FBF9F5] p-5" aria-label={`${route.title} payment instructions`}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">{route.eyebrow}</p>
                      <h3 className="mt-1 font-serif text-xl text-[#1F4E79]">{route.title}</h3>
                      <dl className="mt-4 space-y-2 text-sm leading-5 text-slate-700">
                        {route.details.map((detail) => <div key={detail.label} className="flex flex-col gap-0.5 border-b border-[#1F4E79]/10 pb-2 last:border-b-0"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{detail.label}</dt><dd className="font-medium text-slate-900">{detail.value}</dd></div>)}
                      </dl>
                      <p className="mt-4 border-l-2 border-amber-400 pl-3 text-xs leading-5 text-slate-700">{route.note}</p>
                    </section>)}
                  </div>
                </section>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">After making a transfer</p>
                    <h3 className="mt-1 font-serif text-xl text-emerald-950">Submit your payment receipt</h3>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-emerald-900">Kindly upload your bank-transfer receipt or confirmation. It is recorded privately for {BRAND.facilitatorFirstName}’s review; uploading it does not automatically mark a payment as confirmed.</p>
                  </div>
                  <Badge className="w-fit border-emerald-200 bg-white text-emerald-800">Manual review required</Badge>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,0.65fr)_minmax(0,1fr)]">
                  <label className="space-y-2 text-sm font-medium text-emerald-950">
                    Payment stage
                    <select value={receiptMilestone} onChange={(event) => setReceiptMilestone(event.target.value as typeof receiptMilestone)} className="block w-full rounded-md border border-emerald-300 bg-white px-3 py-2 text-sm font-normal text-slate-900">
                      <option value="deposit">First commitment (40%)</option>
                      <option value="instalment_1">End September instalment (30%)</option>
                      <option value="instalment_2">Mid October instalment (30%)</option>
                      <option value="full_upfront">Full-upfront payment</option>
                    </select>
                  </label>
                  <label className="space-y-2 text-sm font-medium text-emerald-950">
                    Optional note for the programme office
                    <Input value={receiptNote} onChange={(event) => setReceiptNote(event.target.value)} maxLength={1000} placeholder="For example: transferred from my business account" className="border-emerald-300 bg-white" />
                  </label>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xlsx,.xls,.txt"
                    className="block w-full text-sm text-emerald-900 file:mr-4 file:rounded-md file:border-0 file:bg-[#1F4E79] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#153554]"
                    disabled={isReceiptUploading || submitPaymentReceiptMutation.isPending}
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append("file", file);
                      setIsReceiptUploading(true);
                      try {
                        const res = await fetch("/api/payment-receipt-upload", { method: "POST", body: formData });
                        const json = await res.json();
                        if (!res.ok || !json.url || !json.key) {
                          alert(json.message || "We could not upload your payment receipt. Kindly try again.");
                          return;
                        }
                        submitPaymentReceiptMutation.mutate({ paymentMilestone: receiptMilestone, fileName: file.name, fileUrl: json.url, fileKey: json.key, participantNote: receiptNote.trim() || undefined });
                      } catch (uploadError) {
                        alert("Receipt upload error: " + (uploadError instanceof Error ? uploadError.message : String(uploadError)));
                      } finally {
                        setIsReceiptUploading(false);
                        event.target.value = "";
                      }
                    }}
                  />
                  {(isReceiptUploading || submitPaymentReceiptMutation.isPending) && <p className="text-sm text-emerald-800">Submitting your receipt securely…</p>}
                </div>
                {(paymentReceipts?.length ?? 0) > 0 && (
                  <div className="mt-5 border-t border-emerald-200 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">Your submitted receipts</p>
                    <div className="mt-3 space-y-2">
                      {(paymentReceipts ?? []).map((receipt) => (
                        <div key={receipt.id} className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-white p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                          <div><p className="font-medium text-slate-900">{receipt.fileName}</p><p className="text-xs text-slate-500">{receipt.paymentMilestone.replaceAll("_", " ")} · submitted {new Date(receipt.createdAt).toLocaleDateString()} · {receipt.status}</p></div>
                          <Button type="button" size="sm" variant="outline" className="border-emerald-300 text-emerald-800" onClick={() => window.open(receipt.fileUrl, "_blank")}>View receipt <ExternalLink className="ml-1 h-3 w-3" /></Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-sm leading-6 text-slate-600">{paymentGuidance.confirmationNote}</p>
            </CardContent>
          </Card>
        )}

        {activePortalTab === "documents" && (
          <div className="space-y-10">
        {/* Optional supporting documents */}
        <Card className="border-[#1F4E79]/20 bg-white shadow-sm border-l-4 border-l-[#1F4E79]">
          <CardHeader>
            <CardTitle className="font-serif text-xl text-[#1F4E79] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#1F4E79]" /> Optional Supporting Documents
            </CardTitle>
            <CardDescription>
              Your structured diagnostic is completed in this portal. Use this optional space only if you already have a file or information that would add useful context to your engagement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-[#F2F6FA] px-4 py-3 text-sm leading-6 text-[#1F4E79]">
              You may share an existing business plan, pitch deck, financial information, research, business model canvas, working notes, or another relevant document. <strong>No upload is required</strong> to complete your diagnosis or continue in {BRAND.programmeShortName}.
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <input
                type="file"
                id="assignment-file-input"
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#1F4E79]/10 file:text-[#1F4E79] hover:file:bg-[#1F4E79]/20 cursor-pointer"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append("file", file);
                  setIsAssignmentUploading(true);
                  try {
                    const res = await fetch("/api/participant-upload", {
                      method: "POST",
                      body: formData,
                    });
                    const json = await res.json();
                    if (res.ok && json.url && json.key) {
                      uploadAssignmentMutation.mutate({
                        fileName: file.name,
                        fileUrl: json.url,
                        fileKey: json.key,
                        notes: "Submitted via participant portal",
                      });
                    } else {
                      alert(json.message || "Upload failed. Please try again.");
                    }
                  } catch (err) {
                    alert("Upload error: " + (err instanceof Error ? err.message : String(err)));
                  } finally {
                    setIsAssignmentUploading(false);
                  }
                }}
                disabled={isAssignmentUploading || uploadAssignmentMutation.isPending}
              />
              <div className="space-y-1">
                {isAssignmentUploading && <p className="text-sm text-slate-600">Uploading your private document securely…</p>}
                {!isAssignmentUploading && <p className="text-xs leading-5 text-slate-500">PDF, Word, Excel, or plain-text documents only; maximum 15 MB. Your document stays private to your {BRAND.programmeShortName} engagement.</p>}
              </div>
            </div>
            {/* List submitted assignments */}
            {(assignments?.length ?? 0) > 0 && (
              <div className="mt-4 border-t border-slate-100 pt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Documents You Have Shared</p>
                <div className="space-y-2">
                  {(assignments ?? []).map((asgn) => (
                    <div key={asgn.id} className="flex items-center justify-between bg-[#FBF9F5] p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#1F4E79]" />
                        <span className="text-sm font-medium text-slate-800">{asgn.fileName}</span>
                        <span className="text-xs text-slate-400">({new Date(asgn.createdAt).toLocaleDateString()})</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[#1F4E79] border-[#1F4E79]"
                        onClick={() => window.open(asgn.fileUrl, "_blank")}
                      >
                        View Submission <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
        )}

        {activePortalTab === "assessment" && (
          <div className="space-y-5">
            <div className="rounded-xl border border-[#1F4E79]/15 bg-[#EAF1F8] px-5 py-4 text-sm leading-6 text-[#163859]">
              <strong className="font-semibold">Current State Assessment.</strong> This workspace is solely for your diagnostic. Answer one section at a time; your progress is saved quietly, and every completed section opens the next.
            </div>
            <StructuredDiagnostic />
          </div>
        )}

        {activePortalTab === "sessions" && (
          <div className="space-y-4">
        {/* Scheduled Google Meet Sessions */}
          <div className="space-y-1">
            <h2 className="font-serif text-2xl text-[#1F4E79]">Your Scheduled Sessions & Google Meet Links</h2>
            <p className="text-sm leading-6 text-slate-600">Confirmed meeting links will appear here as they are released for your engagement.</p>
          </div>

          <Card className="overflow-hidden border-[#1F4E79]/25 bg-white shadow-sm">
            <div className="h-1.5 bg-amber-400" />
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                    <Calendar className="h-4 w-4" /> Foundation opening class
                  </div>
                  <CardTitle className="mt-2 font-serif text-2xl text-[#1F4E79]">{BRAND.programmeName} Foundation · First Class</CardTitle>
                  <CardDescription className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    The {BRAND.programmeName} cohort begins with a shared Foundation class. Every pathway includes this Foundation experience; it establishes the common strategic language for the advisory work ahead.
                  </CardDescription>
                </div>
                <Badge className="w-fit border-amber-200 bg-amber-50 text-amber-950">Sunday, 6 September</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-lg border border-[#1F4E79]/10 bg-[#F2F6FA] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-[#1F4E79]">Time</p><p className="mt-1 font-medium text-slate-900">9:00 pm</p><p className="mt-1 text-xs text-slate-600">Lagos time · Sunday, 6 September</p></div>
                <div className="rounded-lg border border-[#1F4E79]/10 bg-[#F2F6FA] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-[#1F4E79]">Format</p><p className="mt-1 font-medium text-slate-900">Live shared cohort class</p><p className="mt-1 text-xs text-slate-600">Meeting access will appear here when released</p></div>
                <div className="rounded-lg border border-[#1F4E79]/10 bg-[#F2F6FA] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-[#1F4E79]">If you miss it</p><p className="mt-1 font-medium text-slate-900">Recording available</p><p className="mt-1 text-xs text-slate-600">Shared after the live class for catch-up</p></div>
              </div>
              <div className="rounded-lg border-l-4 border-l-[#1F4E79] bg-[#EAF1F8] p-4 text-sm leading-6 text-[#163859]">
                <strong>Schedule note.</strong> {BRAND.facilitatorFirstName} will share any necessary adjustment at least 72 hours in advance, with a revised date advised. Further Foundation, Engine Room, and Boardroom sessions will be added here as their dates and meeting access are confirmed.
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#1F4E79]/20 bg-white shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Foundation classes</p>
                  <CardTitle className="mt-1 font-serif text-2xl text-[#1F4E79]">Your five shared Foundation sessions</CardTitle>
                  <CardDescription className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">These are the five Foundation classes currently scheduled for the {BRAND.programmeName} group. All times are Lagos time. Meeting access will appear here when released.</CardDescription>
                </div>
                <Badge className="w-fit border-amber-200 bg-amber-50 text-amber-950">5 classes</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {FOUNDATION_CLASSES.map((session) => (
                  <div key={session.date} className="border border-[#1F4E79]/10 bg-[#F2F6FA] p-4">
                    <p className="text-sm font-semibold leading-5 text-slate-900">{session.date}</p>
                    <p className="mt-2 text-xs font-medium text-[#1F4E79]">{session.time} · Africa/Lagos</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {bookings.length === 0 ? (
            <Card className="border-dashed border-slate-300 bg-white/50 p-8 text-center space-y-3">
              <Clock className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="font-serif text-lg text-slate-700">No sessions booked yet</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">Session selection is <strong>available once your place is confirmed</strong>. The programme office will release the appropriate calendar choices and Google Meet links here when that milestone is reached.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookings.map((booking) => {
                const startDate = new Date(booking.startAt);
                const endDate = new Date(booking.endAt);
                return (
                  <Card key={booking.id} className="border-[#1F4E79]/20 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <Badge className="bg-[#1F4E79] text-white font-normal">
                          {booking.kind} Session #{booking.sessionNumber}
                        </Badge>
                        <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                          {booking.status}
                        </span>
                      </div>
                      <CardTitle className="font-serif text-lg text-slate-900 mt-2">
                        {startDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
                      </CardTitle>
                      <CardDescription className="text-slate-600 flex items-center gap-2 pt-1">
                        <Clock className="w-4 h-4 text-[#1F4E79]" />
                        {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ({booking.timezone})
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 flex flex-col gap-3 border-t border-slate-100 mt-2 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-xs text-slate-500">
                        Facilitated by {BRAND.facilitatorFormalName}
                      </div>
                      <div className="rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600" role="status">
                        Verified Google Meet access will appear here when released.
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
        )}

        {activePortalTab === "documents" && (
          <div className="space-y-4">
        {/* Uploaded Briefs & Documents */}
        <div className="space-y-4">
          <h2 className="font-serif text-2xl text-[#1F4E79]">Your Engagement Briefs & Diagnostic Documents</h2>

          {briefs.length === 0 ? (
            <Card className="border-dashed border-slate-300 bg-white/50 p-8 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="font-serif text-lg text-slate-700">No briefs uploaded yet</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Your bespoke engagement brief, pre-class reading materials, and diagnostic roadmap will appear here once published by Dr. Tarfa.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {briefs.map((brief) => (
                <Card key={brief.id} className="border-[#1F4E79]/20 bg-white shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="text-[#1F4E79] border-[#1F4E79]">
                        {brief.fileType.toUpperCase()} Document
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {new Date(brief.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="font-serif text-lg text-slate-900 mt-1">
                      {brief.title}
                    </CardTitle>
                    {brief.description && (
                      <CardDescription className="text-slate-600">
                        {brief.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-2 border-t border-slate-100 mt-2 flex justify-end">
                    <Button
                      size="sm"
                      className="bg-[#1F4E79] hover:bg-[#163859] text-white"
                      onClick={() => window.open(brief.fileUrl, "_blank")}
                    >
                      <FileText className="w-4 h-4 mr-2" /> Download / View Brief <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
	          )}
	        </div>
	        </div>
	        )}
	        </Tabs>
        <PricingRequestDialog open={isPricingRequestOpen} onOpenChange={setIsPricingRequestOpen} source="portal" />
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <p>{BRAND.programmeFullName} • Enzo Krypton • Kindly email {BRAND.facilitatorFormalName} directly with a screenshot if you need technical support.</p>
      </footer>
    </div>
  );
}
