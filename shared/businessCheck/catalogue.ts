/**
 * The services the business check can recommend, taken from the Enzo Krypton Business Plan v1.0
 * (14 Aug 2026, section 02: seven capabilities and their offerings, and "When clients need us").
 * Enzo owns the client-facing offering; IP Factory delivers it. The AI summary may only name
 * offerings from this list, so recommendations stay inside what the group actually sells.
 */

export type CapabilityId =
  | "strategy-growth"
  | "transformation"
  | "ai-workflow"
  | "finance-capital"
  | "people-organisation"
  | "institutional-programme"
  | "implementation";

export const CAPABILITIES: Record<CapabilityId, string> = {
  "strategy-growth": "Strategy & Growth",
  transformation: "Transformation",
  "ai-workflow": "AI & Workflow Optimisation",
  "finance-capital": "Finance & Capital",
  "people-organisation": "People & Organisation",
  "institutional-programme": "Institutional & Programme Advisory",
  implementation: "Implementation",
};

export type Offering = {
  id: string;
  capability: CapabilityId;
  name: string;
  /** What we do, in the business owner's terms. */
  summary: string;
  /** Signals from the business plan's "When clients need us" pages; used to ground the AI. */
  signals: readonly string[];
};

export const OFFERINGS: readonly Offering[] = [
  { id: "growth-strategy", capability: "strategy-growth", name: "Corporate & Growth Strategy", summary: "Set where the business is going, what to prioritise and what to stop.", signals: ["priorities unclear or competing", "growth slowed or inconsistent", "several opportunities compete for limited money", "plan exists but daily action has drifted from it"] },
  { id: "business-model", capability: "strategy-growth", name: "Business Model & Commercial Strategy", summary: "Fix who you serve, what you sell, how you price it and how the business makes money.", signals: ["a good product is not producing enough results", "revenue depends on one product, customer or channel", "pricing set without clear commercial logic", "needs more predictable revenue"] },
  { id: "market-entry", capability: "strategy-growth", name: "Market Entry & Expansion", summary: "Build the route to market for a new product, location or customer group.", signals: ["new segment, location or product under consideration", "a new offer needs a route to market", "local market knowledge is limited"] },
  { id: "feasibility", capability: "strategy-growth", name: "Feasibility & Opportunity Assessment", summary: "Test whether an idea or opportunity is worth pursuing before money is committed.", signals: ["idea not yet tested", "significant money may be committed before the opportunity is understood"] },
  { id: "research", capability: "strategy-growth", name: "Research & Strategic Intelligence", summary: "Find out who really buys, why, and who else is competing for them.", signals: ["unclear who the best customers are", "little knowledge of competitors", "market is changing"] },
  { id: "business-transformation", capability: "transformation", name: "Business Transformation", summary: "Coordinate change across several connected problems at once.", signals: ["performance has declined across several areas", "revenue, cost, service and people problems appear connected", "previous improvement efforts did not last"] },
  { id: "operating-model", capability: "transformation", name: "Operating Model Transformation", summary: "Redesign roles, decisions and processes so the business runs without everything going through you.", signals: ["roles and accountability unclear", "decisions slow or concentrated in one person", "processes and handoffs create delays", "growing faster than systems"] },
  { id: "commercial-performance", capability: "transformation", name: "Commercial & Operational Performance", summary: "Find where revenue or margin is being lost and fix it in targeted steps.", signals: ["revenue below potential", "costs rising without value", "capacity or assets underused", "service standards vary", "no reliable performance information"] },
  { id: "workflow", capability: "ai-workflow", name: "Workflow Optimisation", summary: "Remove waste, double handling and delays from the way work moves.", signals: ["routine work takes too long", "same information entered several times", "work depends on particular individuals", "too much done by hand or on paper"] },
  { id: "automation", capability: "ai-workflow", name: "AI & Automation Enablement", summary: "Use systems, automation and AI where they genuinely save time and errors.", signals: ["repetitive manual work", "volume rising faster than capacity", "information re-typed across systems"] },
  { id: "financial-performance", capability: "finance-capital", name: "Financial Performance & Decision Support", summary: "Know your margins, unit costs and cash, and use them to decide.", signals: ["cash always tight", "prices are guesses", "true cost per product unknown", "records kept but not used for decisions", "customers pay late", "personal and business money mixed"] },
  { id: "funding", capability: "finance-capital", name: "Funding & Capital Advisory", summary: "Get the business ready for a loan or investment, and find the right money.", signals: ["needs funding to grow", "not ready for lenders or investors"] },
  { id: "transactions", capability: "finance-capital", name: "Investment & Transaction Support", summary: "Prepare for a sale, investment or partnership, and understand what the business is worth.", signals: ["buyer, investor or successor interested", "value of the business unknown", "no records an investor could trust"] },
  { id: "org-design", capability: "people-organisation", name: "Organisation Design & Governance", summary: "Set up roles, decision rights, controls and succession so the business does not depend on one person.", signals: ["key responsibilities depend on the founder", "decision rights unclear", "preparing for growth, succession or institutionalisation", "regulatory and tax controls weak"] },
  { id: "workforce", capability: "people-organisation", name: "Workforce Strategy & Capability", summary: "Find, build and keep the people and skills the business needs.", signals: ["cannot find or keep good staff", "growth needs skills the business does not have", "hiring without a plan"] },
  { id: "performance-culture", capability: "people-organisation", name: "Performance, Culture & Change", summary: "Make expectations, accountability and follow-through part of how the team works.", signals: ["staff lack clear expectations", "accountability weak", "changes do not stick"] },
  { id: "implementation", capability: "implementation", name: "Implementation Management", summary: "Turn an agreed plan into results, step by step, with someone checking it gets done.", signals: ["plan agreed but nobody owns delivery", "milestones slipping", "knows what to do but it does not get done"] },
  { id: "embedded-support", capability: "implementation", name: "Embedded Performance Support", summary: "Ongoing support across several priorities when the business lacks the capacity to drive them alone.", signals: ["several connected priorities", "needs recurring support rather than a one-off project", "actions not sustained between meetings"] },
];

export const OFFERING_IDS = OFFERINGS.map((offering) => offering.id);

export function offeringById(id: string) {
  return OFFERINGS.find((offering) => offering.id === id);
}
