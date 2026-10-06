/**
 * The free business check. One question per screen, grouped under broad headers: the business
 * profile, founder readiness, then the problem areas that apply to this owner. Each answer decides
 * what comes next (shared/businessCheck/engine.ts). Every area opens with what it means and an
 * example for the kind of business the owner described. The result is written on the server.
 */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { BRAND } from "@shared/brand";
import { CAPABILITIES, offeringById } from "@shared/businessCheck/catalogue";
import {
  businessOutline,
  cleanAnswers,
  DISC_STYLES,
  exampleFor,
  isAnswered,
  nextStep,
  optionsFor,
  promptFor,
  questionPath,
  READINESS_LABELS,
  sectionPath,
  type Step,
} from "@shared/businessCheck/engine";
import { AREA_NAMES, GAP_LABELS, SECTIONS, stageOf, type Answers, type Health, type Question, type SectionId } from "@shared/businessCheck/questions";
import { formatNaira, PRICES, PROMISE } from "@shared/businessSupport";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, LockKeyhole, Mail, PhoneCall, RotateCcw } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import type { BusinessCheckResponse } from "../../../server/routers/businessCheck";

const STORAGE_KEY = "ipf-business-check-v1";

type Contact = { fullName: string; email: string; whatsapp: string; businessName: string; description: string; heardFrom: string };
type Saved = { started: boolean; answers: Answers; seen: SectionId[]; history: string[]; contact: Contact; response?: BusinessCheckResponse };

const EMPTY_CONTACT: Contact = { fullName: "", email: "", whatsapp: "", businessName: "", description: "", heardFrom: "" };
const FRESH: Saved = { started: false, answers: {}, seen: [], history: [], contact: EMPTY_CONTACT };

const HEARD_FROM = ["A friend or business owner", "A past JUMP participant", "LinkedIn", "Instagram or Facebook", "WhatsApp", "An event", "Somewhere else"];

function load(): Saved {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...FRESH, ...JSON.parse(raw) } : FRESH;
  } catch {
    return FRESH;
  }
}

function save(state: Saved) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private windows and blocked storage: the check still works, it just won't resume.
  }
}

const HEALTH_STYLE: Record<Health | "pending", { dot: string; row: string; label: string }> = {
  clear: { dot: "bg-health-clear", row: "border-health-clear/40 bg-health-clear-tint text-health-clear", label: "Clear" },
  watch: { dot: "bg-health-watch", row: "border-health-watch/40 bg-health-watch-tint text-health-watch", label: "Watch" },
  stuck: { dot: "bg-health-stuck", row: "border-health-stuck/40 bg-health-stuck-tint text-health-stuck", label: "Stuck" },
  pending: { dot: "bg-line-strong", row: "border-line bg-paper-raised text-ink-faint", label: "To come" },
};

export default function BusinessCheck() {
  const [state, setState] = useState<Saved>(load);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const update = (patch: Partial<Saved>) => setState((current) => ({ ...current, ...patch }));

  useEffect(() => save(state), [state]);
  useEffect(() => window.scrollTo({ top: 0 }), [editing, state.history.length, state.seen.length, state.started, state.response]);

  const answers = useMemo(() => cleanAnswers(state.answers), [state.answers]);
  const path = useMemo(() => questionPath(answers), [answers]);
  const step: Step | null = editing ? path.find((item) => item.question.id === editing) ?? null : nextStep(answers);

  const submit = trpc.businessCheck.submit.useMutation({
    onSuccess: (response) => update({ response }),
    onError: (err) => setError(err.message || "We could not send your answers. Kindly try again."),
  });

  const restart = () => {
    setEditing(null);
    setError("");
    submit.reset();
    setState({ ...FRESH, started: true });
  };

  const answer = (question: Question, value: string | string[], advance = true) => {
    const at = state.history.indexOf(question.id);
    const history = at >= 0 ? state.history.slice(0, at) : state.history;
    update({ answers: { ...state.answers, [question.id]: value }, history: advance ? [...history, question.id] : state.history });
    if (advance) setEditing(null);
  };

  const back = () => {
    const previous = state.history[state.history.length - 1];
    if (!previous) {
      update({ started: false });
      return;
    }
    update({ history: state.history.slice(0, -1) });
    setEditing(previous);
  };

  let screen: React.ReactNode;
  if (state.response) {
    screen = <Result response={state.response} contact={state.contact} onRestart={restart} />;
  } else if (!state.started) {
    screen = <Intro hasProgress={state.history.length > 0} onStart={() => update({ started: true })} onRestart={restart} />;
  } else if (step && !state.seen.includes(step.section.id)) {
    screen = <SectionIntro step={step} answers={answers} onContinue={() => update({ seen: [...state.seen, step.section.id] })} onBack={back} />;
  } else if (step) {
    screen = <QuestionScreen key={step.question.id} step={step} answers={answers} onAnswer={answer} onBack={back} />;
  } else {
    screen = (
      <ContactScreen
        contact={state.contact}
        idea={stageOf(answers) === "idea"}
        pending={submit.isPending}
        error={error}
        onChange={(contact) => update({ contact })}
        onBack={back}
        onSubmit={() => {
          setError("");
          const { heardFrom, ...contact } = state.contact;
          submit.mutate({
            contact: {
              ...contact,
              description: [contact.description, heardFrom && `Heard about us: ${heardFrom}`].filter(Boolean).join(" · ") || undefined,
              whatsapp: contact.whatsapp || undefined,
              businessName: contact.businessName || undefined,
            },
            answers,
          });
        }}
      />
    );
  }

  const showOutline = state.started && !state.response && stageOf(answers);

  return (
    <div className="min-h-screen bg-paper text-ink font-sans flex flex-col">
      <header className="border-b border-line bg-paper/90 backdrop-blur sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3" aria-label={`${BRAND.organisationName} home`}>
            <img src={BRAND.markUrl} alt={BRAND.organisationName} className="h-9 w-auto" />
            <span className="border-l border-line pl-3 text-xs font-semibold uppercase tracking-widest text-ink-muted">Business check</span>
          </Link>
          <Link href="/" className="text-xs font-semibold uppercase tracking-wider text-brand hover:text-brand-deep">Back to site</Link>
        </div>
        {showOutline && <SectionRail answers={answers} current={step?.section.id} />}
      </header>

      <main className="flex-1 py-8 md:py-12">
        <div className={`container ${showOutline ? "grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] max-w-6xl" : "max-w-3xl"} mx-auto`}>
          <div className="min-w-0">{screen}</div>
          {showOutline && <OutlinePanel answers={answers} />}
        </div>
      </main>
    </div>
  );
}

/** The broad headers along the top: where the owner is in the check. */
function SectionRail({ answers, current }: { answers: Answers; current?: SectionId }) {
  const sections = sectionPath(answers);
  const path = questionPath(answers);
  const done = path.filter((item) => isAnswered(item.question, answers)).length;
  const currentIndex = current ? sections.indexOf(current) : sections.length;
  return (
    <div className="border-t border-line bg-paper-raised">
      <div className="container py-2.5">
        <div className="flex gap-1.5" aria-hidden>
          {sections.map((id, index) => (
            <span key={id} className={`h-1 flex-1 rounded-full ${index < currentIndex ? "bg-brand" : index === currentIndex ? "bg-highlight" : "bg-line"}`} />
          ))}
        </div>
        <p className="mt-2 flex justify-between gap-4 text-[11px] uppercase tracking-wider text-ink-muted">
          <span className="truncate font-semibold text-brand">{current ? SECTIONS[current].title : "Your details"}</span>
          <span className="shrink-0">{done} of {path.length} answered</span>
        </p>
      </div>
    </div>
  );
}

function Intro({ hasProgress, onStart, onRestart }: { hasProgress: boolean; onStart: () => void; onRestart: () => void }) {
  return (
    <div className="space-y-10">
      <div>
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-highlight-ink">{PROMISE.join(" ")}</p>
        <h1 className="font-serif text-4xl sm:text-5xl font-black leading-tight">The business check</h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-600">
          Some owners know exactly what is wrong. Many can only feel it: busy every day, money in and out, and no clear picture of why it isn't working. This check is for both.
        </p>
        <p className="mt-4 leading-relaxed text-ink-soft">
          It starts with you, the founder, then walks through the parts of the business that apply to you. Each answer decides the next question, so you only see what is relevant. At the end you get a short read: what we found, what we think the real problem is, and where to start.
        </p>
      </div>

      <ol className="grid gap-3 sm:grid-cols-3">
        {[
          { title: "Your business", body: "Stage, size and how you make money." },
          { title: "Founder readiness", body: "How you lead, what you know, the time you have." },
          { title: "The areas that apply", body: "From strategic intent to financials, chosen by your answers." },
        ].map((item, index) => (
          <li key={item.title} className="border border-line bg-paper-raised p-5">
            <span className="font-serif text-2xl font-black text-highlight-ink">{index + 1}</span>
            <p className="mt-2 font-semibold">{item.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">{item.body}</p>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Button onClick={onStart} className="h-14 rounded-none bg-ink px-8 text-sm font-semibold uppercase tracking-widest text-paper hover:bg-charcoal">
          {hasProgress ? "Continue where you left off" : "Take the check"} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        {hasProgress && (
          <button type="button" onClick={onRestart} className="text-sm font-semibold text-brand underline underline-offset-4">Start again</button>
        )}
        <p className="text-sm text-ink-muted">About ten minutes. Free. Ranges are fine.</p>
      </div>

      <p className="flex items-start gap-3 border border-brand-line bg-brand-tint p-4 text-xs leading-relaxed text-brand">
        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Your answers are private to {BRAND.organisationName}. Progress is kept on this device until you send it, so you can stop and come back.</span>
      </p>
    </div>
  );
}

function SectionIntro({ step, answers, onContinue, onBack }: { step: Step; answers: Answers; onContinue: () => void; onBack: () => void }) {
  const { section } = step;
  const example = exampleFor(section, answers);
  const count = questionPath(answers).filter((item) => item.section.id === section.id).length;
  return (
    <div className="space-y-8">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-highlight-ink">
          {section.area === undefined ? "To begin" : `Area ${section.area} of 10`}
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl font-black leading-tight">{section.title}</h2>
      </div>
      <div className="border-l-4 border-brand pl-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">What this means</p>
        <p className="mt-2 text-lg leading-relaxed text-ink-700">{section.means}</p>
      </div>
      {example && (
        <div className="border border-line bg-paper-raised p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{stageOf(answers) === "idea" ? "For example" : "For a business like yours"}</p>
          <p className="mt-2 font-serif text-lg italic leading-relaxed text-ink-soft">{example}</p>
        </div>
      )}
      <div className="flex items-center justify-between gap-4">
        <BackButton onClick={onBack} />
        <Button onClick={onContinue} className="h-12 rounded-none bg-ink px-7 text-xs font-semibold uppercase tracking-widest text-paper hover:bg-charcoal">
          {count === 1 ? "One question" : `${count} questions`} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function QuestionScreen({ step, answers, onAnswer, onBack }: { step: Step; answers: Answers; onAnswer: (question: Question, value: string | string[], advance?: boolean) => void; onBack: () => void }) {
  const { question, section } = step;
  const options = optionsFor(question, answers);
  const current = answers[question.id];
  const [multi, setMulti] = useState<string[]>(Array.isArray(current) ? current : []);
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (value: string) => {
    setPicked(value);
    // A short pause so the owner sees their choice land before the next question.
    window.setTimeout(() => onAnswer(question, value), 160);
  };

  const toggle = (value: string) => {
    const option = options.find((item) => item.value === value);
    setMulti((selected) => {
      if (selected.includes(value)) return selected.filter((item) => item !== value);
      if (option?.exclusive) return [value];
      const exclusive = new Set(options.filter((item) => item.exclusive).map((item) => item.value));
      return [...selected.filter((item) => !exclusive.has(item)), value];
    });
  };

  return (
    <div className="space-y-7">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-highlight-ink">{section.title}</p>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold leading-snug">{promptFor(question, answers)}</h2>
        {question.help && <p className="mt-3 text-sm leading-relaxed text-ink-muted">{question.help}</p>}
      </div>

      {question.kind === "multi" ? (
        <div className="grid gap-2.5">
          {options.map((option) => {
            const on = multi.includes(option.value);
            return (
              <button key={option.value} type="button" onClick={() => toggle(option.value)} aria-pressed={on} className={`flex min-h-14 items-center gap-3 border px-4 py-3 text-left transition-colors ${on ? "border-brand bg-brand-tint" : "border-line bg-paper-raised hover:border-brand"}`}>
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center border ${on ? "border-brand bg-brand text-paper" : "border-line-strong"}`}>{on && <Check className="h-3.5 w-3.5" />}</span>
                <span className="text-[15px] leading-snug">{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className={question.kind === "select" ? "grid grid-cols-2 gap-2.5 sm:grid-cols-3" : "grid gap-2.5"}>
          {options.map((option) => {
            const on = (picked ?? current) === option.value;
            return (
              <button key={option.value} type="button" onClick={() => choose(option.value)} aria-pressed={on} className={`flex min-h-14 items-center justify-between gap-3 border px-4 py-3 text-left transition-colors ${on ? "border-brand bg-brand-tint" : "border-line bg-paper-raised hover:border-brand"}`}>
                <span className="text-[15px] leading-snug">{option.label}</span>
                {on && <CheckCircle2 className="h-5 w-5 shrink-0 text-brand" />}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <BackButton onClick={onBack} />
        {question.kind === "multi" && (
          <Button disabled={!multi.length} onClick={() => onAnswer(question, multi)} className="h-12 rounded-none bg-ink px-7 text-xs font-semibold uppercase tracking-widest text-paper hover:bg-charcoal">
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function ContactScreen({ contact, idea, pending, error, onChange, onBack, onSubmit }: { contact: Contact; idea: boolean; pending: boolean; error: string; onChange: (contact: Contact) => void; onBack: () => void; onSubmit: () => void }) {
  const set = (key: keyof Contact) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...contact, [key]: event.target.value });
  const valid = contact.fullName.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(contact.email.trim());

  if (pending) {
    return (
      <div className="flex flex-col items-center gap-5 py-16 text-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-brand-line border-t-brand" aria-hidden />
        <h2 className="font-serif text-2xl font-bold">Reading your answers…</h2>
        <p className="max-w-md text-sm leading-relaxed text-ink-muted">We are putting your outline together and checking it against what we do. This takes a few seconds.</p>
      </div>
    );
  }

  return (
    <form className="space-y-7" onSubmit={(event) => { event.preventDefault(); if (valid) onSubmit(); }}>
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-highlight-ink">Last step</p>
        <h2 className="font-serif text-3xl font-black leading-tight">Where should we send your summary?</h2>
        <p className="mt-3 leading-relaxed text-ink-muted">You will see it on the next screen, and we will email you a copy.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" required><Input value={contact.fullName} onChange={set("fullName")} autoComplete="name" className="h-12 rounded-none" /></Field>
        <Field label="Email" required><Input type="email" value={contact.email} onChange={set("email")} autoComplete="email" className="h-12 rounded-none" /></Field>
        <Field label="WhatsApp number"><Input type="tel" value={contact.whatsapp} onChange={set("whatsapp")} autoComplete="tel" placeholder="+234" className="h-12 rounded-none" /></Field>
        <Field label={idea ? "Name of the idea or business (if any)" : "Business name"}><Input value={contact.businessName} onChange={set("businessName")} autoComplete="organization" className="h-12 rounded-none" /></Field>
        <Field label={idea ? "Your idea in one line" : "What the business does, in one line"} wide>
          <Input value={contact.description} onChange={set("description")} maxLength={300} placeholder={idea ? "e.g. Healthy lunch deliveries for offices in Lekki" : "e.g. We make and supply school uniforms in Abuja"} className="h-12 rounded-none" />
        </Field>
        <Field label="How did you hear about us?" wide>
          <select value={contact.heardFrom} onChange={set("heardFrom")} className="h-12 w-full border border-input bg-paper-raised px-3 text-sm">
            <option value="">Choose one (optional)</option>
            {HEARD_FROM.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </Field>
      </div>
      {error && <p className="border border-danger-line bg-danger-tint p-3 text-sm text-danger-strong">{error}</p>}
      <div className="flex items-center justify-between gap-4">
        <BackButton onClick={onBack} />
        <Button type="submit" disabled={!valid} className="h-12 rounded-none bg-ink px-7 text-xs font-semibold uppercase tracking-widest text-paper hover:bg-charcoal">
          See my result <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

/** The outline building up as the owner answers: one row per area on their path. */
function OutlinePanel({ answers }: { answers: Answers }) {
  const outline = businessOutline(answers);
  const areas = sectionPath(answers).map((id) => SECTIONS[id].area).filter((area): area is number => area !== undefined);
  if (!areas.length) return null;
  return (
    <aside className="lg:sticky lg:top-40 h-fit border border-line bg-paper-raised p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Your business outline</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-faint">It fills in as you answer.</p>
      <ul className="mt-4 space-y-2">
        {areas.map((area) => {
          const row = outline.find((item) => item.area === area);
          const style = HEALTH_STYLE[row?.health ?? "pending"];
          return (
            <li key={area} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2.5"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />{AREA_NAMES[area]}</span>
              <span className="text-[11px] uppercase tracking-wider text-ink-faint">{style.label}</span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function Result({ response, contact, onRestart }: { response: BusinessCheckResponse; contact: Contact; onRestart: () => void }) {
  const { result, summary } = response;
  const founder = result.founder;
  const style = founder.instinct ? DISC_STYLES[founder.instinct] : undefined;
  const [requested, setRequested] = useState<{ call?: boolean; report?: boolean }>({});
  const requestNext = trpc.businessCheck.requestNext.useMutation({
    onSuccess: (data) => setRequested((current) => ({ ...current, [data.choice]: true })),
  });

  const bookCall = () => {
    if (response.discoveryCallUrl) window.open(response.discoveryCallUrl, "_blank", "noopener,noreferrer");
    requestNext.mutate({ token: response.token, choice: "call" });
  };

  return (
    <div className="space-y-10">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-highlight-ink">Your business check{contact.businessName ? ` · ${contact.businessName}` : ""}</p>
        <h1 className="font-serif text-4xl font-black leading-tight">Here is what we see.</h1>
        <p className="mt-3 flex items-center gap-2 text-sm text-ink-muted"><Mail className="h-4 w-4" />A copy is on its way to {contact.email}.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <SummaryCard title="What we found" body={summary.found} />
        <SummaryCard title="What we think it is" body={summary.think} accent />
      </section>

      {result.outline.length > 0 && (
        <section>
          <SectionHeading>Your business outline</SectionHeading>
          <ul className="grid gap-2">
            {result.outline.map((row) => (
              <li key={row.area} className={`flex flex-col gap-1 border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${HEALTH_STYLE[row.health].row}`}>
                <span className="flex items-center gap-2.5 font-semibold"><span className={`h-2.5 w-2.5 rounded-full ${HEALTH_STYLE[row.health].dot}`} />{row.area}. {row.name}</span>
                <span className="text-xs uppercase tracking-wider">{HEALTH_STYLE[row.health].label}{row.gap && row.health !== "clear" ? ` · ${GAP_LABELS[row.gap].name}` : ""}</span>
              </li>
            ))}
          </ul>
          {result.primaryGap && (
            <p className="mt-4 text-sm leading-relaxed text-ink-soft"><span className="font-semibold text-ink">Main gap: {GAP_LABELS[result.primaryGap].name}.</span> {GAP_LABELS[result.primaryGap].meaning}</p>
          )}
        </section>
      )}

      {founder.instinct && (
        <section className="border border-line bg-paper-raised p-6">
          <SectionHeading>Founder readiness</SectionHeading>
          <p className="font-serif text-2xl font-bold">{READINESS_LABELS[founder.level]}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {([["Capacity", founder.capacity, "Time and people to work on the business"], ["Competence", founder.competence, "Confidence with the numbers"], ["Exposure", founder.exposure, "Training and years of experience"]] as const).map(([name, score, hint]) => (
              <div key={name}>
                <p className="flex justify-between text-sm font-semibold"><span>{name}</span><span className="text-ink-muted">{score} of 2</span></p>
                <div className="mt-1.5 flex gap-1">{[0, 1].map((index) => <span key={index} className={`h-1.5 flex-1 ${index < score ? "bg-brand" : "bg-line"}`} />)}</div>
                <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>
              </div>
            ))}
          </div>
          {style && (
            <p className="mt-5 text-sm leading-relaxed text-ink-soft">
              <span className="font-semibold text-ink">How you lead: {style.name}.</span> {style.strength} {style.watch}
              {founder.seen && founder.seen !== founder.instinct ? ` Others see you more as a ${DISC_STYLES[founder.seen].name.toLowerCase()}.` : ""}
            </p>
          )}
          {founder.needsDriver && (
            <p className="mt-3 border-l-4 border-health-watch bg-health-watch-tint p-3 text-sm leading-relaxed text-ink-700">
              Nobody in the business reliably makes the hard call: chasing the debt, closing the deal, letting someone go. Every team needs that person. It doesn't have to be you, but it has to be someone.
            </p>
          )}
        </section>
      )}

      {summary.offerings.length > 0 && (
        <section>
          <SectionHeading>Where we could help</SectionHeading>
          <ul className="grid gap-3">
            {summary.offerings.map((item) => {
              const offering = offeringById(item.id);
              return (
                <li key={item.id} className="border border-line bg-paper-raised p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-highlight-ink">{offering ? CAPABILITIES[offering.capability] : ""}</p>
                  <p className="mt-1 font-semibold">{item.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{item.why}</p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="bg-gradient-to-br from-brand-plum via-brand-deep to-brand-deep p-6 sm:p-8 text-paper">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-highlight">Next step</p>
        <p className="mt-3 font-serif text-2xl font-bold leading-snug">{summary.next}</p>
        <p className="mt-2 text-sm leading-relaxed text-on-dark-muted">Twenty minutes, free, by phone or video. If we're not the right fit, we'll say so and point you to who is.</p>
        {requested.call ? (
          <p className="mt-6 flex items-start gap-3 border border-highlight/40 p-4 text-sm leading-relaxed">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-highlight" />
            {response.discoveryCallUrl ? "Pick a time on the booking page that opened. If it didn't open, we'll contact you to agree a time." : `Thank you. We'll contact you by ${contact.whatsapp ? "WhatsApp or " : ""}email within one working day to agree a time.`}
          </p>
        ) : (
          <Button onClick={bookCall} disabled={requestNext.isPending} className="mt-6 h-14 w-full sm:w-auto rounded-none bg-highlight px-8 text-sm font-semibold uppercase tracking-widest text-brand-deep hover:bg-highlight-hover">
            <PhoneCall className="mr-2 h-4 w-4" /> Book my free call
          </Button>
        )}
        <div className="mt-6 border-t border-paper/15 pt-5 text-sm text-on-dark-muted">
          {requested.report ? (
            <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-highlight" />We'll email you the payment details for the full report.</p>
          ) : (
            <p>
              Want it in writing? The full report goes deeper on each area and comes by email for {formatNaira(PRICES.fullReport)}.{" "}
              <button type="button" onClick={() => requestNext.mutate({ token: response.token, choice: "report" })} disabled={requestNext.isPending} className="font-semibold text-paper underline underline-offset-4">Request the full report</button>
            </p>
          )}
        </div>
        {requestNext.error && <p className="mt-4 text-sm text-highlight">{requestNext.error.message}</p>}
      </section>

      <p className="text-xs leading-relaxed text-ink-faint">
        {response.summarySource === "AI" ? "This summary was written by AI from your answers and checked against the services we offer. The outline itself comes from fixed rules, so the same answers always give the same outline." : "This summary was written from your answers using fixed rules, so the same answers always give the same result."}{" "}
        <button type="button" onClick={onRestart} className="inline-flex items-center gap-1 font-semibold text-brand underline underline-offset-2"><RotateCcw className="h-3 w-3" />Take the check again</button>
      </p>
    </div>
  );
}

function SummaryCard({ title, body, accent }: { title: string; body: string; accent?: boolean }) {
  return (
    <div className={`border p-6 ${accent ? "border-brand bg-brand-tint" : "border-line bg-paper-raised"}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{title}</p>
      <p className="mt-3 leading-relaxed text-ink-700">{body}</p>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">{children}</h2>;
}

function Field({ label, required, wide, children }: { label: string; required?: boolean; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-muted">{label}{required && <span className="text-highlight-ink"> *</span>}</Label>
      {children}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-brand">
      <ArrowLeft className="h-4 w-4" /> Back
    </button>
  );
}
