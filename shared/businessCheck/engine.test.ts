import { describe, expect, it } from "vitest";
import { OFFERING_IDS } from "./catalogue";
import {
  cleanAnswers,
  evaluate,
  exampleFor,
  founderRead,
  isComplete,
  optionsFor,
  promptFor,
  nextStep,
  questionPath,
  sectionPath,
} from "./engine";
import { SECTIONS, type Answers } from "./questions";

const founderAnswers: Answers = {
  f_instinct: "S",
  f_seen: "S",
  f_team: "solo",
  f_tough: "me_avoid",
  f_education: "short",
  f_finance: ["cash"],
  f_hours: "2to4",
};

const operating = (age: string, extra: Answers = {}): Answers => ({
  p_stage: "operating",
  p_type: "maker",
  p_sector: "food and drink",
  p_age: age,
  p_staff: "6to10",
  p_revenue: "3to5m",
  p_trend: "flat",
  ...founderAnswers,
  ...extra,
});

/** Answers every remaining question with its first option, to walk a whole path. */
function completeWith(answers: Answers, pickIndex = 0): Answers {
  const filled = { ...answers };
  for (let guard = 0; guard < 100; guard++) {
    const step = nextStep(filled);
    if (!step) return filled;
    const options = step.question.options;
    const option = options[Math.min(pickIndex, options.length - 1)];
    filled[step.question.id] = step.question.kind === "multi" ? [option.value] : option.value;
  }
  throw new Error("path did not finish");
}

describe("business check path", () => {
  it("starts with the business profile and asks the stage first", () => {
    expect(sectionPath({})).toEqual(["profile"]);
    expect(nextStep({})?.question.id).toBe("p_stage");
  });

  it("keeps idea-stage founders away from offering, sales and operations questions", () => {
    const answers: Answers = { p_stage: "idea", p_type: "expert", p_sector: "services" };
    expect(sectionPath(answers)).toEqual(["profile", "founder", "idea"]);
    const ids = questionPath(answers).map((step) => step.question.id);
    expect(ids).not.toContain("p_revenue");
    expect(ids).not.toContain("s3_status");
    expect(ids).not.toContain("s5_status");
    expect(ids).toContain("i_customer");
  });

  it("asks a business that trades how long it has traded", () => {
    const ids = questionPath({ p_stage: "operating" }).map((step) => step.question.id);
    expect(ids).toContain("p_age");
  });

  it("chooses problem areas by stage", () => {
    expect(sectionPath(operating("under2")).slice(2)).toEqual(["intent", "market", "offer", "model", "sales", "operations", "finance", "risk"]);
    expect(sectionPath(operating("5to10")).slice(2)).toContain("exit");
    expect(sectionPath(operating("2to5")).slice(2)).not.toContain("exit");
    const mature = sectionPath(operating("over10")).slice(2);
    expect(mature[0]).toBe("model");
    expect(mature).toEqual(expect.arrayContaining(["exit", "transition"]));
  });

  it("asks a side business about operations only once there are staff", () => {
    const side = { p_stage: "side", p_type: "trader", p_age: "under2", p_revenue: "1to3m", p_trend: "growing" };
    expect(sectionPath({ ...side, p_staff: "1to2" })).not.toContain("operations");
    expect(sectionPath({ ...side, p_staff: "3to5" })).toContain("operations");
  });

  it("sends large businesses straight to a conversation and stops very small ones after founder readiness", () => {
    expect(sectionPath(operating("over10", { p_revenue: "over25m" }))).toEqual(["profile"]);
    expect(sectionPath(operating("2to5", { p_staff: "over50" }))).toEqual(["profile"]);
    expect(sectionPath(operating("under2", { p_staff: "0", p_revenue: "under1m" }))).toEqual(["profile", "founder"]);
  });

  it("opens follow-ups only when an area is not clear", () => {
    const base = operating("2to5");
    const clearIds = questionPath({ ...base, s1_status: "clear" }).map((step) => step.question.id);
    expect(clearIds).not.toContain("s1_detail");
    const stuckIds = questionPath({ ...base, s1_status: "busy" }).map((step) => step.question.id);
    expect(stuckIds).toContain("s1_detail");
  });

  it("limits follow-ups for very young businesses to offer, sales and financials", () => {
    const answers = operating("under2", { s1_status: "busy", s3_status: "too_many", s7_status: "tight_guess" });
    const ids = questionPath(answers).map((step) => step.question.id);
    expect(ids).not.toContain("s1_detail");
    expect(ids).toContain("s3_detail");
    expect(ids).toContain("s7_detail");
  });

  it("asks who makes the hard call only when the founder works alone or with family", () => {
    const ids = (team: string) => questionPath({ p_stage: "idea", f_team: team }).map((step) => step.question.id);
    expect(ids("solo")).toContain("f_tough");
    expect(ids("cofounder")).not.toContain("f_tough");
  });

  it("finishes every branch", () => {
    for (const start of [{ p_stage: "idea" }, { p_stage: "side" }, { p_stage: "operating" }]) {
      for (const pick of [0, 1, 2, 3]) {
        expect(isComplete(completeWith(start, pick))).toBe(true);
      }
    }
  });

  it("drops answers left over from a branch the owner backed out of", () => {
    const answers = { ...operating("2to5", { s1_status: "busy", s1_detail: "no_goals" }), p_stage: "idea", i_customer: "named", s3_status: "rubbish" };
    const clean = cleanAnswers(answers);
    expect(clean.s1_status).toBeUndefined();
    expect(clean.p_revenue).toBeUndefined();
    expect(clean.i_customer).toBe("named");
  });

  it("keeps an exclusive choice on its own", () => {
    const clean = cleanAnswers({ p_stage: "idea", ...founderAnswers, f_finance: ["pl", "none"] });
    expect(clean.f_finance).toEqual(["none"]);
  });
});

describe("stage first", () => {
  it("asks the stage first, with full-time owners listed first, then years trading for anyone who trades", () => {
    const stage = nextStep({})!.question;
    expect(stage.id).toBe("p_stage");
    expect(stage.options.map((option) => option.value)).toEqual(["operating", "side", "idea"]);
    expect(nextStep({ p_stage: "operating" })?.question.id).toBe("p_age");
    expect(nextStep({ p_stage: "side" })?.question.id).toBe("p_age");
    expect(nextStep({ p_stage: "idea" })?.question.id).toBe("p_type");
  });

  it("words questions for the owner's stage", () => {
    const type = SECTIONS.profile.questions.find((question) => question.id === "p_type")!;
    const hours = SECTIONS.founder.questions.find((question) => question.id === "f_hours")!;
    expect(promptFor(type, { p_stage: "operating" })).toBe("How does the business make money?");
    expect(promptFor(type, { p_stage: "side" })).toBe("How does the business make money?");
    expect(promptFor(type, { p_stage: "idea" })).toBe("How will the business make money?");
    expect(promptFor(hours, { p_stage: "side" })).toMatch(/^Alongside your job/);
    expect(exampleFor(SECTIONS.founder, { p_stage: "side", p_type: "maker" })).toMatch(/evenings and weekends/);
  });

  it("offers the go-full-time choice only to side businesses", () => {
    const intent = SECTIONS.intent.questions[0];
    expect(optionsFor(intent, { p_stage: "side" }).map((option) => option.value)).toContain("go_fulltime");
    expect(optionsFor(intent, { p_stage: "operating" }).map((option) => option.value)).not.toContain("go_fulltime");
    expect(cleanAnswers({ ...operating("2to5"), s1_status: "go_fulltime" }).s1_status).toBeUndefined();
  });

  it("points a business over ten years old that is flat or declining at the business model first", () => {
    const stuck = { s4_status: "no_money", s7_status: "tight_guess" };
    const flat = evaluate(completeWith(operating("over10", { p_trend: "flat", ...stuck })));
    expect(flat.primaryArea?.area).toBe(4);
    expect(flat.summary.think).toMatch(/ten years/);
    const growing = evaluate(completeWith(operating("over10", { p_trend: "growing", ...stuck })));
    expect(growing.primaryArea?.area).toBe(7);
  });
});

describe("section copy", () => {
  it("defines every section and gives an example for every kind of business", () => {
    for (const section of Object.values(SECTIONS)) {
      expect(section.means.length).toBeGreaterThan(20);
      if (section.id === "profile") continue;
      for (const type of ["maker", "trader", "expert", "mixed"]) {
        expect(exampleFor(section, { p_stage: "operating", p_type: type })).toBeTruthy();
      }
    }
  });

  it("matches the example to the business described", () => {
    expect(exampleFor(SECTIONS.model, { p_stage: "operating", p_type: "maker" })).toMatch(/bakery/i);
    expect(exampleFor(SECTIONS.model, { p_stage: "operating", p_type: "expert" })).toMatch(/studio/i);
    expect(exampleFor(SECTIONS.founder, { p_stage: "idea", p_type: "maker" })).toMatch(/job/i);
  });

  it("only points to offerings in the business plan", () => {
    for (const section of Object.values(SECTIONS)) {
      for (const question of section.questions) {
        for (const option of [...question.options, ...(question.ideaOptions ?? [])]) {
          for (const id of option.offerings ?? []) expect(OFFERING_IDS).toContain(id);
        }
      }
    }
  });
});

describe("founder readiness", () => {
  it("scores capacity, competence and exposure", () => {
    expect(founderRead(founderAnswers)).toMatchObject({ competence: 1, exposure: 1, capacity: 1, level: "intermediate" });
    expect(founderRead({ ...founderAnswers, f_finance: ["pl", "cash", "unit", "margin"], f_education: "corporate", f_hours: "5plus" }).level).toBe("advanced");
    expect(founderRead({ ...founderAnswers, f_finance: ["none"], f_education: "none", f_hours: "lt2", f_tough: "nobody" }).level).toBe("nascent");
  });

  it("counts years of trading as exposure", () => {
    expect(founderRead({ ...founderAnswers, f_education: "none", p_age: "over10" }).exposure).toBe(2);
  });

  it("flags when nobody plays the driving role", () => {
    expect(founderRead(founderAnswers).needsDriver).toBe(true);
    expect(founderRead({ ...founderAnswers, f_seen: "D" }).needsDriver).toBe(false);
    expect(founderRead({ ...founderAnswers, f_tough: "me_easy" }).needsDriver).toBe(false);
  });
});

describe("result", () => {
  it("names financials first when cash and pricing are stuck", () => {
    const answers = completeWith(operating("2to5", { s1_status: "busy", s1_detail: "no_goals", s3_status: "too_many", s7_status: "tight_guess" }));
    const result = evaluate(answers);
    expect(result.route).toBe("programme");
    expect(result.primaryArea?.area).toBe(7);
    expect(result.primaryGap).toBe("clarity");
    expect(result.offerings.map((offering) => offering.id)).toContain("financial-performance");
    expect(result.offerings.length).toBeLessThanOrEqual(3);
    expect(result.outline.find((row) => row.area === 0)?.health).toBe("watch");
  });

  it("recommends embedded support when four or more areas are stuck", () => {
    const answers = completeWith(operating("2to5", { p_trend: "declining", s1_status: "busy", s2_status: "anyone", s3_status: "like_not_buy", s4_status: "no_money", s7_status: "tight_guess" }));
    const ids = evaluate(answers).offerings.map((offering) => offering.id);
    expect(ids.slice(0, 2)).toEqual(["business-transformation", "embedded-support"]);
  });

  it("routes large businesses to advisory without matching offerings", () => {
    const result = evaluate(operating("over10", { p_revenue: "over25m" }));
    expect(result.route).toBe("advisory");
    expect(result.offerings).toEqual([]);
  });

  it("gives idea-stage founders a go or no-go next step", () => {
    const result = evaluate(completeWith({ p_stage: "idea", p_type: "expert", p_sector: "services" }, 2));
    expect(result.route).toBe("idea");
    expect(result.outline.map((row) => row.area)).toEqual([0, 1]);
    expect(result.summary.next).toMatch(/go or no-go/);
  });

  it("is deterministic", () => {
    const answers = completeWith(operating("5to10"), 1);
    expect(evaluate(answers)).toEqual(evaluate(answers));
  });
});
