/**
 * The free business check. One question per screen, grouped under broad headers: the business
 * profile, founder readiness, then the problem areas that apply to this owner. Each answer decides
 * what comes next (shared/businessCheck/engine.ts). Every area opens with what it means and an
 * example for the kind of business the owner described. The result is written on the server.
 */
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
import { EASE } from "@/components/motion";
import { AnimatePresence, animate, motion, useMotionValue, useTransform, type Variants } from "framer-motion";
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

/** Screens slide in from the side the owner is moving towards. */
const screenMotion: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 48 }),
  centre: { opacity: 1, x: 0, transition: { duration: 0.42, ease: EASE } },
  leave: (direction: number) => ({ opacity: 0, x: direction * -48, transition: { duration: 0.22, ease: "easeIn" } }),
};

const listMotion: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } } };
const itemMotion: Variants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } } };

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
  const [direction, setDirection] = useState(1);
  const update = (patch: Partial<Saved>) => setState((current) => ({ ...current, ...patch }));

  // Effects must return nothing: some hosts (the claude.ai preview frame) make scrollTo return a value.
  useEffect(() => {
    save(state);
  }, [state]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [editing, state.history.length, state.seen.length, state.started, state.response]);

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
    if (advance) {
      setDirection(1);
      setEditing(null);
    }
  };

  const back = () => {
    setDirection(-1);
    const previous = state.history[state.history.length - 1];
    if (!previous) {
      update({ started: false });
      return;
    }
    update({ history: state.history.slice(0, -1) });
    setEditing(previous);
  };

  let screen: React.ReactNode;
  let screenKey: string;
  if (state.response) {
    screenKey = "result";
    screen = <Result response={state.response} contact={state.contact} onRestart={restart} />;
  } else if (!state.started) {
    screenKey = "intro";
    screen = <Intro hasProgress={state.history.length > 0} onStart={() => update({ started: true })} onRestart={restart} />;
  } else if (step && !state.seen.includes(step.section.id)) {
    screenKey = `section-${step.section.id}`;
    screen = <SectionIntro step={step} answers={answers} onContinue={() => { setDirection(1); update({ seen: [...state.seen, step.section.id] }); }} onBack={back} />;
  } else if (step) {
    screenKey = `question-${step.question.id}`;
    screen = <QuestionScreen key={step.question.id} step={step} answers={answers} onAnswer={answer} onBack={back} />;
  } else {
    screenKey = "contact";
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
          <div className="min-w-0">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={screenKey}
                custom={direction}
                variants={screenMotion}
                initial="enter"
                animate="centre"
                exit="leave"
              >
                {screen}
              </motion.div>
            </AnimatePresence>
          </div>
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
  const sectionDone = current ? path.filter((item) => item.section.id === current && isAnswered(item.question, answers)).length : 0;
  const sectionTotal = current ? path.filter((item) => item.section.id === current).length : 1;
  return (
    <div className="border-t border-line bg-paper-raised">
      <div className="container py-2.5">
        <div className="flex gap-1.5" aria-hidden>
          {sections.map((id, index) => (
            <motion.span key={id} layout className="relative h-1 flex-1 overflow-hidden rounded-full bg-line" transition={{ duration: 0.4, ease: EASE }}>
              <motion.span
                className={`absolute inset-0 origin-left rounded-full ${index < currentIndex ? "bg-brand" : "bg-highlight"}`}
                initial={false}
                animate={{ scaleX: index < currentIndex ? 1 : index === currentIndex ? Math.max(0.08, sectionDone / sectionTotal) : 0 }}
                transition={{ duration: 0.5, ease: EASE }}
              />
            </motion.span>
          ))}
        </div>
        <p className="mt-2 flex justify-between gap-4 text-[11px] uppercase tracking-wider text-ink-muted">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={current ?? "details"} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="truncate font-semibold text-brand">
              {current ? SECTIONS[current].title : "Your details"}
            </motion.span>
          </AnimatePresence>
          <span className="shrink-0 tabular-nums">{done} of {path.length} answered</span>
        </p>
      </div>
    </div>
  );
}

function Intro({ hasProgress, onStart, onRestart }: { hasProgress: boolean; onStart: () => void; onRestart: () => void }) {
  return (
    <motion.div className="space-y-10" variants={listMotion} initial="hidden" animate="show">
      <motion.div variants={itemMotion}>
        <h1 className="font-serif text-4xl font-black leading-[1.08] sm:text-6xl">
          {PROMISE[0]} {PROMISE[1]} <span className="font-normal italic">{PROMISE[2]}</span>
        </h1>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.25em] text-highlight-ink">The free business check</p>
        <p className="mt-6 text-lg leading-relaxed text-ink-600">
          Some owners know exactly what is wrong. Many can only feel it: busy every day, money in and out, and no clear picture of why it isn't working. This check is for both.
        </p>
        <p className="mt-4 leading-relaxed text-ink-soft">
          It starts with you, the founder, then walks through the parts of the business that apply to you. Each answer decides the next question, so you only see what is relevant. At the end you get a short read: what we found, what we think the real problem is, and where to start.
        </p>
      </motion.div>

      <ol className="grid gap-3 sm:grid-cols-3">
        {[
          { title: "Your business", body: "Stage, size and how you make money." },
          { title: "Founder readiness", body: "How you lead, what you know, the time you have." },
          { title: "The areas that apply", body: "From strategic intent to financials, chosen by your answers." },
        ].map((item, index) => (
          <motion.li key={item.title} variants={itemMotion} whileHover={{ y: -4 }} className="border border-line bg-paper-raised p-5 transition-shadow hover:shadow-lg">
            <span className="font-serif text-2xl font-black text-highlight-ink">{index + 1}</span>
            <p className="mt-2 font-semibold">{item.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">{item.body}</p>
          </motion.li>
        ))}
      </ol>

      <motion.div variants={itemMotion} className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <PrimaryButton onClick={onStart} large>{hasProgress ? "Continue where you left off" : "Take the check"}</PrimaryButton>
        {hasProgress && (
          <button type="button" onClick={onRestart} className="text-sm font-semibold text-brand underline underline-offset-4">Start again</button>
        )}
        <p className="text-sm text-ink-muted">About ten minutes. Free. Ranges are fine.</p>
      </motion.div>

      <motion.p variants={itemMotion} className="flex items-start gap-3 border border-brand-line bg-brand-tint p-4 text-xs leading-relaxed text-brand">
        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Your answers are private to {BRAND.organisationName}. Progress is kept on this device until you send it, so you can stop and come back.</span>
      </motion.p>
    </motion.div>
  );
}

function SectionIntro({ step, answers, onContinue, onBack }: { step: Step; answers: Answers; onContinue: () => void; onBack: () => void }) {
  const { section } = step;
  const example = exampleFor(section, answers);
  const count = questionPath(answers).filter((item) => item.section.id === section.id).length;
  useKeys((key) => {
    if (key === "Enter") onContinue();
  });
  return (
    <motion.div className="space-y-8" variants={listMotion} initial="hidden" animate="show">
      <motion.div variants={itemMotion}>
        <p className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-highlight-ink">
          {section.area !== undefined && (
            <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }} className="flex h-8 w-8 items-center justify-center rounded-full bg-highlight-ink font-serif text-sm text-paper">
              {section.area}
            </motion.span>
          )}
          {section.area === undefined ? "To begin" : "Of ten areas"}
        </p>
        <h2 className="font-serif text-3xl font-black leading-tight sm:text-5xl">{section.title}</h2>
      </motion.div>
      <motion.div variants={itemMotion} className="relative pl-5">
        <motion.span aria-hidden className="absolute inset-y-0 left-0 w-1 origin-top bg-brand" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.6, ease: EASE, delay: 0.2 }} />
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">What this means</p>
        <p className="mt-2 text-lg leading-relaxed text-ink-700">{section.means}</p>
      </motion.div>
      {example && (
        <motion.div variants={itemMotion} className="border border-line bg-paper-raised p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{stageOf(answers) === "idea" ? "For example" : "For a business like yours"}</p>
          <p className="mt-2 font-serif text-lg italic leading-relaxed text-ink-soft">{example}</p>
        </motion.div>
      )}
      <motion.div variants={itemMotion} className="flex items-center justify-between gap-4">
        <BackButton onClick={onBack} />
        <PrimaryButton onClick={onContinue}>{count === 1 ? "One question" : `${count} questions`}</PrimaryButton>
      </motion.div>
    </motion.div>
  );
}

/** Keyboard shortcuts for the current screen: number keys pick options, Enter continues. */
function useKeys(handler: (key: string) => void) {
  const ref = React.useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA")) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      ref.current(event.key);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
}

function QuestionScreen({ step, answers, onAnswer, onBack }: { step: Step; answers: Answers; onAnswer: (question: Question, value: string | string[], advance?: boolean) => void; onBack: () => void }) {
  const { question, section } = step;
  const options = optionsFor(question, answers);
  const current = answers[question.id];
  const [multi, setMulti] = useState<string[]>(Array.isArray(current) ? current : []);
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (value: string) => {
    if (picked) return;
    setPicked(value);
    // A short pause so the owner sees their choice land before the next question.
    window.setTimeout(() => onAnswer(question, value), 320);
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

  useKeys((key) => {
    const index = Number(key) - 1;
    if (Number.isInteger(index) && index >= 0 && index < Math.min(options.length, 9)) {
      if (question.kind === "multi") toggle(options[index].value);
      else choose(options[index].value);
    } else if (key === "Enter" && question.kind === "multi" && multi.length) {
      onAnswer(question, multi);
    } else if (key === "Backspace" || key === "ArrowLeft") {
      onBack();
    }
  });

  const grid = question.kind === "select" ? "grid grid-cols-2 gap-2.5 sm:grid-cols-3" : "grid gap-2.5";

  return (
    <div className="space-y-7">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-highlight-ink">{section.title}</p>
        <h2 className="font-serif text-2xl font-bold leading-snug sm:text-3xl">{promptFor(question, answers)}</h2>
        {question.help && <p className="mt-3 text-sm leading-relaxed text-ink-muted">{question.help}</p>}
        {question.kind === "multi" && !question.help && <p className="mt-3 text-sm text-ink-muted">Choose all that apply.</p>}
      </div>

      <motion.div className={grid} variants={listMotion} initial="hidden" animate="show">
        {options.map((option, index) => {
          const on = question.kind === "multi" ? multi.includes(option.value) : (picked ?? current) === option.value;
          const dimmed = question.kind !== "multi" && picked !== null && !on;
          return (
            <motion.button
              key={option.value}
              type="button"
              variants={itemMotion}
              onClick={() => (question.kind === "multi" ? toggle(option.value) : choose(option.value))}
              aria-pressed={on}
              whileHover={{ x: question.kind === "select" ? 0 : 4, y: question.kind === "select" ? -2 : 0 }}
              whileTap={{ scale: 0.98 }}
              animate={dimmed ? { opacity: 0.45 } : { opacity: 1 }}
              className={`group relative flex min-h-14 items-center gap-3 overflow-hidden border px-4 py-3 text-left transition-colors duration-200 ${on ? "border-brand text-ink" : "border-line bg-paper-raised hover:border-brand hover:shadow-md"}`}
            >
              {/* The fill sweeps in from the left when chosen. */}
              <motion.span aria-hidden className="absolute inset-0 origin-left bg-brand-tint" initial={false} animate={{ scaleX: on ? 1 : 0 }} transition={{ duration: 0.3, ease: EASE }} />
              {question.kind === "multi" ? (
                <span className={`relative flex h-5 w-5 shrink-0 items-center justify-center border transition-colors ${on ? "border-brand bg-brand text-paper" : "border-line-strong bg-paper-raised"}`}>
                  <AnimatePresence>{on && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500, damping: 25 }}><Check className="h-3.5 w-3.5" /></motion.span>}</AnimatePresence>
                </span>
              ) : (
                index < 9 && <span aria-hidden className={`relative hidden h-6 w-6 shrink-0 items-center justify-center border text-[11px] font-semibold tabular-nums transition-colors sm:flex ${on ? "border-brand bg-brand text-paper" : "border-line text-ink-faint group-hover:border-brand group-hover:text-brand"}`}>{index + 1}</span>
              )}
              <span className="relative flex-1 text-[15px] leading-snug">{option.label}</span>
              <AnimatePresence>
                {on && question.kind !== "multi" && (
                  <motion.span className="relative" initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500, damping: 22 }}>
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-brand" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </motion.div>

      <div className="flex items-center justify-between gap-4">
        <BackButton onClick={onBack} />
        {question.kind === "multi" ? (
          <PrimaryButton disabled={!multi.length} onClick={() => onAnswer(question, multi)}>Continue</PrimaryButton>
        ) : (
          <p className="hidden text-xs text-ink-faint sm:block">Tip: press 1 to {Math.min(options.length, 9)} to answer</p>
        )}
      </div>
    </div>
  );
}

const READING_STEPS = ["Reading your answers", "Building your business outline", "Checking it against what we offer", "Writing your summary"];

function Reading() {
  const [stepIndex, setStepIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setStepIndex((current) => Math.min(current + 1, READING_STEPS.length - 1)), 1400);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div className="flex flex-col items-center gap-8 py-14 text-center">
      <div className="relative h-20 w-20">
        <motion.span className="absolute inset-0 rounded-full border-4 border-brand-line border-t-brand" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
        <motion.span className="absolute inset-3 rounded-full bg-gradient-to-br from-brand-plum to-highlight" animate={{ scale: [0.8, 1, 0.8], opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} />
      </div>
      <ul className="w-full max-w-sm space-y-3 text-left">
        {READING_STEPS.map((label, index) => (
          <motion.li key={label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: index <= stepIndex ? 1 : 0.35, x: 0 }} transition={{ delay: index * 0.1, duration: 0.4 }} className="flex items-center gap-3 text-sm">
            <span className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors duration-300 ${index < stepIndex ? "border-brand bg-brand text-paper" : index === stepIndex ? "border-brand" : "border-line"}`}>
              {index < stepIndex ? <Check className="h-3 w-3" /> : index === stepIndex ? <motion.span className="h-1.5 w-1.5 rounded-full bg-brand" animate={{ scale: [1, 1.6, 1] }} transition={{ duration: 0.9, repeat: Infinity }} /> : null}
            </span>
            {label}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function ContactScreen({ contact, idea, pending, error, onChange, onBack, onSubmit }: { contact: Contact; idea: boolean; pending: boolean; error: string; onChange: (contact: Contact) => void; onBack: () => void; onSubmit: () => void }) {
  const set = (key: keyof Contact) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...contact, [key]: event.target.value });
  const valid = contact.fullName.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(contact.email.trim());

  if (pending) return <Reading />;

  return (
    <motion.form className="space-y-7" variants={listMotion} initial="hidden" animate="show" onSubmit={(event) => { event.preventDefault(); if (valid) onSubmit(); }}>
      <motion.div variants={itemMotion}>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-highlight-ink">Last step</p>
        <h2 className="font-serif text-3xl font-black leading-tight">Where should we send your summary?</h2>
        <p className="mt-3 leading-relaxed text-ink-muted">You will see it on the next screen, and we will email you a copy.</p>
      </motion.div>
      <motion.div variants={itemMotion} className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" required><Input value={contact.fullName} onChange={set("fullName")} autoComplete="name" className="h-12 rounded-none transition-shadow focus-visible:shadow-[0_0_0_4px_rgba(28,78,126,0.12)]" /></Field>
        <Field label="Email" required><Input type="email" value={contact.email} onChange={set("email")} autoComplete="email" className="h-12 rounded-none transition-shadow focus-visible:shadow-[0_0_0_4px_rgba(28,78,126,0.12)]" /></Field>
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
      </motion.div>
      <AnimatePresence>
        {error && <motion.p initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: [0, -6, 6, -3, 0] }} exit={{ opacity: 0 }} className="border border-danger-line bg-danger-tint p-3 text-sm text-danger-strong">{error}</motion.p>}
      </AnimatePresence>
      <motion.div variants={itemMotion} className="flex items-center justify-between gap-4">
        <BackButton onClick={onBack} />
        <PrimaryButton type="submit" disabled={!valid}>See my result</PrimaryButton>
      </motion.div>
    </motion.form>
  );
}

/** The outline building up as the owner answers: one row per area on their path. */
function OutlinePanel({ answers }: { answers: Answers }) {
  const outline = businessOutline(answers);
  const areas = sectionPath(answers).map((id) => SECTIONS[id].area).filter((area): area is number => area !== undefined);
  if (!areas.length) return null;
  return (
    <motion.aside initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: EASE }} className="h-fit border border-line bg-paper-raised p-5 lg:sticky lg:top-40">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Your business outline</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-faint">It fills in as you answer.</p>
      <ul className="mt-4 space-y-2">
        <AnimatePresence initial={false}>
          {areas.map((area) => {
            const row = outline.find((item) => item.area === area);
            const health = row?.health ?? "pending";
            const style = HEALTH_STYLE[health];
            return (
              <motion.li key={area} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    {health !== "pending" && <motion.span key={`ring-${health}`} className={`absolute inset-0 rounded-full ${style.dot}`} initial={{ scale: 1, opacity: 0.6 }} animate={{ scale: 3, opacity: 0 }} transition={{ duration: 0.8 }} />}
                    <motion.span key={health} className={`relative h-2.5 w-2.5 rounded-full ${style.dot}`} initial={{ scale: 0.3 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }} />
                  </span>
                  <span className={health === "pending" ? "text-ink-muted" : "text-ink"}>{AREA_NAMES[area]}</span>
                </span>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={health} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className={`text-[11px] font-semibold uppercase tracking-wider ${health === "pending" ? "text-ink-faint" : style.row.split(" ").find((name) => name.startsWith("text-"))}`}>
                    {style.label}
                  </motion.span>
                </AnimatePresence>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </motion.aside>
  );
}

function CountUp({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  useEffect(() => {
    const controls = animate(count, value, { duration: 1, ease: EASE, delay: 0.4 });
    return () => controls.stop();
  }, [count, value]);
  return <motion.span>{rounded}</motion.span>;
}

function Result({ response, contact, onRestart }: { response: BusinessCheckResponse; contact: Contact; onRestart: () => void }) {
  const { result, summary } = response;
  const founder = result.founder;
  const style = founder.instinct ? DISC_STYLES[founder.instinct] : undefined;
  const [requested, setRequested] = useState<{ call?: boolean; report?: boolean }>({});
  const requestNext = trpc.businessCheck.requestNext.useMutation({
    onSuccess: (data) => setRequested((current) => ({ ...current, [data.choice]: true })),
  });
  const tally = (["stuck", "watch", "clear"] as const).map((health) => ({ health, count: result.outline.filter((row) => row.health === health).length }));

  const bookCall = () => {
    if (response.discoveryCallUrl) window.open(response.discoveryCallUrl, "_blank", "noopener,noreferrer");
    requestNext.mutate({ token: response.token, choice: "call" });
  };

  return (
    <motion.div className="space-y-10" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }} initial="hidden" animate="show">
      <motion.div variants={itemMotion}>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-highlight-ink">Your business check{contact.businessName ? ` · ${contact.businessName}` : ""}</p>
        <h1 className="font-serif text-4xl font-black leading-tight sm:text-5xl">Here is what we see.</h1>
        <p className="mt-3 flex items-center gap-2 text-sm text-ink-muted"><Mail className="h-4 w-4" />A copy is on its way to {contact.email}.</p>
      </motion.div>

      {result.outline.length > 1 && (
        <motion.div variants={itemMotion} className="grid grid-cols-3 gap-3">
          {tally.map(({ health, count }) => (
            <div key={health} className={`border p-4 text-center ${HEALTH_STYLE[health].row}`}>
              <p className="font-serif text-4xl font-black tabular-nums"><CountUp value={count} /></p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider">{HEALTH_STYLE[health].label}</p>
            </div>
          ))}
        </motion.div>
      )}

      <motion.section variants={itemMotion} className="grid gap-4 md:grid-cols-2">
        <SummaryCard title="What we found" body={summary.found} />
        <SummaryCard title="What we think it is" body={summary.think} accent />
      </motion.section>

      {result.outline.length > 0 && (
        <motion.section variants={itemMotion}>
          <SectionHeading>Your business outline</SectionHeading>
          <motion.ul className="grid gap-2" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } } }} initial="hidden" whileInView="show" viewport={{ once: true }}>
            {result.outline.map((row) => {
              const isMain = result.primaryArea?.area === row.area;
              return (
                <motion.li key={row.area} variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE } } }} whileHover={{ x: 4 }} className={`flex flex-col gap-1 border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${HEALTH_STYLE[row.health].row} ${isMain ? "ring-2 ring-offset-2 ring-brand" : ""}`}>
                  <span className="flex items-center gap-2.5 font-semibold"><span className={`h-2.5 w-2.5 rounded-full ${HEALTH_STYLE[row.health].dot}`} />{row.area}. {row.name}{isMain && <span className="ml-1 bg-brand px-2 py-0.5 text-[10px] uppercase tracking-wider text-paper">Start here</span>}</span>
                  <span className="text-xs uppercase tracking-wider">{HEALTH_STYLE[row.health].label}{row.gap && row.health !== "clear" ? ` · ${GAP_LABELS[row.gap].name}` : ""}</span>
                </motion.li>
              );
            })}
          </motion.ul>
          {result.primaryGap && (
            <p className="mt-4 text-sm leading-relaxed text-ink-soft"><span className="font-semibold text-ink">Main gap: {GAP_LABELS[result.primaryGap].name}.</span> {GAP_LABELS[result.primaryGap].meaning}</p>
          )}
        </motion.section>
      )}

      {founder.instinct && (
        <motion.section variants={itemMotion} className="border border-line bg-paper-raised p-6">
          <SectionHeading>Founder readiness</SectionHeading>
          <p className="font-serif text-2xl font-bold">{READINESS_LABELS[founder.level]}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {([["Capacity", founder.capacity, "Time and people to work on the business"], ["Competence", founder.competence, "Confidence with the numbers"], ["Exposure", founder.exposure, "Training and years of experience"]] as const).map(([name, score, hint], index) => (
              <div key={name}>
                <p className="flex justify-between text-sm font-semibold"><span>{name}</span><span className="text-ink-muted">{score} of 2</span></p>
                <div className="mt-1.5 flex gap-1">
                  {[0, 1].map((cell) => (
                    <span key={cell} className="relative h-1.5 flex-1 overflow-hidden bg-line">
                      <motion.span className="absolute inset-0 origin-left bg-brand" initial={{ scaleX: 0 }} whileInView={{ scaleX: cell < score ? 1 : 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: EASE, delay: 0.2 + index * 0.15 + cell * 0.2 }} />
                    </span>
                  ))}
                </div>
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
        </motion.section>
      )}

      {summary.offerings.length > 0 && (
        <motion.section variants={itemMotion}>
          <SectionHeading>Where we could help</SectionHeading>
          <ul className="grid gap-3">
            {summary.offerings.map((item, index) => {
              const offering = offeringById(item.id);
              return (
                <motion.li key={item.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, ease: EASE, delay: index * 0.08 }} whileHover={{ y: -3 }} className="group relative border border-line bg-paper-raised p-5 transition-shadow hover:shadow-lg">
                  <span aria-hidden className="absolute inset-y-0 left-0 w-1 origin-top scale-y-0 bg-highlight-ink transition-transform duration-300 group-hover:scale-y-100" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-highlight-ink">{offering ? CAPABILITIES[offering.capability] : ""}</p>
                  <p className="mt-1 font-semibold">{item.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{item.why}</p>
                </motion.li>
              );
            })}
          </ul>
        </motion.section>
      )}

      <motion.section variants={itemMotion} className="relative overflow-hidden bg-gradient-to-br from-brand-plum via-brand-deep to-brand-deep p-6 text-paper sm:p-8">
        <motion.div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-highlight/25 blur-3xl" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-highlight">Next step</p>
          <p className="mt-3 font-serif text-2xl font-bold leading-snug">{summary.next}</p>
          <p className="mt-2 text-sm leading-relaxed text-on-dark-muted">Twenty minutes, free, by phone or video. If we're not the right fit, we'll say so and point you to who is.</p>
          <AnimatePresence mode="wait" initial={false}>
            {requested.call ? (
              <motion.p key="booked" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 24 }} className="mt-6 flex items-start gap-3 border border-highlight/40 p-4 text-sm leading-relaxed">
                <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-highlight" /></motion.span>
                {response.discoveryCallUrl ? "Pick a time on the booking page that opened. If it didn't open, we'll contact you to agree a time." : `Thank you. We'll contact you by ${contact.whatsapp ? "WhatsApp or " : ""}email within one working day to agree a time.`}
              </motion.p>
            ) : (
              <motion.div key="book" exit={{ opacity: 0, scale: 0.96 }}>
                <motion.button type="button" onClick={bookCall} disabled={requestNext.isPending} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="group mt-6 inline-flex h-14 w-full items-center justify-center bg-highlight px-8 text-sm font-semibold uppercase tracking-widest text-brand-deep shadow-[0_18px_40px_-18px_rgba(54,183,224,0.9)] transition-colors hover:bg-highlight-hover disabled:opacity-60 sm:w-auto">
                  <PhoneCall className="mr-2 h-4 w-4 transition-transform group-hover:-rotate-12" /> Book my free call
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="mt-6 border-t border-paper/15 pt-5 text-sm text-on-dark-muted">
            {requested.report ? (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-highlight" />We'll email you the payment details for the full report.</motion.p>
            ) : (
              <p>
                Want it in writing? The full report goes deeper on each area and comes by email for {formatNaira(PRICES.fullReport)}.{" "}
                <button type="button" onClick={() => requestNext.mutate({ token: response.token, choice: "report" })} disabled={requestNext.isPending} className="font-semibold text-paper underline underline-offset-4 hover:text-highlight">Request the full report</button>
              </p>
            )}
          </div>
          {requestNext.error && <p className="mt-4 text-sm text-highlight">{requestNext.error.message}</p>}
        </div>
      </motion.section>

      <motion.p variants={itemMotion} className="text-xs leading-relaxed text-ink-faint">
        {response.summarySource === "AI" ? "This summary was written by AI from your answers and checked against the services we offer. The outline itself comes from fixed rules, so the same answers always give the same outline." : "This summary was written from your answers using fixed rules, so the same answers always give the same result."}{" "}
        <button type="button" onClick={onRestart} className="inline-flex items-center gap-1 font-semibold text-brand underline underline-offset-2"><RotateCcw className="h-3 w-3" />Take the check again</button>
      </motion.p>
    </motion.div>
  );
}

function SummaryCard({ title, body, accent }: { title: string; body: string; accent?: boolean }) {
  return (
    <motion.div whileHover={{ y: -3 }} className={`border p-6 transition-shadow hover:shadow-lg ${accent ? "border-brand bg-brand-tint" : "border-line bg-paper-raised"}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{title}</p>
      <p className="mt-3 leading-relaxed text-ink-700">{body}</p>
    </motion.div>
  );
}

function PrimaryButton({ children, onClick, disabled, type = "button", large }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit"; large?: boolean }) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={`group inline-flex items-center justify-center bg-ink font-semibold uppercase tracking-widest text-paper shadow-[0_14px_30px_-16px_rgba(18,50,79,0.8)] transition-colors hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${large ? "h-14 px-8 text-sm" : "h-12 px-7 text-xs"}`}
    >
      {children}
      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </motion.button>
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
    <button type="button" onClick={onClick} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted transition-colors hover:text-brand">
      <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" /> Back
    </button>
  );
}
