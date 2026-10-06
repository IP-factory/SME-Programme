import { Button } from "@/components/ui/button";
import DiagnosticRegistrationDialog from "@/components/DiagnosticRegistrationDialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ArrowRight, CheckCircle2, KeyRound, MailCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { BRAND } from "@shared/brand";
import { DOORS, ENGAGEMENT_LOOP, formatNaira, JOINING_STEPS, PRICE_LADDER, REFERRAL_RULE, SERVICE_TIERS, SPRINT_WEEKS } from "@shared/businessSupport";

export default function Home() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isParticipantSignInOpen, setIsParticipantSignInOpen] = useState(false);
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInError, setSignInError] = useState("");
  const [passwordLinkSent, setPasswordLinkSent] = useState(false);
  const [isPasswordHelpMode, setIsPasswordHelpMode] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("participant_signin") === "1") {
      setIsParticipantSignInOpen(true);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const requestPortalLinkMutation = trpc.registration.requestPortalLink.useMutation({
    onSuccess: () => {
      setPasswordLinkSent(true);
      setSignInError("");
    },
    onError: (err) => {
      setSignInError(err.message || "No registration found for this email address.");
    },
  });

  const participantSignInMutation = trpc.participant.signIn.useMutation({
    onSuccess: () => {
      window.location.assign("/portal");
    },
    onError: (err) => {
      setSignInError(err.message || "We could not sign you in. Please check your details and try again.");
    },
  });

  const handleParticipantSignIn = () => {
    if (!signInEmail || !signInEmail.includes("@") || !signInPassword) {
      setSignInError("Enter your registered email address and password.");
      return;
    }
    setSignInError("");
    participantSignInMutation.mutate({ email: signInEmail, password: signInPassword });
  };

  const handlePasswordLinkRequest = () => {
    if (!signInEmail || !signInEmail.includes("@")) {
      setSignInError("Enter the email address you used to register.");
      return;
    }
    setSignInError("");
    setPasswordLinkSent(false);
    requestPortalLinkMutation.mutate({ email: signInEmail });
  };

  const [selectedPackage, setSelectedPackage] = useState<"Foundation" | "Engine Room" | "Boardroom">("Foundation");



  const handleOpenRegister = (pkg: "Foundation" | "Engine Room" | "Boardroom") => {
    setSelectedPackage(pkg);
    setIsRegisterOpen(true);
  };

  /** Apply goes to the external booking form when one is configured, otherwise to the on-site form. */
  const handleApply = () => {
    if (BRAND.applyUrl) {
      window.open(BRAND.applyUrl, "_blank", "noopener,noreferrer");
      return;
    }
    handleOpenRegister("Foundation");
  };


  return (
    <div className="min-h-screen bg-paper text-ink font-sans flex flex-col selection:bg-brand selection:text-paper">
      {/* Top Header */}
      <header className="border-b border-line bg-paper/90 backdrop-blur sticky top-0 z-50">
        <div className="container flex items-center justify-between h-20">
          <a href="#top" className="flex items-center gap-3" aria-label={`${BRAND.organisationName} ${BRAND.productName}`}>
            <img src={BRAND.markUrl} alt={BRAND.organisationName} className="h-9 w-auto shrink-0 sm:hidden" />
            <img src={BRAND.logoUrl} alt={BRAND.organisationName} className="hidden h-10 w-auto shrink-0 sm:block" />
            <span className="hidden lg:inline-block border-l border-line pl-3 text-xs font-semibold uppercase tracking-widest text-ink-muted">{BRAND.productName}</span>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-ink-600">
            <a href="#how" className="hover:text-brand transition-colors">How it works</a>
            <a href="#doors" className="hover:text-brand transition-colors">The ten doors</a>
            <a href="#pricing" className="hover:text-brand transition-colors">Pricing</a>
            <a href="#questions" className="hover:text-brand transition-colors">Questions</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setIsParticipantSignInOpen(true); setIsPasswordHelpMode(false); setPasswordLinkSent(false); setSignInError(""); }}
              className="rounded-none border-brand-line text-brand hover:bg-brand-tint text-xs uppercase tracking-wider font-semibold"
            >
              Client sign in
            </Button>
            <Button onClick={handleApply} className="bg-ink text-paper hover:bg-charcoal font-medium text-xs uppercase tracking-widest px-5 py-2.5 rounded-none">
              Apply
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative pt-20 pb-20 md:pt-28 md:pb-28 border-b border-line">
        <div className="container max-w-5xl mx-auto text-center px-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-line bg-brand-tint text-brand text-xs font-semibold uppercase tracking-widest mb-8">
            {BRAND.productTagline} · {BRAND.organisationName}
          </div>
          <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-[1.05] text-ink mb-8">
            Bring us the problem.
          </h1>
          <p className="font-serif italic text-xl sm:text-2xl text-ink-soft max-w-3xl mx-auto mb-6 leading-relaxed">
            We work it with you, week by week, until your business shows the difference.
          </p>
          <p className="text-ink-soft max-w-2xl mx-auto mb-12 leading-relaxed">
            A paid diagnostic names the real problem. A six-to-eight-week sprint fixes it, with a weekly check-in and one agreed measure we track until it moves. You stay in the driver&apos;s seat.
          </p>
          <div className="grid w-full max-w-xl grid-cols-1 gap-4 sm:grid-cols-2 mx-auto">
            <Button onClick={handleApply} className="w-full h-14 bg-ink text-paper hover:bg-charcoal text-sm uppercase tracking-widest px-5 rounded-none font-semibold shadow-lg">
              Apply <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <a href="#how" className="w-full h-14 inline-flex items-center justify-center px-5 border border-brand text-brand text-sm uppercase tracking-widest font-semibold hover:bg-brand-tint transition-colors">
              See how it works
            </a>
          </div>
          <p className="mt-4 text-xs text-ink-muted">The form takes about ten minutes. A short call then confirms whether we can help, before you pay anything.</p>
          <div className="mt-16 pt-12 border-t border-line grid grid-cols-2 md:grid-cols-4 gap-8 text-left">
            <div>
              <p className="text-xs uppercase tracking-widest text-highlight-ink font-semibold mb-1">The test</p>
              <p className="font-serif font-bold text-lg leading-snug">Did the agreed measure move?</p>
              <p className="text-xs text-ink-soft mt-1">If not, we have not finished.</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-highlight-ink font-semibold mb-1">Focus</p>
              <p className="font-serif font-bold text-lg leading-snug">One problem at a time</p>
              <p className="text-xs text-ink-soft mt-1">One door and one measure, agreed in week one.</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-highlight-ink font-semibold mb-1">Rhythm</p>
              <p className="font-serif font-bold text-lg leading-snug">A weekly check-in</p>
              <p className="text-xs text-ink-soft mt-1">45 minutes, every week of the sprint.</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-highlight-ink font-semibold mb-1">Ownership</p>
              <p className="font-serif font-bold text-lg leading-snug">You implement</p>
              <p className="text-xs text-ink-soft mt-1">We prescribe, equip, review and track.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The problem */}
      <section id="problem" className="py-24 border-b border-line">
        <div className="container max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
            <div className="md:col-span-6">
              <span className="text-xs uppercase tracking-widest text-ink-muted font-semibold block mb-3">The problem we solve</span>
              <h2 className="font-serif text-4xl font-bold tracking-tight mb-6">
                Owners don&apos;t fail for lack of information. They fail between knowing and doing.
              </h2>
              <p className="text-ink-soft leading-relaxed mb-4">
                Courses leave owners informed and still stuck. What is missing is a method, the right tools, someone to check the work, and the discipline of a weekly review.
              </p>
              <p className="text-ink-soft leading-relaxed">
                That gap is where we work. We get into the business with you, name the problem, prescribe the fix from experience, hand over the tools, and stay until the result shows.
              </p>
            </div>
            <div className="md:col-span-6">
              <p className="text-xs uppercase tracking-widest text-ink-muted font-semibold mb-4">What owners told us, in their words</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {["I'm busy but not making money.", "How do I get more clients?", "Nothing moves unless I'm there.", "How do I build a team without payroll overtaking revenue?"].map((quote) => (
                  <div key={quote} className="p-6 bg-paper-sunken border border-line">
                    <p className="font-serif italic text-ink-750 leading-snug">&ldquo;{quote}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who it is for */}
      <section id="fit" className="py-24 border-b border-line bg-paper-sunken/50">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <span className="text-xs uppercase tracking-widest text-ink-muted font-semibold block mb-3">Who it is for</span>
              <h2 className="font-serif text-4xl font-bold tracking-tight mb-6">Owners whose business already trades, and who can name what the problem is costing them.</h2>
              <ul className="space-y-3 text-ink-600">
                {[
                  "Trading for two years or more",
                  "Turning over about ₦5m a month (₦60m a year) or more",
                  "Typically 5 to 50 staff, some on contract",
                  "The owner decides, and pays from business cash before work starts",
                  "A problem one of our ten doors covers",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-highlight-ink" />{item}</li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-ink-soft">The discovery call decides. If we cannot help, we say so before you pay.</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-muted font-semibold mb-4">Not the right fit yet</p>
              <div className="space-y-4">
                {[
                  { title: "Founders who have not started yet", body: "Door 0, founder readiness, is offered on its own: a diagnostic and a personal plan, without a sprint." },
                  { title: "Businesses below about ₦5m a month", body: "The price would take too much of a month's revenue. A lower-cost, self-serve route is being built." },
                  { title: "Raising investment", body: `Fundraising beyond the business's current scale is handled by ${BRAND.organisationName}'s Finance and Capital practice.` },
                ].map((card) => (
                  <div key={card.title} className="p-6 bg-paper border border-line">
                    <h3 className="font-serif font-bold text-lg mb-1">{card.title}</h3>
                    <p className="text-sm text-ink-soft">{card.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The ten doors */}
      <section id="doors" className="py-24 border-b border-line">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase tracking-widest text-ink-muted font-semibold block mb-3">The catalogue</span>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight mb-4">Ten places a business gets stuck.</h2>
            <p className="text-ink-soft">
              Every business we have worked with gets stuck at one of these doors, somewhere between founder readiness and exit. Start at whichever one is costing you money now; the diagnostic confirms where.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DOORS.map((door) => (
              <article key={door.number} className="flex flex-col bg-paper-raised border border-line p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-brand text-paper font-mono text-sm font-semibold">{door.number}</span>
                  <h3 className="font-serif font-bold text-xl leading-tight">{door.name}</h3>
                </div>
                <p className="font-serif italic text-ink-750 leading-snug mb-4">&ldquo;{door.ownerWords}&rdquo;</p>
                <p className="text-sm text-ink-soft mb-4">{door.together}</p>
                <p className="mt-auto border-t border-line pt-3 text-xs text-ink-muted"><span className="font-semibold uppercase tracking-wider text-highlight-ink">Measure</span> · {door.measure}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-ink-muted">Doors 1 to 9 run as a diagnostic, then one sprint per door. Door 0 is a diagnostic and personal plan; door 10 is worked through partner sessions.</p>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 border-b border-line bg-paper-sunken/50">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase tracking-widest text-ink-muted font-semibold block mb-3">How it works</span>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight mb-4">We stay until the measure moves.</h2>
            <p className="text-ink-soft">Each problem runs through the same six steps. You do the work in your business; we prescribe, equip, review and keep score.</p>
          </div>

          <ol className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
            {ENGAGEMENT_LOOP.map((step, index) => (
              <li key={step.name} className="bg-paper border border-line p-5">
                <span className="font-mono text-xs text-highlight-ink">{String(index + 1).padStart(2, "0")}</span>
                <p className="font-serif font-bold text-lg mt-1">{step.name}</p>
                <p className="text-xs text-ink-soft mt-1">{step.detail}</p>
              </li>
            ))}
          </ol>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <h3 className="font-serif text-2xl font-bold mb-6">Getting started</h3>
              <ol className="space-y-4">
                {JOINING_STEPS.map((step, index) => (
                  <li key={step.name} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-brand text-brand font-mono text-xs font-semibold">{index + 1}</span>
                    <div>
                      <p className="font-semibold text-ink">{step.name}</p>
                      <p className="text-sm text-ink-soft">{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className="font-serif text-2xl font-bold mb-6">Inside a sprint</h3>
              <div className="border border-line bg-paper divide-y divide-line">
                {SPRINT_WEEKS.map((week) => (
                  <div key={week.when} className="grid grid-cols-[110px_1fr] gap-4 p-4">
                    <div>
                      <p className="font-semibold text-sm text-brand">{week.when}</p>
                      <p className="text-[11px] text-ink-muted mt-1">Your time: {week.ownerTime}</p>
                    </div>
                    <p className="text-sm text-ink-soft">{week.what}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            {SERVICE_TIERS.map((tier) => (
              <div key={tier.name} className="bg-paper border border-line p-6">
                <p className="text-xs uppercase tracking-widest text-highlight-ink font-semibold mb-2">{tier.name}</p>
                <p className="text-ink-600 mb-3">{tier.detail}</p>
                <p className="text-xs text-ink-muted">For example: {tier.example}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border border-brand-line bg-brand-tint">
              <p className="font-semibold text-brand-deep mb-2">The rules that keep it honest</p>
              <ul className="space-y-1.5 text-sm text-brand-deep">
                <li>One active door at a time.</li>
                <li>One measure per door, agreed in week 1 and written down.</li>
                <li>If the measure has not moved by week 8, we keep going for up to four weeks at no fee.</li>
                <li>Everything you receive is kept in your private client folder.</li>
              </ul>
            </div>
            <div className="p-6 border border-brand-line bg-brand-tint">
              <p className="font-semibold text-brand-deep mb-2">Open about AI</p>
              <p className="text-sm text-brand-deep">Our analysts use AI to analyse your numbers and prepare first drafts. Every piece of work follows {BRAND.organisationName}&apos;s method and is reviewed by a named consultant before it reaches you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 border-b border-line">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase tracking-widest text-ink-muted font-semibold block mb-3">Pricing</span>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight mb-4">Three steps, each paid before work starts.</h2>
            <p className="text-ink-soft">Most owners begin with a diagnostic, fix one door in a sprint, then continue on a retainer for the next.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {PRICE_LADDER.map((step, index) => (
              <div key={step.id} className={`border p-8 flex flex-col ${step.id === "sprint" ? "border-brand bg-paper-raised shadow-md" : "border-line bg-paper-sunken"}`}>
                <span className="text-xs font-mono uppercase tracking-widest text-ink-muted block mb-2">Step {String(index + 1).padStart(2, "0")}</span>
                <h3 className="font-serif text-3xl font-bold mb-4">{step.name}</h3>
                <p className="mb-6">
                  <span className="text-4xl font-serif font-bold">{formatNaira(step.priceNaira)}</span>
                  {step.priceSuffix && <span className="text-sm text-ink-muted"> {step.priceSuffix}</span>}
                </p>
                <ul className="space-y-2 text-sm text-ink-600 mb-6">
                  {step.buys.map((item) => <li key={item} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-highlight-ink" />{item}</li>)}
                </ul>
                <p className="mt-auto text-xs text-ink-muted border-t border-line pt-4">{step.scope}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <p className="p-5 border border-line bg-paper text-ink-soft"><span className="font-semibold text-ink">Referrals.</span> {REFERRAL_RULE}</p>
            <p className="p-5 border border-line bg-paper text-ink-soft"><span className="font-semibold text-ink">How you pay.</span> There is no checkout on this site. A secure payment link is sent after your discovery call. Hands-on services such as bookkeeping, a funding pack or a hiring process are quoted separately.</p>
          </div>
        </div>
      </section>

      {/* Who you work with */}
      <section id="team" className="py-24 border-b border-line bg-paper-sunken/50">
        <div className="container max-w-6xl mx-auto">
          <div className="max-w-2xl mb-12">
            <span className="text-xs uppercase tracking-widest text-ink-muted font-semibold block mb-3">Who you work with</span>
            <h2 className="font-serif text-4xl font-bold tracking-tight mb-4">A desk, not a lone consultant.</h2>
            <p className="text-ink-soft">{BRAND.organisationName} already does this work for larger clients. This service brings the same method to owner-run businesses, systematised so the right people are on your problem at the right moment.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { role: "Desk lead", body: "Runs every discovery call and diagnostic, and signs off every prescription." },
              { role: "Partners", body: "Join the diagnostic and key reviews for businesses above about ₦10m a month, or when the problem needs them." },
              { role: "Analysts", body: "Prepare each check-in and work through your numbers, with AI, under the desk lead's review." },
              { role: "Experts by door", body: `Specialists from the ${BRAND.organisationName} group join when your door calls for them.` },
            ].map((person) => (
              <div key={person.role} className="bg-paper border border-line p-6">
                <p className="font-serif font-bold text-xl mb-2">{person.role}</p>
                <p className="text-sm text-ink-soft">{person.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Questions */}
      <section id="questions" className="py-24 border-b border-line">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-widest text-ink-muted font-semibold block mb-3">Questions</span>
            <h2 className="font-serif text-4xl font-bold tracking-tight">What owners usually ask</h2>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {[
              { q: "Is this a course?", a: "No. There are no classes and no certificates. We work on one problem inside your business, with you, until an agreed number moves." },
              { q: "How much of my time does it take?", a: "About two to four hours a week during a sprint, including a 45-minute check-in." },
              { q: "What if the measure doesn't move?", a: "If it has not moved by week 8, we keep going for up to four more weeks at no extra fee." },
              { q: "Can I bring more than one problem?", a: "We work on one door at a time so the effort stays focused. A second problem becomes your next sprint or part of a retainer." },
              { q: "Do you use AI?", a: "Yes, and we tell every client up front. Analysts use AI for analysis and first drafts; a named consultant reviews everything you receive." },
              { q: "Is my information confidential?", a: "Yes. Your documents sit in a private folder for your business. We only ever share an anonymised case with your consent." },
              { q: "How do I pay?", a: "By a secure payment link sent after your discovery call. Nothing is paid through this website." },
            ].map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                  {item.q}
                  <span className="text-brand transition-transform group-open:rotate-45 text-xl leading-none" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 text-ink-soft leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Closing call to action */}
      <section className="py-20 bg-brand text-paper">
        <div className="container max-w-4xl mx-auto text-center">
          <img src={BRAND.logoOnDarkUrl} alt={BRAND.organisationName} className="mx-auto mb-8 h-12 w-auto" />
          <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight mb-4">Bring us the problem.</h2>
          <p className="text-on-dark-muted max-w-xl mx-auto mb-8">Ten minutes to apply. A short call to confirm we can help. Then we get to work.</p>
          <Button onClick={handleApply} className="bg-highlight text-brand-deep hover:bg-highlight-hover rounded-none px-10 py-6 text-sm uppercase tracking-widest font-semibold">
            Apply <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Participant Sign In Modal */}
      <Dialog open={isParticipantSignInOpen} onOpenChange={setIsParticipantSignInOpen}>
        <DialogContent className="max-w-md bg-paper border border-line text-ink">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold">Client sign in</DialogTitle>
            <DialogDescription className="text-xs text-ink-soft">Sign in with the email address and password for your {BRAND.productName} client area.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-ink-muted block mb-1 font-semibold">Email address</label>
              <Input
                type="email"
                placeholder="e.g. name@company.com"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                className="bg-white border-line"
                autoComplete="email"
              />
            </div>
            {!isPasswordHelpMode && <div>
              <label className="text-xs uppercase tracking-wider text-ink-muted block mb-1 font-semibold">Password</label>
              <Input type="password" placeholder="Your password" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} className="bg-white border-line" autoComplete="current-password" />
            </div>}
            {signInError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                {signInError}
              </div>
            )}
            {passwordLinkSent ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded space-y-3">
                <p className="text-xs text-green-800 font-medium">
                  If this email belongs to a client account, a secure password link will arrive shortly. It lets you set a first password or reset an existing one, and expires in 20 minutes.
                </p>
                <Button
                  onClick={() => {
                    setIsParticipantSignInOpen(false);
                    setPasswordLinkSent(false);
                    setSignInEmail("");
                    setSignInPassword("");
                  }}
                  className="w-full bg-brand text-white text-xs uppercase tracking-widest py-2 rounded-none"
                >
                  Done
                </Button>
              </div>
            ) : (
              isPasswordHelpMode ? <>
                <p className="border-l-2 border-brand bg-brand-tint px-3 py-2 text-xs leading-5 text-brand">New client? This link lets you set your password. Returning? It lets you reset it.</p>
                <Button onClick={handlePasswordLinkRequest} disabled={requestPortalLinkMutation.isPending} className="w-full bg-brand text-white hover:bg-brand-deep-hover text-xs uppercase tracking-widest py-2.5 rounded-none">
                  <MailCheck className="mr-2 h-4 w-4" />{requestPortalLinkMutation.isPending ? "Sending secure link…" : "Email secure password link"}
                </Button>
                <button type="button" onClick={() => { setIsPasswordHelpMode(false); setSignInError(""); }} className="w-full text-center text-xs font-semibold text-brand underline underline-offset-2">Back to password sign in</button>
              </> : <>
                <Button onClick={handleParticipantSignIn} disabled={participantSignInMutation.isPending} className="w-full bg-brand text-white hover:bg-brand-deep-hover text-xs uppercase tracking-widest py-2.5 rounded-none">
                  <KeyRound className="mr-2 h-4 w-4" />{participantSignInMutation.isPending ? "Signing in…" : "Sign in"}
                </Button>
                <button type="button" onClick={() => { setIsPasswordHelpMode(true); setSignInError(""); }} className="w-full text-center text-xs font-semibold text-brand underline underline-offset-2">First time here or forgot your password?</button>
              </>
            )}
            {!passwordLinkSent && <p className="text-center text-xs leading-5 text-ink-muted">Not a client yet? <button type="button" onClick={() => { setIsParticipantSignInOpen(false); handleApply(); }} className="font-semibold text-brand underline underline-offset-2">Apply</button>.</p>}
          </div>
        </DialogContent>
      </Dialog>

      <DiagnosticRegistrationDialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen} selectedPackage={selectedPackage} />

      <footer className="py-12 border-t border-line bg-paper">
        <div className="container max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-ink-muted">
          <div className="flex items-center gap-4">
            <img src={BRAND.markUrl} alt="" className="h-8 w-auto" />
            <p>© 2026 {BRAND.organisationLegalName} ({BRAND.organisationName}). {BRAND.productTagline}.</p>
          </div>
          <div className="flex items-center gap-6">
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#pricing" className="hover:text-ink">Pricing</a>
            <a href="#questions" className="hover:text-ink">Questions</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
