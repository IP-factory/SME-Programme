/**
 * The IP Factory business-support offer: the ten problem areas, the journey with its prices,
 * and the engagement rules. Source: Business Support Concept Note and Launch Blueprint v0.8.1
 * (6 October 2026), sections 6, 7, 11 and 16. v0.1 scope is frozen; later edits go to v0.2.
 *
 * Copy rules (front matter): second person, short sentences, naira in full, no consulting words,
 * and never "door", "sprint", "playbook" or "retainer" on the site.
 *
 * The problem areas are also the taxonomy the business check, the engagement record and the
 * portal build on, so their numbers are stable identifiers.
 */

export type ProblemArea = {
  number: number;
  name: string;
  /** The problem as a business owner says it (section 6). */
  ownerWords: string;
  /** The shorter sentence used on the site (section 16); absent where the site does not list the area. */
  siteSentence?: string;
  /** What IP Factory and the business owner do together. */
  together: string;
  /** The one number watched together. */
  measure: string;
};

export const PROBLEM_AREAS: readonly ProblemArea[] = [
  { number: 0, name: "Founder readiness", ownerWords: "I have the skill, or the job, but not yet the business.", siteSentence: "I have the skill, or the job, but not yet the business.", together: "Test the idea and the founder; build a personal development plan and a first-90-days plan.", measure: "Go or no-go decision; plan in use" },
  { number: 1, name: "Strategic intent", ownerWords: "I'm busy every day and I don't know where this is going.", siteSentence: "I'm busy every day and I don't know where this is going.", together: "Set what the business is for and what it must become in three years; three priorities.", measure: "Priorities set; weekly time spent on them" },
  { number: 2, name: "Market and industry", ownerWords: "I don't really know who buys, why, or who else sells to them.", siteSentence: "I don't really know who buys, why, or who else sells to them.", together: "Size the market, map competitors, pick the segment to win.", measure: "Target segment chosen; share of sales from it" },
  { number: 3, name: "Service and offering", ownerWords: "People like what I do but they don't buy enough of it.", siteSentence: "People like what I do but they don't buy enough of it.", together: "Rebuild the offer: what is sold, to whom, at what promise.", measure: "Offer live; conversion or average sale" },
  { number: 4, name: "Business model", ownerWords: "Money comes in and the business still doesn't make money.", siteSentence: "Money comes in and the business still doesn't make money.", together: "Fix how value is made, delivered and captured; margin by line.", measure: "Gross margin; lines stopped or repriced" },
  { number: 5, name: "Market entry and sales", ownerWords: "How do I get customers, consistently, or launch this new thing?", siteSentence: "How do I get customers, consistently?", together: "Build the route to market, the pipeline and the launch plan.", measure: "Pipeline live; new customers per month" },
  { number: 6, name: "Operations and people", ownerWords: "Nothing moves unless I'm there.", siteSentence: "Nothing moves unless I'm there.", together: "Write the core processes, design roles, hire or delegate, set policies.", measure: "Processes in use; business owner hours freed" },
  { number: 7, name: "Financials", ownerWords: "Cash is always tight and my prices are guesses.", siteSentence: "Cash is always tight and my prices are guesses.", together: "Pricing, unit economics, 13-week cash forecast, projections.", measure: "Cash cover in weeks; margin per unit" },
  { number: 8, name: "Risk and compliance", ownerWords: "One tax visit, one key resignation or one bad month could end this.", siteSentence: "One tax visit or one resignation could end this.", together: "Map what could kill the business; fence it with controls and cover.", measure: "Register in place; top risks mitigated" },
  { number: 9, name: "Exit and value", ownerWords: "What is this business worth, and how do I get out one day?", siteSentence: "What is this business worth, and how do I get out one day?", together: "Make the business sellable: records, dependence on the business owner, valuation logic.", measure: "Valuation drivers improving" },
  { number: 10, name: "Owner transition", ownerWords: "Who am I after this business, and how do I lead what I built?", together: "Career and leadership plan for the business owner; succession where needed.", measure: "Transition plan in use" },
];

/**
 * The offer in three words, in place of JUMP's "Learn, Apply, Decide". It starts with finding the
 * problem because many owners can feel that something is wrong without being able to name it.
 */
export const PROMISE = ["Find it.", "Fix it.", "Follow through."] as const;

/** Prices in naira (section 11). Ongoing support is deliberately unpriced: copy must not quote a figure. */
export const PRICES = {
  fullReport: 100_000,
  currentStateFrom: 500_000,
  fix: 1_200_000,
  standardEngagementCap: 2_500_000,
} as const;

export type JourneyStep = {
  id: "business-check" | "discovery-call" | "current-state" | "fix" | "plan";
  name: string;
  /** Site copy for the step (section 16, "How it works"). */
  body: string;
};

export const REFERRAL_RULE = "Refer another business owner and take 10% off your next invoice for each referral who pays, up to 30%. It never applies to a first payment.";

export function formatNaira(amount: number) {
  return `₦${String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

/** The whole journey, shown up front with prices (D1). */
export const JOURNEY: readonly JourneyStep[] = [
  { id: "business-check", name: "Free business check", body: `Ten minutes. You get a first read on where you are stuck. Want the full report? ${formatNaira(PRICES.fullReport)}, by email.` },
  { id: "discovery-call", name: "A free 20-minute call", body: "We tell you honestly whether we can help." },
  { id: "current-state", name: "Current State", body: `Two weeks and two calls to see where your business really stands and name the one problem to fix first. From ${formatNaira(PRICES.currentStateFrom)}, paid after the call. Three working days to get set up, then we start.` },
  { id: "fix", name: "The six-week fix", body: `One problem. You do the work; we tell you what to do, give you the tools and check it every week. ${formatNaira(PRICES.fix)}.` },
  { id: "plan", name: "Your plan", body: `We stop at about ${formatNaira(PRICES.standardEngagementCap)} with a plan in your hands. Want us to stay? We agree what that looks like.` },
];
