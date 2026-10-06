import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Download, Loader2, Mail, Pencil, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CASH_RUNWAY_OPTIONS,
  DECISION_STYLE_OPTIONS,
  DIAGNOSTIC_SECTION_IDS,
  FOUNDER_CAPACITY_OPTIONS,
  FOUNDER_ENERGY_OPTIONS,
  FUTURE_HORIZON_OPTIONS,
  LEGAL_STRUCTURES,
  MATERIAL_NUMBER_SOURCE_OPTIONS,
  OWNERSHIP_OPTIONS,
  PAYMENT_APPROVAL_OPTIONS,
  PAYERS,
  REVENUE_BAND_OPTIONS,
  REVENUE_CONFIDENCE_OPTIONS,
  REVENUE_STAGE_OPTIONS,
  SECTION_LABELS,
  STRATEGIC_PRIORITY_OPTIONS,
  SUCCESS_MEASURE_OPTIONS,
  TEAM_SIZE_BANDS,
  type StructuredDiagnosticDraft,
  type StructuredDiagnosticSectionId,
} from "../../../shared/structuredDiagnostic";
import { BRAND } from "@shared/brand";

const BUSINESS_AGE_OPTIONS = ["Pre-launch", "Under 1 year", "1 to 3 years", "3 to 5 years", "More than 5 years"];
const ENGINE_OPTIONS = ["Makers", "Traders", "Experts"];

function ChoiceGrid({
  options,
  selected,
  onSelect,
  multiple = false,
}: {
  options: readonly string[];
  selected: string | string[] | undefined;
  onSelect: (value: string) => void;
  multiple?: boolean;
}) {
  const selectedValues = Array.isArray(selected) ? selected : selected ? [selected] : [];
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role={multiple ? "group" : "radiogroup"}>
      {options.map((option) => {
        const isSelected = selectedValues.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={`flex min-h-12 items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E79] ${
              isSelected
                ? "border-[#1F4E79] bg-[#EAF1F8] text-[#163859]"
                : "border-slate-200 bg-white text-slate-700 hover:border-[#1F4E79]/50 hover:bg-[#F5F8FB]"
            }`}
            role={multiple ? "checkbox" : "radio"}
            aria-checked={isSelected}
          >
            <span>{option}</span>
            {isSelected && <Check className="h-4 w-4 shrink-0 text-[#1F4E79]" />}
          </button>
        );
      })}
    </div>
  );
}

function PrefilledField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 bg-[#FBF9F5] p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <button
          type="button"
          onClick={() => setEditing((current) => !current)}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#1F4E79] hover:text-[#163859]"
        >
          <Pencil className="h-3.5 w-3.5" /> {editing ? "Done" : "Amend"}
        </button>
      </div>
      {editing ? (
        multiline ? (
          <Textarea value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="mt-3 min-h-24 bg-white" />
        ) : (
          <Input value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="mt-3 bg-white" />
        )
      ) : (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">{value || "Not provided at registration"}</p>
      )}
    </div>
  );
}

function QuestionCard({
  question,
  explainer,
  children,
}: {
  question: string;
  explainer: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-[#1F4E79]/15 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <h3 className="font-serif text-xl leading-snug text-[#1F4E79]">{question}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{explainer}</p>
      </div>
      {children}
    </section>
  );
}

function OptionalNote({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor={label}>{label} <span className="font-normal text-slate-500">(optional)</span></label>
      <Textarea id={label} value={value ?? ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-24 bg-white" />
    </div>
  );
}

export function StructuredDiagnostic() {
  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.participant.getStructuredDiagnostic.useQuery(undefined, { retry: false });
  const saveMutation = trpc.participant.saveStructuredDiagnostic.useMutation();
  const workingReportQuery = trpc.participant.getWorkingDiagnosticReport.useQuery(undefined, { enabled: false, retry: false });
  const generateWorkingReportMutation = trpc.participant.generateWorkingDiagnosticReport.useMutation();
  const downloadWorkingReportQuery = trpc.participant.downloadWorkingDiagnosticReportPdf.useQuery(undefined, { enabled: false, retry: false });
  const emailWorkingReportMutation = trpc.participant.emailWorkingDiagnosticReport.useMutation();
  const [draft, setDraft] = useState<StructuredDiagnosticDraft | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [teamRecipientEmail, setTeamRecipientEmail] = useState("");
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);
  const savedFingerprint = useRef("");

  useEffect(() => {
    if (!data?.draft) return;
    const fingerprint = JSON.stringify(data.draft);
    savedFingerprint.current = fingerprint;
    setDraft(data.draft);
  }, [data?.draft]);

  useEffect(() => {
    if (!draft) return;
    const fingerprint = JSON.stringify(draft);
    if (fingerprint === savedFingerprint.current) return;
    const timer = window.setTimeout(() => {
      saveMutation.mutate(
        { draft },
        {
          onSuccess: (result) => {
            savedFingerprint.current = fingerprint;
            setSavedAt(new Date(result.savedAt));
            utils.participant.getStructuredDiagnostic.invalidate();
          },
        },
      );
    }, 900);
    return () => window.clearTimeout(timer);
  }, [draft, saveMutation, utils.participant.getStructuredDiagnostic]);

  const activeSection = draft?.activeSection ?? "confirm";
  const activeMeta = SECTION_LABELS[activeSection];
  const activeIndex = DIAGNOSTIC_SECTION_IDS.indexOf(activeSection) + 1;
  const completed = draft?.completedSections.length ?? 0;
  const progressPercent = Math.round((completed / DIAGNOSTIC_SECTION_IDS.length) * 100);
  const isComplete = completed === DIAGNOSTIC_SECTION_IDS.length;

  useEffect(() => {
    if (isComplete) workingReportQuery.refetch();
  }, [isComplete, workingReportQuery.refetch]);

  const updateDraft = (updater: (current: StructuredDiagnosticDraft) => StructuredDiagnosticDraft) => {
    setDraft((current) => (current ? updater(current) : current));
  };

  const markSectionComplete = (section: StructuredDiagnosticSectionId, nextSection: StructuredDiagnosticSectionId) => {
    updateDraft((current) => ({
      ...current,
      completedSections: Array.from(new Set([...current.completedSections, section])),
      activeSection: nextSection,
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToPreviousSection = () => {
    const currentIndex = DIAGNOSTIC_SECTION_IDS.indexOf(activeSection);
    if (currentIndex <= 0) return;
    updateDraft((current) => ({ ...current, activeSection: DIAGNOSTIC_SECTION_IDS[currentIndex - 1] }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const downloadCurrentWorkingReport = () => {
    setReportFeedback(null);
    downloadWorkingReportQuery.refetch().then(({ data: pdf, error: requestError }) => {
      if (requestError || !pdf) {
        setReportFeedback(requestError?.message || "We could not prepare the PDF just now. Kindly try again shortly.");
        return;
      }
      const anchor = document.createElement("a");
      anchor.href = pdf.dataUrl;
      anchor.download = pdf.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setReportFeedback("Your private PDF has been prepared and downloaded.");
    });
  };

  const emailCurrentWorkingReport = (recipientEmail?: string) => {
    setReportFeedback(null);
    emailWorkingReportMutation.mutate(
      { recipientEmail: recipientEmail?.trim() || undefined },
      {
        onSuccess: ({ recipientEmail: deliveredTo }) => setReportFeedback(`Your private report has been sent to ${deliveredTo}.`),
        onError: (requestError) => setReportFeedback(requestError.message || "We could not send your report just now. Kindly try again shortly."),
      },
    );
  };

  const sectionOneReady = useMemo(() => Boolean(
    draft?.section1.businessName?.trim()
      && draft.section1.businessDescription?.trim()
      && draft.section1.businessAge
      && draft.section1.engine
      && draft.section1.primaryConstraint?.trim(),
  ), [draft]);
  const sectionTwoReady = useMemo(() => Boolean(
    draft?.section2.payers?.length
      && draft.section2.legalStructure
      && draft.section2.ownership
      && draft.section2.paymentApproval
      && draft.section2.fullTimeTeam
      && draft.section2.partTimeTeam
      && draft.section2.contractors,
  ), [draft]);
  const sectionThreeReady = useMemo(() => Boolean(
    draft?.section3.revenueStage
      && draft.section3.annualRevenueBand
      && draft.section3.revenueConfidence
      && draft.section3.materialNumberSource
      && draft.section3.cashRunway,
  ), [draft]);
  const sectionFourReady = useMemo(() => Boolean(
    draft?.section4.founderCapacity
      && draft.section4.decisionStyle
      && draft.section4.founderEnergy,
  ), [draft]);
  const sectionFiveReady = useMemo(() => Boolean(
    draft?.section5.futureHorizon
      && draft.section5.successMeasures?.length
      && draft.section5.strategicPriority,
  ), [draft]);

  if (isLoading) {
    return <Card className="border-[#1F4E79]/20 bg-white"><CardContent className="p-6 text-sm text-slate-600">Preparing your diagnostic…</CardContent></Card>;
  }
  if (error || !draft) {
    return <Card className="border-amber-300 bg-amber-50"><CardContent className="p-6 text-sm text-amber-950">We could not prepare the diagnostic just now. Kindly refresh the page; if the issue continues, please send {BRAND.facilitatorFirstName} a screenshot.</CardContent></Card>;
  }

  return (
    <Card className="border-[#1F4E79]/20 bg-white shadow-sm" aria-labelledby="structured-diagnostic-heading">
      <CardHeader className="border-b border-slate-100 pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">{activeMeta.number} · Section {activeIndex} of {DIAGNOSTIC_SECTION_IDS.length}</p>
            <CardTitle id="structured-diagnostic-heading" className="mt-1 font-serif text-2xl text-[#1F4E79]">{isComplete ? "Diagnostic saved" : activeMeta.title}</CardTitle>
            <CardDescription className="mt-2 max-w-2xl leading-6">{isComplete ? `Your completed answers are available to ${BRAND.facilitatorFirstName} for the next stage of the advisory work.` : `${activeMeta.duration}. Select the closest answer first; only the optional context prompts require typing.`}</CardDescription>
          </div>
          <Badge className="w-fit border-[#1F4E79]/20 bg-[#EAF1F8] text-[#1F4E79]">{savedAt ? `Saved ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : saveMutation.isPending ? "Saving…" : "Private draft"}</Badge>
        </div>
        <div className="mt-5" aria-label="Diagnostic section progress">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500"><span>{completed} of {DIAGNOSTIC_SECTION_IDS.length} sections complete</span><span>{progressPercent}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#1F4E79] transition-[width] duration-300" style={{ width: `${progressPercent}%` }} /></div>
        </div>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1" aria-label="Diagnostic sections">
          {DIAGNOSTIC_SECTION_IDS.map((section, index) => {
            const isAvailable = section === activeSection || draft.completedSections.includes(section);
            const isActive = section === activeSection;
            return (
              <button
                key={section}
                type="button"
                disabled={!isAvailable}
                onClick={() => updateDraft((current) => ({ ...current, activeSection: section }))}
                className={`min-w-max rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? "border-[#1F4E79] bg-[#1F4E79] text-white"
                    : isAvailable
                      ? "border-[#1F4E79]/25 bg-[#F5F8FB] text-[#1F4E79] hover:bg-[#EAF1F8]"
                      : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                }`}
              >
                {index + 1}. {SECTION_LABELS[section].title}
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-6">
        {activeSection === "confirm" && (
          <>
            <div className="rounded-xl border border-[#1F4E79]/15 bg-[#EAF1F8] p-4 text-sm leading-6 text-[#163859]">
              This is what you told us when you registered. Kindly confirm it is still accurate, or amend anything that has changed. This avoids asking you to start from blank boxes.
            </div>
            <PrefilledField label="Business name" value={draft.section1.businessName} onChange={(value) => updateDraft((current) => ({ ...current, section1: { ...current.section1, businessName: value } }))} />
            <PrefilledField label="What the business does" value={draft.section1.businessDescription} multiline onChange={(value) => updateDraft((current) => ({ ...current, section1: { ...current.section1, businessDescription: value } }))} />
            <QuestionCard question="How long has this business been operating?" explainer="Choose the closest answer. If you are preparing to launch, that is a useful strategic answer—not a disadvantage.">
              <ChoiceGrid options={BUSINESS_AGE_OPTIONS} selected={draft.section1.businessAge} onSelect={(value) => updateDraft((current) => ({ ...current, section1: { ...current.section1, businessAge: value } }))} />
            </QuestionCard>
            <QuestionCard question="Which engine most closely describes how the business creates value?" explainer="This helps us frame the right questions about product, trade, expertise, delivery, and growth.">
              <ChoiceGrid options={ENGINE_OPTIONS} selected={draft.section1.engine} onSelect={(value) => updateDraft((current) => ({ ...current, section1: { ...current.section1, engine: value } }))} />
            </QuestionCard>
            <PrefilledField label="The main constraint you named" value={draft.section1.primaryConstraint} multiline onChange={(value) => updateDraft((current) => ({ ...current, section1: { ...current.section1, primaryConstraint: value } }))} />
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-500">Your registration context stays private to your participant file. It will be used only to shape the advisory work.</p>
              <Button disabled={!sectionOneReady || saveMutation.isPending} onClick={() => markSectionComplete("confirm", "shape")} className="bg-[#1F4E79] text-white hover:bg-[#163859]">
                Continue to business shape <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            {!sectionOneReady && <p className="text-xs font-medium text-amber-800">Kindly complete each item above before continuing.</p>}
          </>
        )}

        {activeSection === "shape" && (
          <>
            <div className="rounded-xl border border-[#1F4E79]/15 bg-[#EAF1F8] p-4 text-sm leading-6 text-[#163859]">There is no need to type a long explanation here. Select the answers that best match the present shape of the business; you can amend them later.</div>
            <QuestionCard question="Who pays you?" explainer="Select every payer that applies. This helps us understand your revenue relationship, not just your product.">
              <ChoiceGrid options={PAYERS} multiple selected={draft.section2.payers} onSelect={(value) => updateDraft((current) => {
                const currentValues = current.section2.payers ?? [];
                const payers = currentValues.includes(value) ? currentValues.filter((item) => item !== value) : [...currentValues, value];
                return { ...current, section2: { ...current.section2, payers } };
              })} />
            </QuestionCard>
            <QuestionCard question="What is the legal structure today?" explainer="Choose the current legal position, even if you expect it to change later."><ChoiceGrid options={LEGAL_STRUCTURES} selected={draft.section2.legalStructure} onSelect={(value) => updateDraft((current) => ({ ...current, section2: { ...current.section2, legalStructure: value } }))} /></QuestionCard>
            <QuestionCard question="Who owns the business?" explainer="Ownership affects decision rights, incentives, and the options available for growth."><ChoiceGrid options={OWNERSHIP_OPTIONS} selected={draft.section2.ownership} onSelect={(value) => updateDraft((current) => ({ ...current, section2: { ...current.section2, ownership: value } }))} /></QuestionCard>
            <QuestionCard question="Who has to approve a meaningful payment or investment?" explainer="This gives us an early view of how decisions are actually made."><ChoiceGrid options={PAYMENT_APPROVAL_OPTIONS} selected={draft.section2.paymentApproval} onSelect={(value) => updateDraft((current) => ({ ...current, section2: { ...current.section2, paymentApproval: value } }))} /></QuestionCard>
            <QuestionCard question="How many people currently support the work?" explainer="Choose the closest band for each group. This helps distinguish the core organisation from flexible capacity.">
              <div className="space-y-5">
                <div><p className="mb-2 text-sm font-semibold text-slate-700">Full-time team</p><ChoiceGrid options={TEAM_SIZE_BANDS} selected={draft.section2.fullTimeTeam} onSelect={(value) => updateDraft((current) => ({ ...current, section2: { ...current.section2, fullTimeTeam: value } }))} /></div>
                <div><p className="mb-2 text-sm font-semibold text-slate-700">Part-time team</p><ChoiceGrid options={TEAM_SIZE_BANDS} selected={draft.section2.partTimeTeam} onSelect={(value) => updateDraft((current) => ({ ...current, section2: { ...current.section2, partTimeTeam: value } }))} /></div>
                <div><p className="mb-2 text-sm font-semibold text-slate-700">Contractors or freelancers</p><ChoiceGrid options={TEAM_SIZE_BANDS} selected={draft.section2.contractors} onSelect={(value) => updateDraft((current) => ({ ...current, section2: { ...current.section2, contractors: value } }))} /></div>
              </div>
            </QuestionCard>
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="ghost" onClick={goToPreviousSection} className="text-[#1F4E79]"><ChevronLeft className="mr-2 h-4 w-4" /> Review section 1</Button>
              <Button disabled={!sectionTwoReady || saveMutation.isPending} onClick={() => markSectionComplete("shape", "numbers")} className="bg-[#1F4E79] text-white hover:bg-[#163859]">
                Continue to the numbers <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            {!sectionTwoReady && <p className="text-xs font-medium text-amber-800">Kindly select an answer for each item before continuing.</p>}
          </>
        )}

        {activeSection === "numbers" && (
          <>
            <div className="rounded-xl border border-[#1F4E79]/15 bg-[#EAF1F8] p-4 text-sm leading-6 text-[#163859]">This is a directional financial picture, not an audit. Where exact figures are unavailable, use the closest band or choose “I do not know yet”. That answer is useful information too.</div>
            <QuestionCard question="What is the business’s current revenue stage?" explainer="Choose the statement that best reflects the present reality. The pre-launch option will shape our questions differently from an established trading business.">
              <ChoiceGrid options={REVENUE_STAGE_OPTIONS} selected={draft.section3.revenueStage} onSelect={(value) => updateDraft((current) => ({ ...current, section3: { ...current.section3, revenueStage: value } }))} />
            </QuestionCard>
            <QuestionCard question="What is the closest annual revenue band?" explainer="For pre-launch businesses, select “Not applicable yet”. A broad band is enough at this stage; no detailed financial schedule is required.">
              <ChoiceGrid options={REVENUE_BAND_OPTIONS} selected={draft.section3.annualRevenueBand} onSelect={(value) => updateDraft((current) => ({ ...current, section3: { ...current.section3, annualRevenueBand: value } }))} />
            </QuestionCard>
            <QuestionCard question="How dependable is that revenue view?" explainer="Tell us the quality of the number, not just the number itself. This determines how much weight we place on it in the diagnosis.">
              <ChoiceGrid options={REVENUE_CONFIDENCE_OPTIONS} selected={draft.section3.revenueConfidence} onSelect={(value) => updateDraft((current) => ({ ...current, section3: { ...current.section3, revenueConfidence: value } }))} />
            </QuestionCard>
            <QuestionCard question="What is the main basis for this financial view?" explainer="Choose the closest source. A forecast, pilot evidence, customer research, or a well-considered pre-launch assumption is all useful context; we simply need to understand what supports the number.">
              <ChoiceGrid options={MATERIAL_NUMBER_SOURCE_OPTIONS} selected={draft.section3.materialNumberSource} onSelect={(value) => updateDraft((current) => ({ ...current, section3: { ...current.section3, materialNumberSource: value } }))} />
            </QuestionCard>
            <QuestionCard question="How much financial runway does the business have?" explainer="Think about the period the business can keep operating at its current pace before it needs new cash, stronger revenue, or a different cost structure.">
              <ChoiceGrid options={CASH_RUNWAY_OPTIONS} selected={draft.section3.cashRunway} onSelect={(value) => updateDraft((current) => ({ ...current, section3: { ...current.section3, cashRunway: value } }))} />
            </QuestionCard>
            <QuestionCard question="Is there one number we should understand better?" explainer="Optional. Examples include average monthly sales, customer count, price point, conversion rate, a material cost, or a pre-launch assumption.">
              <OptionalNote label="Optional numerical context" value={draft.section3.materialNumberNote} onChange={(value) => updateDraft((current) => ({ ...current, section3: { ...current.section3, materialNumberNote: value } }))} placeholder="For example: Our average monthly sales are about ₦1.2m, but this is seasonal." />
            </QuestionCard>
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="ghost" onClick={goToPreviousSection} className="text-[#1F4E79]"><ChevronLeft className="mr-2 h-4 w-4" /> Review business shape</Button>
              <Button disabled={!sectionThreeReady || saveMutation.isPending} onClick={() => markSectionComplete("numbers", "founder")} className="bg-[#1F4E79] text-white hover:bg-[#163859]">
                Continue to founder context <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            {!sectionThreeReady && <p className="text-xs font-medium text-amber-800">Kindly select one answer in each financial area, including the main basis for the financial view, before continuing. The written context is optional.</p>}
          </>
        )}

        {activeSection === "founder" && (
          <>
            <div className="rounded-xl border border-[#1F4E79]/15 bg-[#EAF1F8] p-4 text-sm leading-6 text-[#163859]">This section is about the operating reality around the founder—not a personality test. Choose the answer that feels closest today, not the answer you think a business should have. If a question feels premature or unclear, select “I would prefer to explore this in conversation”; it gives {BRAND.facilitatorFirstName} useful context without forcing an answer.</div>
            <QuestionCard question="How are you currently carrying the leadership load?" explainer="This helps distinguish a capacity constraint from a strategic or market constraint.">
              <ChoiceGrid options={FOUNDER_CAPACITY_OPTIONS} selected={draft.section4.founderCapacity} onSelect={(value) => updateDraft((current) => ({ ...current, section4: { ...current.section4, founderCapacity: value } }))} />
            </QuestionCard>
            <QuestionCard question="How do important business decisions usually get made?" explainer="There is no ideal answer here. We are looking for the decision pattern that shapes speed, risk, and follow-through.">
              <ChoiceGrid options={DECISION_STYLE_OPTIONS} selected={draft.section4.decisionStyle} onSelect={(value) => updateDraft((current) => ({ ...current, section4: { ...current.section4, decisionStyle: value } }))} />
            </QuestionCard>
            <QuestionCard question="How would you describe your present founder energy?" explainer="A candid answer lets us design recommendations that match the capacity you can genuinely deploy.">
              <ChoiceGrid options={FOUNDER_ENERGY_OPTIONS} selected={draft.section4.founderEnergy} onSelect={(value) => updateDraft((current) => ({ ...current, section4: { ...current.section4, founderEnergy: value } }))} />
            </QuestionCard>
            <QuestionCard question="What is the most important leadership constraint to explore?" explainer="Optional. You might name a skill gap, a decision you are avoiding, a difficult relationship, or simply a capacity issue.">
              <OptionalNote label="Optional founder context" value={draft.section4.leadershipConstraint} onChange={(value) => updateDraft((current) => ({ ...current, section4: { ...current.section4, leadershipConstraint: value } }))} placeholder="For example: I need to be clearer about what to keep personally and what to delegate." />
            </QuestionCard>
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="ghost" onClick={goToPreviousSection} className="text-[#1F4E79]"><ChevronLeft className="mr-2 h-4 w-4" /> Review the numbers</Button>
              <Button disabled={!sectionFourReady || saveMutation.isPending} onClick={() => markSectionComplete("founder", "future")} className="bg-[#1F4E79] text-white hover:bg-[#163859]">
                Continue to future direction <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            {!sectionFourReady && <p className="text-xs font-medium text-amber-800">Kindly select one answer in each founder area before continuing. The written context is optional.</p>}
          </>
        )}

        {activeSection === "future" && (
          <>
            <div className="rounded-xl border border-[#1F4E79]/15 bg-[#EAF1F8] p-4 text-sm leading-6 text-[#163859]">This final section anchors the advisory work in the outcome that matters to you. It is not a promise of a particular business result; it helps {BRAND.facilitatorFirstName} shape the questions, priorities, and recommendations around the choices ahead. You may choose to explore an item in conversation where a direction is not yet clear.</div>
            <QuestionCard question="What planning horizon matters most right now?" explainer="Choose the period within which you most need greater clarity or progress.">
              <ChoiceGrid options={FUTURE_HORIZON_OPTIONS} selected={draft.section5.futureHorizon} onSelect={(value) => updateDraft((current) => ({ ...current, section5: { ...current.section5, futureHorizon: value } }))} />
            </QuestionCard>
            <QuestionCard question="What would make this engagement valuable to you?" explainer="Select every outcome that matters. These are the practical lenses we will use when assessing the recommendations.">
              <ChoiceGrid options={SUCCESS_MEASURE_OPTIONS} multiple selected={draft.section5.successMeasures} onSelect={(value) => updateDraft((current) => {
                const currentValues = current.section5.successMeasures ?? [];
                const successMeasures = currentValues.includes(value) ? currentValues.filter((item) => item !== value) : [...currentValues, value];
                return { ...current, section5: { ...current.section5, successMeasures } };
              })} />
            </QuestionCard>
            <QuestionCard question="Which strategic priority is most urgent?" explainer="Choose the single priority you would most like to make better decisions about first.">
              <ChoiceGrid options={STRATEGIC_PRIORITY_OPTIONS} selected={draft.section5.strategicPriority} onSelect={(value) => updateDraft((current) => ({ ...current, section5: { ...current.section5, strategicPriority: value } }))} />
            </QuestionCard>
            <QuestionCard question="If this work goes well, what will be different?" explainer="Optional. A short statement in your own words can help us test whether the advisory work is moving in the right direction.">
              <OptionalNote label="Optional success statement" value={draft.section5.successDescription} onChange={(value) => updateDraft((current) => ({ ...current, section5: { ...current.section5, successDescription: value } }))} placeholder="For example: I will know exactly which market to focus on and what to stop doing." />
            </QuestionCard>
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="ghost" onClick={goToPreviousSection} className="text-[#1F4E79]"><ChevronLeft className="mr-2 h-4 w-4" /> Review founder context</Button>
              <Button disabled={!sectionFiveReady || saveMutation.isPending} onClick={() => markSectionComplete("future", "future")} className="bg-[#1F4E79] text-white hover:bg-[#163859]">
                {isComplete ? "Diagnostic saved" : "Save completed diagnostic"} <Check className="ml-2 h-4 w-4" />
              </Button>
            </div>
            {!sectionFiveReady && <p className="text-xs font-medium text-amber-800">Kindly select the planning horizon, at least one success measure, and the strategic priority before saving. The written statement is optional.</p>}
            {isComplete && (
              <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                  <div>
                    <p className="font-semibold">Thank you. Your completed diagnostic has been saved.</p>
                    <p className="mt-1">You may revisit any completed section from the navigator above. When you are ready, use the portal tabs at the top of this page to view your programme, payment status, shared documents, or session information.</p>
                    <p className="mt-2">{BRAND.facilitatorFirstName} will use this record to shape the next stage of your engagement. If you have a question or experience a technical glitch, kindly email him directly with a screenshot.</p>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-200/80 bg-white/80 p-4 text-slate-800">
                  <p className="font-semibold text-[#163859]">Your Current State Working Diagnostic</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Create a concise working report based only on the answers you supplied here and the registration context you confirmed. It highlights discussion priorities and questions for the advisory work; it is not a final strategy, audit, valuation, or promise of outcomes.</p>

                  {!workingReportQuery.data?.report ? (
                    <Button
                      type="button"
                      className="mt-4 bg-[#1F4E79] text-white hover:bg-[#163859]"
                      disabled={generateWorkingReportMutation.isPending}
                      onClick={() => {
                        setReportFeedback(null);
                        generateWorkingReportMutation.mutate(undefined, {
                          onSuccess: () => {
                            workingReportQuery.refetch();
                            setReportFeedback("Your working diagnostic is ready. You can download it or send it to a trusted recipient below.");
                          },
                          onError: (requestError) => setReportFeedback(requestError.message || "We could not generate the report just now. Kindly try again shortly."),
                        });
                      }}
                    >
                      {generateWorkingReportMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing your report…</> : <><Sparkles className="mr-2 h-4 w-4" /> Create my working diagnostic</>}
                    </Button>
                  ) : (
                    <div className="mt-4 space-y-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <Button type="button" onClick={downloadCurrentWorkingReport} disabled={downloadWorkingReportQuery.isFetching} className="bg-[#1F4E79] text-white hover:bg-[#163859]">
                          {downloadWorkingReportQuery.isFetching ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing PDF…</> : <><Download className="mr-2 h-4 w-4" /> Download PDF</>}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => emailCurrentWorkingReport()} disabled={emailWorkingReportMutation.isPending} className="border-[#1F4E79]/30 text-[#1F4E79] hover:bg-[#EAF1F8]">
                          {emailWorkingReportMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</> : <><Mail className="mr-2 h-4 w-4" /> Email me a copy</>}
                        </Button>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <label htmlFor="working-report-team-email" className="text-sm font-semibold text-slate-700">Send to a trusted team recipient <span className="font-normal text-slate-500">(optional)</span></label>
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                          <Input id="working-report-team-email" type="email" value={teamRecipientEmail} onChange={(event) => setTeamRecipientEmail(event.target.value)} placeholder="colleague@company.com" className="bg-white" />
                          <Button type="button" variant="outline" disabled={!teamRecipientEmail.trim() || emailWorkingReportMutation.isPending} onClick={() => emailCurrentWorkingReport(teamRecipientEmail)} className="shrink-0 border-[#1F4E79]/30 text-[#1F4E79] hover:bg-[#EAF1F8]">Send PDF</Button>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-500">Only send this private working document to someone you trust to work with your business information.</p>
                      </div>
                    </div>
                  )}
                  {reportFeedback && <p role="status" className="mt-3 text-sm font-medium text-[#163859]">{reportFeedback}</p>}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
