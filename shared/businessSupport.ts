/**
 * The IP Factory business-support offer: the ten-door catalogue, the price ladder and the
 * engagement rules. Source: Business Support Concept Note and Launch Blueprint v0.6 (final,
 * 4 October 2026), sections 5 to 7 and 11.
 *
 * This is also the problem taxonomy the diagnostic, the engagement record and the portal build
 * on, so door numbers are stable identifiers. Door wording is the concept note's default and
 * may still be edited (concept note, section 18).
 */

export type Door = {
  number: number;
  name: string;
  /** The problem as an owner says it. */
  ownerWords: string;
  /** What IP Factory and the owner do together. */
  together: string;
  /** The single measure tracked for this door. */
  measure: string;
};

export const DOORS: readonly Door[] = [
  { number: 0, name: "Founder readiness", ownerWords: "I have the skill, or the job, but not yet the business.", together: "Test the idea and the founder; build a personal development plan and a first-90-days plan.", measure: "Go or no-go decision; plan in use" },
  { number: 1, name: "Strategic intent", ownerWords: "I'm busy every day and I don't know where this is going.", together: "Set what the business is for and what it must become in three years; agree three priorities.", measure: "Priorities set; weekly time spent on them" },
  { number: 2, name: "Market and industry", ownerWords: "I don't really know who buys, why, or who else sells to them.", together: "Size the market, map competitors and pick the segment to win.", measure: "Target segment chosen; share of sales from it" },
  { number: 3, name: "Service and offering", ownerWords: "People like what I do but they don't buy enough of it.", together: "Rebuild the offer: what is sold, to whom, and at what promise.", measure: "Offer live; conversion or average sale" },
  { number: 4, name: "Business model", ownerWords: "Money comes in and the business still doesn't make money.", together: "Fix how value is made, delivered and captured; margin by line.", measure: "Gross margin; lines stopped or repriced" },
  { number: 5, name: "Market entry and sales", ownerWords: "How do I get customers, consistently, or launch this new thing?", together: "Build the route to market, the pipeline and the launch plan.", measure: "Pipeline live; new customers per month" },
  { number: 6, name: "Operations and people", ownerWords: "Nothing moves unless I'm there.", together: "Write the core processes, design roles, hire or delegate, and set policies.", measure: "Processes in use; owner hours freed" },
  { number: 7, name: "Financials", ownerWords: "Cash is always tight and my prices are guesses.", together: "Pricing, unit economics, a 13-week cash forecast and projections.", measure: "Cash cover in weeks; margin per unit" },
  { number: 8, name: "Risk and compliance", ownerWords: "One tax visit, one key resignation or one bad month could end this.", together: "Map what could kill the business and fence it with controls and cover.", measure: "Risk register in place; top risks mitigated" },
  { number: 9, name: "Exit and value", ownerWords: "What is this business worth, and how do I get out one day?", together: "Make the business sellable: records, less dependence on the owner, valuation logic.", measure: "Valuation drivers improving" },
  { number: 10, name: "Owner transition", ownerWords: "Who am I after this business, and how do I lead what I built?", together: "A career and leadership plan for the owner, and succession where needed.", measure: "Transition plan in use" },
];

export type LadderStep = {
  id: "diagnostic" | "sprint" | "retainer";
  name: string;
  priceNaira: number;
  /** Shown after the price, e.g. "a month". */
  priceSuffix?: string;
  buys: readonly string[];
  scope: string;
};

export const PRICE_LADDER: readonly LadderStep[] = [
  {
    id: "diagnostic",
    name: "Diagnostic",
    priceNaira: 500_000,
    buys: ["Two sessions", "A written problem statement", "Your doors ranked", "The measure to track, proposed"],
    scope: "Credited in full against a sprint started within 30 days.",
  },
  {
    id: "sprint",
    name: "Sprint",
    priceNaira: 1_200_000,
    buys: ["One door, six to eight weeks", "A weekly check-in", "The tools for the job", "Expert review", "Your measure tracked"],
    scope: "One active door at a time. If the measure has not moved by week 8, up to four more weeks at no fee.",
  },
  {
    id: "retainer",
    name: "Retainer",
    priceNaira: 400_000,
    priceSuffix: "a month",
    buys: ["The next door", "A weekly check-in", "An expert on call", "Full tool access"],
    scope: "After your first sprint. Cancel monthly.",
  },
];

export const REFERRAL_RULE = "Refer another owner and take 10% off your next invoice for each referral who pays, up to 30%. Referral credit never applies to a first payment.";

/** The loop every engagement follows for one problem. */
export const ENGAGEMENT_LOOP = [
  { name: "Diagnose", detail: "Paid. Names the real problem." },
  { name: "Prescribe", detail: "What to do, from experience." },
  { name: "Equip", detail: "Method, tools, templates and tech." },
  { name: "Implement", detail: "You do it, in your business." },
  { name: "Review weekly", detail: "Check in, unblock, adjust." },
  { name: "Measure", detail: "Until the agreed number moves." },
] as const;

/** From first contact to the start of the first sprint. */
export const JOINING_STEPS = [
  { name: "Apply", detail: "A ten-minute form: your business, your revenue band and the problem in your words." },
  { name: "Discovery call", detail: "15 to 20 minutes to confirm we can help. You pay nothing until we have." },
  { name: "Pay", detail: "A secure payment link the same day." },
  { name: "Diagnostic", detail: "Two sessions. You leave with a problem statement and your doors ranked." },
  { name: "Sprint starts", detail: "The first door is agreed and its measure is written down." },
] as const;

export const SPRINT_WEEKS = [
  { when: "Week 1", what: "Prescription: what to do and why. Tools handed over. Baseline measure recorded.", ownerTime: "2 hours" },
  { when: "Weeks 2 to 7", what: "You implement. A 45-minute check-in each week on progress, blockers and the next step; your work is reviewed before every call.", ownerTime: "2 to 4 hours a week" },
  { when: "Week 8", what: "The measure is re-read against the baseline. Close or extend, and agree the next door.", ownerTime: "2 hours" },
  { when: "Day 30 after", what: "A check that the work is still in use and the measure has held.", ownerTime: "30 minutes" },
] as const;

export const SERVICE_TIERS = [
  { name: "Equip", detail: "Knowledge at your level, plus the tool for the job.", example: "A pricing model and the method to use it" },
  { name: "Support", detail: "Expert review and advice, weekly and on demand.", example: "The weekly check-in; a partner on a hard call" },
  { name: "Take over", detail: "IP Factory or a group company does the task for a fee.", example: "Bookkeeping, a funding pack, a hiring process" },
] as const;

export function formatNaira(amount: number) {
  return `₦${String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}
