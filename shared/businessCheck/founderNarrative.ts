/**
 * Founder readiness in words, built from the owner's own answers, so the result says what the
 * score means rather than showing three abstract numbers.
 */
import { DISC_STYLES, founderRead, type DiscStyle, type FounderRead } from "./engine";
import type { Answers } from "./questions";

export type Strength = "strong" | "building" | "gap";
export type FounderLine = { key: "capacity" | "competence" | "exposure"; title: string; strength: Strength; text: string };
export type FounderNarrative = { heading: string; summary: string; lines: FounderLine[]; lead?: string };

const LEVEL_NAMES = { advanced: "Advanced", intermediate: "Intermediate", nascent: "Nascent" } as const;
export const STRENGTH_LABELS: Record<Strength, string> = { strong: "Strong", building: "Building", gap: "Gap" };
const strengthOf = (score: number): Strength => (score >= 2 ? "strong" : score === 1 ? "building" : "gap");

const HOURS: Record<string, string> = { lt2: "less than 2 hours a week", "2to4": "2 to 4 hours a week", "5plus": "5 or more hours a week" };
const TEAM: Record<string, string> = {
  solo: "and you carry it mostly on your own",
  cofounder: "and you have a co-founder or partner beside you",
  team: "with a management team beside you",
  family: "with family helping you run it",
};
const MONEY_BASICS: { value: string; name: string }[] = [
  { value: "pl", name: "reading a profit and loss statement" },
  { value: "cash", name: "telling profit from cash" },
  { value: "unit", name: "cost per unit" },
  { value: "margin", name: "margin" },
];
const EDUCATION: Record<string, string> = {
  none: "You have learned by doing",
  short: "You have taken short courses",
  degree: "You have a business degree or professional qualification",
  corporate: "You have years of managing in a company behind you",
};
const YEARS: Record<string, string> = { "5to10": "5 to 10 years of trading", over10: "over 10 years of trading" };

/** What you do first under pressure, and how others describe you (the two DISC questions). */
const INSTINCT: Record<DiscStyle, string> = {
  D: "you take charge and push for a fix",
  I: "you rally people around a solution",
  S: "you calm things down and keep the work going",
  C: "you find out exactly what went wrong before acting",
};
const SEEN: Record<DiscStyle, string> = {
  D: "direct and results-driven",
  I: "persuasive and full of energy",
  S: "patient and dependable",
  C: "careful and precise",
};

const listOf = (items: string[]) => (items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);
const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export function describeFounder(answers: Answers, read: FounderRead = founderRead(answers)): FounderNarrative {
  const score = read.capacity + read.competence + read.exposure;

  const hours = HOURS[String(answers.f_hours)] ?? "some time";
  const team = TEAM[String(answers.f_team)] ?? "";
  const toughNote = answers.f_tough === "nobody" ? " Hard calls often don't get made, which holds this back." : "";
  const capacity: FounderLine = { key: "capacity", title: "Time and people", strength: strengthOf(read.capacity), text: `You can give ${hours} to working on the business${team ? `, ${team}` : ""}.${toughNote}` };

  const ticked = Array.isArray(answers.f_finance) ? answers.f_finance : [];
  const confident = MONEY_BASICS.filter((basic) => ticked.includes(basic.value));
  const missing = MONEY_BASICS.filter((basic) => !ticked.includes(basic.value));
  const moneyText = confident.length === MONEY_BASICS.length
    ? "You are confident with all four money basics: profit and loss, profit versus cash, cost per unit and margin."
    : confident.length === 0
      ? "None of the four money basics yet: profit and loss, profit versus cash, cost per unit and margin. This is the first thing to build."
      : `You are confident with ${confident.length} of the 4 money basics. ${capitalise(listOf(missing.map((basic) => basic.name)))} ${missing.length === 1 ? "is the one" : "are the ones"} to strengthen.`;
  const competence: FounderLine = { key: "competence", title: "The numbers", strength: strengthOf(read.competence), text: moneyText };

  const education = EDUCATION[String(answers.f_education)] ?? "Your experience";
  const years = YEARS[String(answers.p_age)];
  const exposure: FounderLine = { key: "exposure", title: "Experience", strength: strengthOf(read.exposure), text: `${education}${years ? `, and ${years}` : ""}.` };

  const lines = [capacity, competence, exposure];
  const phrase: Record<FounderLine["key"], string> = { capacity: "the time and people", competence: "a grip on the numbers", exposure: "the experience" };
  const gapPhrase: Record<FounderLine["key"], string> = { capacity: "time and people", competence: "the numbers", exposure: "experience" };
  const strong = lines.filter((line) => line.strength === "strong").map((line) => phrase[line.key]);
  const weak = lines.filter((line) => line.strength !== "strong").map((line) => gapPhrase[line.key]);
  const purpose = read.level === "advanced" ? "to lead the next stage" : "to build on";
  const summary = !weak.length
    ? `You have the time and people, a grip on the numbers and the experience ${purpose}.`
    : !strong.length
      ? `Time and people, the numbers and experience all need building before the business can grow on you.`
      : `You have ${listOf(strong)} ${purpose}. The gap ${weak.length === 1 ? "is" : "is in"} ${listOf(weak)}.`;

  let lead: string | undefined;
  if (read.instinct) {
    const instinct = `Under pressure ${INSTINCT[read.instinct]} (${DISC_STYLES[read.instinct].name}).`;
    if (read.seen && read.seen !== read.instinct) {
      lead = `${instinct} Others see you as ${SEEN[read.seen]} (${DISC_STYLES[read.seen].name}). Worth asking which one your team needs from you right now.`;
    } else {
      lead = `${instinct} ${DISC_STYLES[read.instinct].strength} ${DISC_STYLES[read.instinct].watch}`;
    }
  }

  return { heading: `${LEVEL_NAMES[read.level]} (${score} of 6)`, summary, lines, lead };
}
