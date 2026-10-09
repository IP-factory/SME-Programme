/**
 * The written content of the full report, keyed by the business check's answer values. The report builder
 * (build.ts) only chooses and orders these pieces; it never writes free text, so the same answers always give the
 * same report. Every status and follow-up option in shared/businessCheck/questions.ts has an entry here, which
 * test/shared/fullReport/content.test.ts enforces.
 *
 * Voice: second person, short sentences, British English, the consulting term kept and explained.
 */

/** How the owner's answer to an area's main question reads in the report. */
export type StatusReading = {
  /** The page's one-sentence finding. */
  finding: string;
  /** What it means for the business. */
  meaning: string;
};

/** How the owner's answer to an area's follow-up question reads, and what to do about it. */
export type DetailReading = {
  meaning: string;
  /** The first move, for the 90-day plan. */
  move: string;
  /** A step the owner can take this week. */
  thisWeek: string;
};

export type AreaContent = {
  /** What good looks like in this area. */
  good: string;
  /** The one number to watch, in the owner's terms. */
  watch: string;
  status: Record<string, StatusReading>;
  detail: Record<string, DetailReading>;
};

/** Areas 1 to 10 of the business check. Founder readiness (0) and the idea questions are read separately below. */
export const AREA_CONTENT: Record<number, AreaContent> = {
  1: {
    good: "You can say in two sentences where the business will be in three years. You have three priorities for this year, and most of your week goes on them.",
    watch: "Hours a week spent on your three priorities",
    status: {
      clear: { finding: "You know where the business is going, and your week reflects it.", meaning: "Direction is in place. The work now is to keep it written down and checked, so growth does not pull you off course." },
      busy: { finding: "You are busy every day without a clear destination, so effort spreads thin.", meaning: "Without an agreed destination, every request feels urgent and the business drifts towards whatever shouts loudest. The business has motion but no direction." },
      choices: { finding: "Several good ideas are competing for the same money and time, so none gets enough of either.", meaning: "Choosing is the work of strategy. Until one idea is chosen and the others are parked, each moves slowly and none proves itself." },
      how: { finding: "You know where you want to go, but not yet the route to get there.", meaning: "The destination is the hard part, and you have it. What is missing is the plan: the few steps, in order, that turn the goal into this month's work." },
      means: { finding: "You know the way, but the money or people to travel it are missing.", meaning: "This is a resources gap, not a direction gap. Sequence the plan so early steps pay for later ones, and find the cheapest way to add capacity." },
      go_fulltime: { finding: "The decision in front of you is whether to leave your job for the business.", meaning: "That decision should rest on evidence: what the business earns now, how long your savings last, and what it would take to replace your salary." },
    },
    detail: {
      yes_everything: { meaning: "Saying yes to every opportunity means nothing has been ruled out. Each yes takes time from the work that would grow the business.", move: "Write down what the business will not do this year, and turn down the next request that falls outside it.", thisWeek: "List the last ten jobs or orders you took and mark the ones you would refuse next time." },
      partners_differ: { meaning: "When partners or family want different things, decisions stall and staff get mixed messages.", move: "Agree one written goal for the year with your partners, and who decides what.", thisWeek: "Book two hours with your partners to answer one question: where must the business be in 12 months?" },
      no_goals: { meaning: "Without written goals or numbers, you cannot tell a good month from a bad one, or whether the business is moving.", move: "Set three goals for the year, each with a number, and review them every month.", thisWeek: "Write down this year's sales target and the two other numbers that matter most." },
      firefighting: { meaning: "A plan that loses to daily firefighting has no protected time. The urgent will beat the important unless time is set aside.", move: "Protect two hours a week for work on the business, and use them for the plan's first step.", thisWeek: "Block two hours in your diary this week for the plan, and keep the appointment." },
    },
  },
  2: {
    good: "You can describe your best customers, what they pay and why they choose you, and name the two or three competitors they compare you with.",
    watch: "Share of sales from your target customer group",
    status: {
      clear: { finding: "You know who buys, why they buy and who you are up against.", meaning: "This market knowledge is an asset. Keep it current: customers and competitors move, especially when prices rise." },
      customers_only: { finding: "You know your customers, but not the competitors and market around them.", meaning: "Knowing customers without knowing competitors leaves you blind on price and position. You cannot tell whether you win on value or only on price." },
      anyone: { finding: "You sell to whoever comes, so your effort is not aimed at the customers worth most.", meaning: "Every business has a group of customers who buy more, pay faster and cost less to serve. Until you can name them, marketing and stock are spread across everyone." },
      shifting: { finding: "Your market is changing and the business has not yet chosen where to focus.", meaning: "When demand moves, the businesses that act early keep their customers. Waiting for certainty usually means following competitors who moved first." },
    },
    detail: {
      profitable: { meaning: "Some customers make you money and some cost you money. The difference is rarely visible without looking at margin and time by customer.", move: "Rank your customers by what they bring in and what they cost to serve, and aim your selling at the top group.", thisWeek: "List your top 20 customers and mark the ones who pay on time and buy at full price." },
      competitors: { meaning: "Without knowing competitors' prices and offers, your price is a guess and your pitch cannot say why you are better.", move: "Map your three closest competitors: what they sell, at what price, and what customers say about them.", thisWeek: "Visit, call or browse three competitors as a customer would, and note their prices." },
      new_segment: { meaning: "Growing into a new customer group or location is a bet. It pays when you can describe the new customers as well as your current ones.", move: "Choose one new customer group or location and test it with a small offer before committing stock or staff.", thisWeek: "Write one paragraph on the new customers: who they are, where they are and why they would buy from you." },
      demand: { meaning: "If demand is shrinking or moving, the earlier you see it, the more choices you have.", move: "Track enquiries and sales by product every month, so you can see where demand is moving.", thisWeek: "Compare this month's sales of your top product with the same month last year." },
    },
  },
  3: {
    good: "Customers understand what you sell, why it is better for them and what it costs. Your range is focused on what sells.",
    watch: "Average sale value, and how many enquiries become sales",
    status: {
      clear: { finding: "Customers understand what you sell and buy it readily.", meaning: "A clear offer is the foundation of steady sales. Hold any new product to the same standard of clarity." },
      like_not_buy: { finding: "People like what you do, but not enough of them buy it.", meaning: "Liking is not buying. When interest does not turn into sales, the offer usually lacks a clear promise, a reason to buy now, or a price that matches the value people see." },
      too_many: { finding: "You sell too many things, and the range is diluting your effort and your cash.", meaning: "A wide range ties up stock and attention. Most businesses earn most of their profit from a small part of what they sell." },
      package: { finding: "You know what should change in your offer, but not how to package or price it.", meaning: "Packaging and pricing turn a good product into a clear choice for the customer. It is a skill, and one you can learn." },
      develop: { finding: "You need new products, but cannot yet afford to develop them.", meaning: "New products do not always need big money. The cheapest test is to sell a simple version to a few customers before building the full thing." },
    },
    detail: {
      range: { meaning: "Too many products or services spread your stock, your marketing and your time.", move: "Keep the products that make most of your profit, and stop or reprice the rest.", thisWeek: "List everything you sell and mark the items that brought in most of last month's sales." },
      why_us: { meaning: "If customers cannot see why you are better, they compare on price, and the cheapest seller wins.", move: "Write one sentence that says why a customer should choose you, and use it everywhere you sell.", thisWeek: "Ask five good customers why they buy from you, and write down their exact words." },
      price_value: { meaning: "When price does not match value, customers walk away or you leave money on the table.", move: "Reset the price of your top product against its cost and what competitors charge.", thisWeek: "Work out what your top product costs you to deliver, including your own time." },
      new: { meaning: "A new product is worth building only when you know who will buy it and at what price.", move: "Describe the new product, its customer and its price on one page, and pre-sell it to five customers.", thisWeek: "Ask three existing customers whether they would buy the new product, and at what price." },
    },
  },
  4: {
    good: "You know which products and customers make money. Your margins cover your costs with room to spare, and no single customer can sink you.",
    watch: "Gross margin, product by product",
    status: {
      clear: { finding: "You know which products make money, and your margins are healthy.", meaning: "Healthy margins give you room to invest and to survive a bad month. Check them every quarter as costs rise." },
      no_money: { finding: "Money comes in, but the business still does not make money.", meaning: "Revenue that does not turn into profit means the business model leaks: prices are too low, costs too high, or some products and customers lose money." },
      suspect: { finding: "You suspect some products lose money, but cannot yet prove which.", meaning: "The suspicion is usually right. Until margin is worked out product by product, the losing lines keep eating the profit of the good ones." },
      stopped: { finding: "The way the business used to make money has stopped working.", meaning: "When a business model stops working, trying harder at the old way rarely fixes it. The business needs to decide what it now sells, to whom, and how it earns." },
    },
    detail: {
      price_feel: { meaning: "Prices set by feel or by copying competitors ignore your own costs. You can be busy and still lose money.", move: "Work out the cost of each product and set prices from cost plus the margin you need.", thisWeek: "Take your best-selling product and add up every cost that goes into one unit." },
      concentration: { meaning: "When one or two customers make up most of your revenue, they control your prices and your survival.", move: "Set a limit on the share of sales from your biggest customer, and win new customers to bring it down.", thisWeek: "Work out what share of last month's sales came from your biggest customer." },
      costs_up: { meaning: "When costs rise faster than prices, the margin shrinks a little every month without anyone deciding it.", move: "Review prices against current costs, and pass increases on to customers with a clear explanation.", thisWeek: "List your five biggest costs and compare each with what it was a year ago." },
      what_business: { meaning: "Not being sure what business you are really in is a sign the business model has drifted. It needs a decision, not more effort.", move: "Decide in one sentence what the business sells, to whom and how it makes money, and drop what does not fit.", thisWeek: "Write down where last year's profit really came from, product by product." },
    },
  },
  5: {
    good: "New customers arrive steadily from two or three channels you understand, and you know where each one came from.",
    watch: "New customers a month, by channel",
    status: {
      clear: { finding: "New customers arrive steadily, and you know where each one comes from.", meaning: "A steady, understood flow of customers makes growth plannable. Keep recording where every sale came from." },
      inconsistent: { finding: "Customers do not arrive consistently, so sales rise and fall without warning.", meaning: "Inconsistent sales usually mean there is no system: no regular activity that brings in enquiries, and no follow-up that turns them into sales." },
      word_of_mouth: { finding: "Word of mouth works, but there is nothing more reliable behind it.", meaning: "Word of mouth proves customers value you. Its weakness is that you cannot turn it up when you need more sales." },
      no_capacity: { finding: "You know what would bring in customers, but lack the people or budget to do it.", meaning: "Knowing what works is half the battle. Start with the cheapest channel that works and let it pay for the next." },
      launch: { finding: "You are launching something new without a clear route to market.", meaning: "A launch without a route to market depends on luck. Decide who the first customers are, how they will hear about it and what you want them to do." },
    },
    detail: {
      awareness: { meaning: "If not enough people hear about you, the problem sits at the top of the sales funnel.", move: "Choose the one channel where your best customers already are, and show up there every week.", thisWeek: "Reach 20 potential customers in the channel your best customers use." },
      conversion: { meaning: "People enquire but do not buy, so the interest is there. The gap is in the offer, the price or the follow-up.", move: "Follow up every enquiry within a day, and record why the people who do not buy say no.", thisWeek: "Call back the last ten people who enquired and did not buy, and ask why." },
      repeat: { meaning: "When customers buy once and never return, you pay to win every sale again.", move: "Give every customer a reason and a reminder to come back.", thisWeek: "Message your last 20 customers with a thank-you and an offer for their next purchase." },
      founder_sells: { meaning: "When sales depend on you personally, the business cannot grow beyond your hours.", move: "Write down how you sell, step by step, and train one person to sell alongside you.", thisWeek: "Write down the five questions you always ask a new customer, and the answers you give." },
    },
  },
  6: {
    good: "The business runs for a week without you. Roles are clear, the main processes are written down and the same mistakes do not repeat.",
    watch: "Hours a week the business runs without you",
    status: {
      clear: { finding: "The business runs well even when you are not there.", meaning: "A business that runs without you is worth more and frees you to work on growth. Keep processes written and roles clear as you add people." },
      only_me: { finding: "Nothing moves unless you are there, so the business is capped at your hours.", meaning: "When everything runs through the owner, the business cannot grow and a week off costs you sales. This is the most common ceiling for a growing business." },
      staff: { finding: "Finding and keeping good staff is holding the business back.", meaning: "Staff problems are often role problems. Unclear jobs, no training and no standard way of working make good people leave." },
      no_process: { finding: "You have staff, but no clear processes or roles, so the work depends on memory.", meaning: "Without written processes, quality depends on who is on duty, and every new hire learns by trial and error." },
      outgrown: { finding: "The business is growing faster than its systems can handle.", meaning: "Growth that outruns systems shows up as errors, delays and unhappy customers. It is a good problem, but it costs money every week it lasts." },
    },
    detail: {
      hiring: { meaning: "Hiring and keeping the right people starts with knowing exactly what each role must do.", move: "Write a one-page description of each role: what it does, how success is measured and who it reports to.", thisWeek: "Write the role description for the job you most need to fill." },
      decisions: { meaning: "When staff wait for you to decide everything, you become the bottleneck.", move: "Decide which decisions staff can make alone, up to what amount, and tell them.", thisWeek: "List the decisions you made last week that someone else could have made." },
      repeat_errors: { meaning: "The same mistakes repeating is a sign of missing processes, not careless people.", move: "Write down, step by step, the three processes where mistakes happen most, and check they are followed.", thisWeek: "Take last month's most frequent mistake and write the steps that would have prevented it." },
      manual: { meaning: "Work done by hand or on paper is slow, hard to check and easy to lose.", move: "Move one paper process, such as orders or stock, to a simple digital tool.", thisWeek: "List the tasks still done on paper and pick the one that costs the most time." },
    },
  },
  7: {
    good: "You know your margin on every product and your cash for the next 13 weeks, and you decide with numbers rather than feel.",
    watch: "Weeks of costs covered by cash in the bank",
    status: {
      clear: { finding: "You know your numbers and use them to decide.", meaning: "Knowing your margins, your cash and what is coming in puts you ahead of most owners. Keep the routine weekly." },
      tight_guess: { finding: "Cash is always tight and prices are guesses, so the business runs without a dashboard.", meaning: "Tight cash and guessed prices usually go together: prices that do not cover costs drain cash month after month." },
      records_unused: { finding: "You keep records, but they do not yet guide your decisions.", meaning: "The numbers you need to decide with are already in your records. They need to be read every week." },
      funding: { finding: "The business needs funding to grow, but is not yet ready to ask for it.", meaning: "Lenders and investors look for clean records, a clear plan and proof that the business makes money. Getting ready takes months, so start before you need the money." },
    },
    detail: {
      late_payers: { meaning: "Late payers turn sales into debts, and debts do not pay salaries.", move: "Set payment terms in writing, invoice on the day and chase every overdue payment weekly.", thisWeek: "List everyone who owes you money, how much and for how long, and call the three largest." },
      unit_cost: { meaning: "Without your true cost per product, you cannot know whether a sale makes or loses money.", move: "Work out the full cost of each main product: materials, labour and a share of overheads.", thisWeek: "Add up what it cost to make or deliver your best seller last month, and divide by the units sold." },
      mixed_money: { meaning: "Mixing personal and business money hides the true profit and makes borrowing harder.", move: "Run all business money through a separate account and pay yourself a fixed monthly amount.", thisWeek: "Open a business account, or move all business receipts into the one you have." },
      loan: { meaning: "A loan or investment helps only when you know exactly what it will pay for and how it will be repaid.", move: "Write down how much you need, what it will pay for and how the business will repay it.", thisWeek: "Put the last six months of bank statements and sales records in one folder." },
    },
  },
  8: {
    good: "Registrations and taxes are up to date, you know your top risks, and each has a control or cover in place.",
    watch: "Top risks with a control in place",
    status: {
      clear: { finding: "Taxes, registrations and key risks are under control.", meaning: "A business with its risks under control is easier to grow, insure and fund. Review the list once a year." },
      fragile: { finding: "One tax visit, one resignation or one bad month could end the business.", meaning: "A business this exposed can be stopped by a single event. The first job is to list the risks that could do it and put a basic control on each." },
      where_start: { finding: "You know the business is exposed, but not where to start.", meaning: "Start with the risks that would hurt most and are most likely. A short list with one control each beats a long list with none." },
      cant_afford: { finding: "You know what protection is needed, but cannot afford it yet.", meaning: "Some protection costs little: written contracts, backups and separate money. Start there, and budget for the rest." },
    },
    detail: {
      tax: { meaning: "Tax and regulatory paperwork left too long becomes penalties, and sometimes closure.", move: "List every registration and tax the business must file, with due dates, and clear the overdue ones.", thisWeek: "Check your CAC status and tax identification number, and note what is overdue." },
      key_person: { meaning: "Losing a key person can stop the business when what they know is only in their head.", move: "Write down what each key person knows and does, and train a second person on the most important parts.", thisWeek: "Ask your key person to write down the steps of the one task only they can do." },
      insurance: { meaning: "Without insurance or backup, one fire, theft or flood can wipe out stock and equipment.", move: "Get quotes to insure stock and equipment, and keep a copy of your records off-site.", thisWeek: "List your stock and equipment with what each would cost to replace." },
      contracts: { meaning: "Without written contracts, disputes over payment, quality or delivery are settled by whoever is stronger.", move: "Use a simple written agreement with every major customer and supplier.", thisWeek: "Write down on one page the terms you agreed verbally with your biggest customer." },
    },
  },
  9: {
    good: "You know roughly what the business is worth, what drives that value and what would raise it.",
    watch: "Value drivers: clean records, steady profit, less dependence on you",
    status: {
      clear: { finding: "You know roughly what the business is worth and what drives that value.", meaning: "Knowing your value drivers lets you build them on purpose, whether you plan to sell, raise money or pass the business on." },
      never: { finding: "You have not yet thought about what the business is worth.", meaning: "A business's value comes from steady profit, clean records and not depending on its owner. Working on these makes the business stronger now, sale or no sale." },
      prepare: { finding: "You would like to raise money or sell one day, but do not know how to prepare.", meaning: "Preparation takes one to three years: clean records, a business that runs without you and a clear story of growth." },
      decide_soon: { finding: "An investor, buyer or successor is interested, and a decision is close.", meaning: "A decision under time pressure needs a valuation, clear terms and independent advice. Do not let the other side set the price alone." },
    },
    detail: {},
  },
  10: {
    good: "A handover plan is in place: who leads next, how they are prepared and what your role becomes.",
    watch: "Responsibilities handed over",
    status: {
      clear: { finding: "A succession or handover plan is in place.", meaning: "A plan protects the business and the people in it. Review it every year." },
      who_am_i: { finding: "You have not yet worked out who you are after this business.", meaning: "Owners who step back without a new role often step back in, which confuses the team. Deciding your next role is part of the handover." },
      how_handover: { finding: "You want to step back, but do not know how to hand over.", meaning: "A good handover is gradual: responsibilities move one at a time, with you available but no longer in charge." },
      no_successor: { finding: "No one is ready to take over.", meaning: "Without a successor, the business's future depends on you staying. Finding and developing one takes years, so start now." },
    },
    detail: {},
  },
};

/** Moves for the areas without a follow-up question, and for intake-only readings. */
export const AREA_DEFAULT_MOVE: Record<number, { move: string; thisWeek: string }> = {
  9: { move: "Keep three years of clean accounts and reduce how much the business depends on you.", thisWeek: "Gather the last three years of sales and profit figures in one place." },
  10: { move: "Name a possible successor and list the first three responsibilities to hand over.", thisWeek: "Write down what you do each week that someone else could learn." },
};

/** The idea-stage questions (owners who have not started), read option by option. */
export const IDEA_READINGS: Record<string, Record<string, string>> = {
  i_customer: {
    named: "You can name your first customers, which is the strongest start an idea can have.",
    rough: "A rough idea of the first customer is a starting point, not yet a plan. Name ten real people or businesses.",
    unclear: "Without knowing who will buy first, the idea cannot yet be tested.",
  },
  i_offer: {
    defined: "A specific product with a price lets customers say yes or no, which is what you need to learn.",
    several: "Several options split your effort. Choose the one most likely to sell first.",
    unsure: "The first offer is still forming. Make it specific enough to put a price on.",
  },
  i_tested: {
    paid: "Customers have already paid: the strongest evidence an idea can have.",
    talked: "Conversations are encouraging, but only payment proves demand.",
    no: "The idea has not met real buyers yet. That test comes before any big spend.",
  },
  i_need: {
    have: "You have what you need to start.",
    money: "Money is the main gap. A smaller first version may need less of it.",
    skills: "Skills are the main gap. Learn the one that matters most for the first sale.",
    people: "The right partner or people are the main gap. Define the role before you look.",
  },
};

export const IDEA_CONTENT = {
  good: "You can name your first ten customers, you have one offer with a price, and at least some of them have paid.",
  watch: "Paying customers before money is committed",
  move: "Test the idea with a small, paid first version before committing more money.",
  thisWeek: "Offer the first version to five of the customers you named, at your price.",
};
