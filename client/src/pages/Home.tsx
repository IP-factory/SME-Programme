import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import FacilitatorVideo from "@/components/FacilitatorVideo";
import DiagnosticRegistrationDialog from "@/components/DiagnosticRegistrationDialog";
import PricingRequestDialog from "@/components/PricingRequestDialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { currencyReferenceLabel, formatProgrammePrice, type DisplayCurrency } from "@/lib/currency";
import { ArrowRight, CheckCircle2, KeyRound, MailCheck, ShieldAlert, Sparkles, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import { BRAND } from "@shared/brand";

export default function Home() {
  const { user } = useAuth();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isParticipantSignInOpen, setIsParticipantSignInOpen] = useState(false);
  const [isPricingRequestOpen, setIsPricingRequestOpen] = useState(false);
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
  const [currency, setCurrency] = useState<DisplayCurrency>("USD");
  const [submittedResult, setSubmittedResult] = useState<{ status: string; message: string; emailStatus?: "Sent" | "Simulated" | "Failed" } | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    businessName: "",
    businessDescription: "",
    businessModel: "Maker" as "Maker" | "Trader" | "Expert",
    question: "",
  });

  const { data: capacityData } = trpc.registration.capacity.useQuery();
  const boardroomCount = capacityData?.boardroomCount ?? 0;
  const boardroomRemaining = Math.max(0, 8 - boardroomCount);

  const registerMutation = trpc.registration.submit.useMutation({
    onSuccess: (data) => {
      setSubmittedResult(data);
      toast.success(data.message);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit registration.");
    },
  });

  const handleOpenRegister = (pkg: "Foundation" | "Engine Room" | "Boardroom") => {
    setSelectedPackage(pkg);
    setSubmittedResult(null);
    setIsRegisterOpen(true);
  };

  const handleSubmitRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone || !formData.businessName || !formData.businessDescription) {
      toast.error("Please fill in all required fields.");
      return;
    }
    registerMutation.mutate({
      ...formData,
      package: selectedPackage,
    });
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-sans flex flex-col selection:bg-brand selection:text-paper">
      {/* Top Header */}
      <header className="border-b border-line bg-paper/80 backdrop-blur sticky top-0 z-50">
        <div className="container flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <span className="font-serif font-bold text-xl tracking-wider uppercase">{BRAND.programmeName}</span>
            <span className="hidden sm:inline-block text-xs uppercase tracking-widest px-2.5 py-1 bg-brand text-paper rounded-full">Cohort 2</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-ink-600">
            <a href="#about" className="hover:text-brand transition-colors">The Programme</a>
            <a href="#structure" className="hover:text-brand transition-colors">Learning Flow</a>
            <a href="#packages" className="hover:text-brand transition-colors">Packages & Pricing</a>
            <a href="#payment" className="hover:text-brand transition-colors">Payment Info</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setIsParticipantSignInOpen(true); setIsPasswordHelpMode(false); setPasswordLinkSent(false); setSignInError(""); }}
              className="border-red-500/50 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs uppercase tracking-wider font-semibold"
            >
              Participant Sign In
            </Button>

            <Button
              onClick={() => handleOpenRegister("Foundation")}
              className="bg-ink text-paper hover:bg-charcoal font-medium text-xs uppercase tracking-widest px-5 py-2.5 rounded-none"
            >
              Sign-up Now
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-32 border-b border-line">
        <div className="container max-w-5xl mx-auto text-center px-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-line bg-brand-tint text-brand text-xs font-semibold uppercase tracking-widest mb-8">
            <Sparkles className="w-3.5 h-3.5" /> Strategy & Innovation Genius Track • Sept – Oct 2026
          </div>
          <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-[1.05] text-ink mb-8">
            Learn, Apply <span className="italic font-normal">&amp; Decide.</span>
          </h1>
          <p className="font-serif italic text-xl sm:text-2xl text-ink-soft max-w-3xl mx-auto mb-12 leading-relaxed">
            &ldquo;You don&apos;t just attend the class. You come prepared, learn deeply, and get access to the person teaching you.&rdquo;
          </p>
          <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3 mx-auto">
            <Button
              onClick={() => handleOpenRegister("Foundation")}
              className="w-full bg-ink text-paper hover:bg-charcoal text-sm uppercase tracking-widest px-5 py-6 rounded-none font-semibold shadow-lg"
            >
              Secure Your Place <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <a
              href="#packages"
              className="w-full inline-flex items-center justify-center px-5 py-6 border border-brand text-brand text-sm uppercase tracking-widest font-semibold hover:bg-brand-tint transition-colors"
            >
              Explore Packages
            </a>
            <Button variant="outline" onClick={() => setIsPricingRequestOpen(true)} className="w-full rounded-none border-brand py-6 text-xs font-semibold uppercase tracking-widest text-brand hover:bg-brand-tint">Request programme pricing</Button>
          </div>
          <div className="mt-16 pt-12 border-t border-line grid grid-cols-2 md:grid-cols-[1.35fr_1fr_1fr_1fr] gap-8 text-left">
            <div className="col-span-2 md:col-span-1 flex items-center gap-4">
              <img
                src={BRAND.facilitatorPortraitUrl}
                alt={`${BRAND.facilitatorFormalName}, facilitator of ${BRAND.programmeName}`}
                className="h-24 w-20 shrink-0 border border-line-strongest object-cover object-center shadow-[4px_4px_0_0_var(--color-brand)] sm:h-28 sm:w-24"
              />
              <div>
                <p className="text-xs uppercase tracking-widest text-ink-muted mb-1">Facilitator</p>
                <p className="font-serif font-bold text-lg leading-tight">{BRAND.facilitatorFormalName}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">Partner, Enzo Krypton<br />Strategy &amp; Innovation Advisor</p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-muted mb-1">Experience</p>
              <p className="font-serif font-bold text-lg">18 Years</p>
              <p className="text-xs text-ink-soft">180+ Organizations Advised</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-muted mb-1">Cohort Timeline</p>
              <p className="font-serif font-bold text-lg">Sept – Oct 2026</p>
              <p className="text-xs text-ink-soft">Cohort 2 (Intimate Room)</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-muted mb-1">Outcome</p>
              <p className="font-serif font-bold text-lg">Decisions, Not Notes</p>
              <p className="text-xs text-ink-soft">Rigorous Business Architecture</p>
            </div>
          </div>
        </div>
      </section>

      <section id="facilitator" className="py-20 md:py-24 border-b border-line bg-paper-sunken/35">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_380px] gap-12 md:gap-16 items-center">
            <div className="flex flex-col sm:flex-row gap-7 items-start">
              <img
                src={BRAND.facilitatorPortraitUrl}
                alt={`${BRAND.facilitatorFormalName}, facilitator of ${BRAND.programmeName}`}
                className="w-40 sm:w-48 aspect-[4/5] object-cover border border-line-strongest shadow-[6px_6px_0_0_var(--color-brand)]"
              />
              <div className="max-w-xl">
                <span className="text-xs uppercase tracking-widest text-ink-muted font-semibold block mb-3">Facilitator</span>
                <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight mb-5">Meet {BRAND.facilitatorFormalName}</h2>
                <p className="font-serif italic text-xl text-ink-750 mb-5">Strategy &amp; Innovation Advisor · Partner, Enzo Krypton</p>
                <p className="text-ink-soft leading-relaxed">
                  {BRAND.facilitatorFirstName} brings eighteen years of advisory experience to the room, helping leaders move from business friction to clear strategic decisions, practical architecture, and disciplined execution.
                </p>
              </div>
            </div>
            <div className="w-full flex justify-center md:justify-end">
              <FacilitatorVideo />
            </div>
          </div>
        </div>
      </section>

      {/* Programme Problem Statement & Overview */}
      <section id="about" className="py-24 border-b border-line">
        <div className="container max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
            <div className="md:col-span-5">
              <span className="text-xs uppercase tracking-widest text-ink-muted font-semibold block mb-3">Diagnostic Focus</span>
              <h2 className="font-serif text-4xl font-bold tracking-tight mb-6">
                Built for founders who are ready to stop guessing.
              </h2>
              <p className="text-ink-soft leading-relaxed mb-6">
                {BRAND.programmeName} is designed for leaders who sense friction in their enterprise but lack a rigorous architecture to diagnose and correct it. You leave with decisive answers, not academic theories.
              </p>
              <div className="p-6 bg-paper-deep border-l-2 border-ink">
                <p className="font-serif italic text-sm text-ink-750">
                  &ldquo;A bakery and a fashion label look like different businesses but have nearly identical problems — both convert raw input into units and live or die on cost per unit.&rdquo;
                </p>
              </div>
            </div>
            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-8 bg-paper-sunken border border-line">
                <span className="text-xs uppercase tracking-widest text-ink-muted block mb-2">Symptom 01</span>
                <h3 className="font-serif font-bold text-lg mb-2">Founder Dependency</h3>
                <p className="text-sm text-ink-soft">Your business depends too much on you, creating a ceiling on growth and daily operational bottlenecks.</p>
              </div>
              <div className="p-8 bg-paper-sunken border border-line">
                <span className="text-xs uppercase tracking-widest text-ink-muted block mb-2">Symptom 02</span>
                <h3 className="font-serif font-bold text-lg mb-2">Lack of Growth Architecture</h3>
                <p className="text-sm text-ink-soft">You do not fully understand what is wrong in the business or what precise step to take next.</p>
              </div>
              <div className="p-8 bg-paper-sunken border border-line">
                <span className="text-xs uppercase tracking-widest text-ink-muted block mb-2">Symptom 03</span>
                <h3 className="font-serif font-bold text-lg mb-2">Unit Economics Leakage</h3>
                <p className="text-sm text-ink-soft">Pricing to guesswork instead of margin, with hidden cost leaks eroding profitability across units.</p>
              </div>
              <div className="p-8 bg-paper-sunken border border-line">
                <span className="text-xs uppercase tracking-widest text-ink-muted block mb-2">Symptom 04</span>
                <h3 className="font-serif font-bold text-lg mb-2">Senior Thinking Partner</h3>
                <p className="text-sm text-ink-soft">You need an experienced strategist to dissect your model and pressure-test your strategic intent.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Flow & Session Structure */}
      <section id="structure" className="py-24 border-b border-line bg-paper-sunken/50">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest text-ink-muted font-semibold block mb-3">The Classroom</span>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              How {BRAND.facilitatorFirstName}&apos;s Sessions Are Structured
            </h2>
            <p className="text-ink-soft">
              Every session combines rigorous preparation, targeted masterclass teaching, and direct access to {BRAND.facilitatorFirstName}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="p-8 bg-paper border border-line relative">
              <span className="absolute -top-4 left-8 px-3 py-1 bg-ink text-paper text-xs font-mono uppercase">15 Mins Before</span>
              <h3 className="font-serif font-bold text-2xl mt-4 mb-3">Open Office</h3>
              <p className="text-sm text-ink-soft leading-relaxed mb-4">
                {BRAND.facilitatorFirstName} opens the room 15 minutes before class for first-come, first-served questions on the assigned textbook and previous masterclass.
              </p>
              <ul className="text-xs text-ink-muted space-y-2">
                <li>• Two questions only</li>
                <li>• Submit ahead or register early</li>
                <li>• 90 seconds to ask, direct answers</li>
              </ul>
            </div>
            <div className="p-8 bg-paper border border-line relative shadow-md">
              <span className="absolute -top-4 left-8 px-3 py-1 bg-ink text-paper text-xs font-mono uppercase">60 Mins Class</span>
              <h3 className="font-serif font-bold text-2xl mt-4 mb-3">Masterclass</h3>
              <p className="text-sm text-ink-soft leading-relaxed mb-4">
                Classes are built around decision-making, not lectures. The foundational textbook provides the required reading ahead so the live hour focuses entirely on rigorous application and strategic choices.
              </p>
              <ul className="text-xs text-ink-muted space-y-2">
                <li>• Foundational textbook pre-reads</li>
                <li>• Decision-making over lectures</li>
                <li>• Frameworks applied directly to your enterprise</li>
              </ul>
            </div>
            <div className="p-8 bg-paper border border-line relative">
              <span className="absolute -top-4 left-8 px-3 py-1 bg-ink text-paper text-xs font-mono uppercase">30 Mins After</span>
              <h3 className="font-serif font-bold text-2xl mt-4 mb-3">Deep-Dive Q&amp;A</h3>
              <p className="text-sm text-ink-soft leading-relaxed mb-4">
                Challenge the thinking. The room opens again for questions on the session just taught, testing concepts directly against your enterprise.
              </p>
              <ul className="text-xs text-ink-muted space-y-2">
                <li>• Clarify difficult frameworks</li>
                <li>• Test ideas against your market</li>
                <li>• Actionable next steps</li>
              </ul>
            </div>
          </div>

          {/* Five Classes Progression */}
          <div className="border border-line bg-paper p-8 md:p-12">
            <h3 className="font-serif text-2xl font-bold mb-8 text-center">Five Classes. One Business. Deeper Thinking.</h3>
            <div className="space-y-6 divide-y divide-line">
              <div className="pt-6 first:pt-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-3 font-mono text-xs uppercase tracking-widest text-ink-muted">01 • Clarity</div>
                <div className="md:col-span-4 font-serif font-bold text-lg">Why are we here, and what are we building?</div>
                <div className="md:col-span-5 text-sm text-ink-soft">Business Overview • Strategic Intent • Purpose, ambition and strategic choices</div>
              </div>
              <div className="pt-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-3 font-mono text-xs uppercase tracking-widest text-ink-muted">02 • Business Model</div>
                <div className="md:col-span-4 font-serif font-bold text-lg">How does the business create and capture value?</div>
                <div className="md:col-span-5 text-sm text-ink-soft">Business Model • Market and Industry • Customer, value proposition, positioning</div>
              </div>
              <div className="pt-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-3 font-mono text-xs uppercase tracking-widest text-ink-muted">03 • Growth Engine</div>
                <div className="md:col-span-4 font-serif font-bold text-lg">How do we win customers and make money?</div>
                <div className="md:col-span-5 text-sm text-ink-soft">Brand, Marketing and Sales • Acquisition, pricing, margins, unit economics</div>
              </div>
              <div className="pt-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-3 font-mono text-xs uppercase tracking-widest text-ink-muted">04 • Operating Engine</div>
                <div className="md:col-span-4 font-serif font-bold text-lg">What must exist behind the scenes to scale?</div>
                <div className="md:col-span-5 text-sm text-ink-soft">Operations • People • Technology • Processes, organisation, artificial intelligence</div>
              </div>
              <div className="pt-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-3 font-mono text-xs uppercase tracking-widest text-ink-muted">05 • Durable Business</div>
                <div className="md:col-span-4 font-serif font-bold text-lg">How do we build a resilient, valuable enterprise?</div>
                <div className="md:col-span-5 text-sm text-ink-soft">Financial Plan • Risk • Exit • Capital, resilience, enterprise value, succession</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Packages & Pricing Section */}
      <section id="packages" className="py-24 border-b border-line">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest text-ink-muted font-semibold block mb-3">Investment &amp; Tiers</span>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Three Packages. Choose Your Depth.
            </h2>
            <p className="text-ink-soft">
              Payment terms: 40% commitment before classes begin, 30% by the end of September, and the final 30% by mid-October before the programme ends. Pay the full programme fee upfront and receive a 10% discount. <strong className="text-brand">Note: Higher tiers (Engine Room and Boardroom) comprehensively include all foundational access—selecting a tier is cumulative, not additive, so there is no double payment.</strong>
            </p>
            <div className="mt-7 flex flex-col items-center gap-3">
              <div className="inline-flex border border-brand-line bg-brand-tint p-1" role="group" aria-label="Choose display currency">
                {(["USD", "NGN"] as const).map((option) => <button key={option} type="button" onClick={() => setCurrency(option)} aria-pressed={currency === option} className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors ${currency === option ? "bg-brand text-paper" : "text-brand hover:bg-paper"}`}>{option}</button>)}
              </div>
              <p className="text-[11px] text-ink-muted">{currencyReferenceLabel(currency)} · displayed prices are programme fee equivalents</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Foundation */}
            <div className="bg-paper-sunken border border-line p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-ink-muted block mb-2">Package 01</span>
                <h3 className="font-serif text-3xl font-bold mb-2">Foundation</h3>
                <p className="text-xs uppercase tracking-widest text-brand font-semibold mb-3">Learn</p>
                <p className="text-xs italic text-ink-muted mb-6">“I run on instinct, and it is starting to show.”</p>
                <div className="mb-8">
                  <span className="text-4xl font-serif font-bold">{formatProgrammePrice("Foundation", currency)}</span>
                  <span className="text-xs text-ink-muted block mt-1">40% commitment before classes; 30% by end of September; 30% by mid-October. 10% discount on full upfront payment</span>
                </div>
                <ul className="space-y-3 text-sm text-ink-600 mb-8">
                  <li className="flex items-start gap-2">✓ Five live classes x 90 minutes, fortnightly</li>
                  <li className="flex items-start gap-2">✓ Live Q&amp;A plus dedicated post-class question time</li>
                  <li className="flex items-start gap-2">✓ Slides, replays and curated resource library</li>
                  <li className="flex items-start gap-2">✓ The Last Testament of Business textbook</li>
                </ul>
              </div>
              <Button
                onClick={() => handleOpenRegister("Foundation")}
                className="w-full bg-ink text-paper hover:bg-charcoal rounded-none py-6 uppercase tracking-wider text-xs font-semibold"
              >
                Register for Foundation
              </Button>
            </div>

            {/* Engine Room */}
            <div className="bg-paper-sunken border border-line p-8 flex flex-col justify-between relative">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-ink-muted block mb-2">Package 02</span>
                <h3 className="font-serif text-3xl font-bold mb-2">Engine Room</h3>
                <p className="text-xs uppercase tracking-widest text-brand font-semibold mb-3">Apply</p>
                <p className="text-xs italic text-ink-muted mb-6">“Show me how this works in a business built like mine.”</p>
                <div className="mb-8">
                  <span className="text-4xl font-serif font-bold">{formatProgrammePrice("Engine Room", currency)}</span>
                  <span className="text-xs text-ink-muted block mt-1">40% commitment before classes; 30% by end of September; 30% by mid-October. 10% discount on full upfront payment</span>
                </div>
                <ul className="space-y-3 text-sm text-ink-600 mb-8">
                  <li className="flex items-start gap-2 font-medium">✓ Everything in Foundation</li>
                  <li className="flex items-start gap-2">✓ Two Engine Room sessions grouped by how you make money (Makers, Traders, Experts)</li>
                  <li className="flex items-start gap-2">✓ Competitive positioning for your specific business model</li>
                  <li className="flex items-start gap-2">✓ Peer diagnosis and unit economics workshops</li>
                </ul>
              </div>
              <Button
                onClick={() => handleOpenRegister("Engine Room")}
                className="w-full bg-ink text-paper hover:bg-charcoal rounded-none py-6 uppercase tracking-wider text-xs font-semibold"
              >
                Register for Engine Room
              </Button>
            </div>

            {/* Boardroom */}
            <div className="bg-paper-sunken border border-line p-8 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-brand text-white text-[10px] font-mono uppercase px-4 py-1">
                Capped at 8 Places ({boardroomRemaining} left)
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-ink-muted block mb-2">Package 03</span>
                <h3 className="font-serif text-3xl font-bold mb-2">Boardroom</h3>
                <p className="text-xs uppercase tracking-widest text-brand font-semibold mb-3">Decide</p>
                <p className="text-xs italic text-ink-muted mb-6">“I need someone senior to sit with me and tell me what to do.”</p>
                <div className="mb-8">
                  <span className="text-4xl font-serif font-bold">{formatProgrammePrice("Boardroom", currency)}</span>
                  <span className="text-xs text-ink-muted block mt-1">40% commitment before classes; 30% by end of September; 30% by mid-October. 10% discount on full upfront payment</span>
                </div>
                <ul className="space-y-3 text-sm text-ink-600 mb-8">
                  <li className="flex items-start gap-2 font-medium">✓ Everything in Engine Room</li>
                  <li className="flex items-start gap-2">✓ Three private strategy sessions with {BRAND.facilitatorFirstName} (90 mins each)</li>
                  <li className="flex items-start gap-2">✓ Written action points after every session</li>
                  <li className="flex items-start gap-2 text-brand font-semibold">✓ Strictly capped at 8 businesses for Cohort 2</li>
                </ul>
              </div>
              <Button
                onClick={() => handleOpenRegister("Boardroom")}
                className="w-full bg-ink text-paper hover:bg-charcoal rounded-none py-6 uppercase tracking-wider text-xs font-semibold"
              >
                {boardroomRemaining === 0 ? "Join Boardroom Waitlist" : "Register for Boardroom"}
              </Button>
            </div>
          </div>

          {boardroomRemaining === 0 && (
            <div className="mt-8 p-4 bg-brand-tint border border-brand text-brand text-center text-sm font-medium">
              <ShieldAlert className="inline w-4 h-4 mr-2" />
              Boardroom capacity of 8 businesses has been reached. New Boardroom submissions will automatically be placed on the priority Waitlist.
            </div>
          )}
        </div>
      </section>

      {/* Payment Instructions Section */}
      <section id="payment" className="py-24 border-b border-line bg-paper-sunken/30">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-widest text-ink-muted font-semibold block mb-3">Offline Settling</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Payment Instructions &amp; Bank Transfer
            </h2>
            <p className="text-sm text-ink-soft">
              Once your registration is accepted by the review team, pay 40% as your commitment before classes begin, 30% by the end of September, and the final 30% by mid-October before the programme ends. Alternatively, pay the full programme fee upfront and receive a 10% discount.
            </p>
          </div>

          <div className="border border-ink bg-paper p-8 md:p-12 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="md:col-span-2 p-5 bg-paper-sunken border border-line">
                <p className="text-xs uppercase tracking-widest text-ink-muted mb-2">Official transfer details</p>
                <p className="font-serif text-2xl font-bold">Shared after acceptance</p>
                <p className="text-sm text-ink-soft mt-2 max-w-2xl">Your registration is reviewed first. Accepted applicants will receive the verified bank name, account name, account number, deposit amount, and payment reference by email. No payment is requested through this page until those details are confirmed.</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-ink-muted mb-1">Payment schedule</p>
                <p className="font-serif font-bold text-xl">40% commitment · 30% Sept · 30% Oct</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-ink-muted mb-1">Upfront option</p>
                <p className="font-serif font-bold text-xl">10% discount on full payment</p>
              </div>
            </div>
            <div className="pt-6 border-t border-line text-xs text-ink-muted flex flex-col sm:flex-row justify-between gap-4">
              <span>• Do not transfer funds until the official acceptance email arrives.</span>
              <span>• Instalments are tracked by the programme team.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Participant Sign In Modal */}
      <Dialog open={isParticipantSignInOpen} onOpenChange={setIsParticipantSignInOpen}>
        <DialogContent className="max-w-md bg-paper border border-line text-ink">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold">Participant Sign In</DialogTitle>
            <DialogDescription className="text-xs text-ink-soft">Sign in with the email address and password linked to your {BRAND.programmeShortName} participant account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-ink-muted block mb-1 font-semibold">Registered Email Address</label>
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
              <Input type="password" placeholder={`Your ${BRAND.programmeShortName} participant password`} value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} className="bg-white border-line" autoComplete="current-password" />
            </div>}
            {signInError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                {signInError}
              </div>
            )}
            {passwordLinkSent ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded space-y-3">
                <p className="text-xs text-green-800 font-medium">
                  If this email is linked to an eligible {BRAND.programmeShortName} registration, a secure password link will arrive shortly. It lets you set a first password or reset an existing one, and expires in 20 minutes.
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
                <p className="border-l-2 border-brand bg-brand-tint px-3 py-2 text-xs leading-5 text-brand">New participant? This link will let you set your password. Returning participant? It will let you reset it.</p>
                <Button onClick={handlePasswordLinkRequest} disabled={requestPortalLinkMutation.isPending} className="w-full bg-brand text-white hover:bg-brand-deep-hover text-xs uppercase tracking-widest py-2.5 rounded-none">
                  <MailCheck className="mr-2 h-4 w-4" />{requestPortalLinkMutation.isPending ? "Sending secure link…" : "Email secure password link"}
                </Button>
                <button type="button" onClick={() => { setIsPasswordHelpMode(false); setSignInError(""); }} className="w-full text-center text-xs font-semibold text-brand underline underline-offset-2">Back to password sign in</button>
              </> : <>
                <Button onClick={handleParticipantSignIn} disabled={participantSignInMutation.isPending} className="w-full bg-brand text-white hover:bg-brand-deep-hover text-xs uppercase tracking-widest py-2.5 rounded-none">
                  <KeyRound className="mr-2 h-4 w-4" />{participantSignInMutation.isPending ? "Signing in…" : "Sign in to my portal"}
                </Button>
                <button type="button" onClick={() => { setIsPasswordHelpMode(true); setSignInError(""); }} className="w-full text-center text-xs font-semibold text-brand underline underline-offset-2">First time here or forgot your password?</button>
              </>
            )}
            {!passwordLinkSent && <p className="text-center text-xs leading-5 text-ink-muted">Not registered yet? <button type="button" onClick={() => { setIsParticipantSignInOpen(false); setIsRegisterOpen(true); }} className="font-semibold text-brand underline underline-offset-2">Sign up now</button>.</p>}
          </div>
        </DialogContent>
      </Dialog>

      <PricingRequestDialog open={isPricingRequestOpen} onOpenChange={setIsPricingRequestOpen} source="public" />

      {/* Footer */}
      <DiagnosticRegistrationDialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen} selectedPackage={selectedPackage} />
      <footer className="py-12 border-t border-line bg-paper">
        <div className="container max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-ink-muted">
          <p>© 2026 {BRAND.programmeShortName} Strategy &amp; Innovation Genius Track. Facilitated by {BRAND.facilitatorFormalName}.</p>
          <div className="flex items-center gap-6">
            <a href="#about" className="hover:text-ink">About</a>
            <a href="#packages" className="hover:text-ink">Packages</a>
            <a href="#payment" className="hover:text-ink">Payment</a>

          </div>
        </div>
      </footer>

      {/* Registration Modal */}
      <Dialog open={false} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="max-w-xl bg-paper border border-line text-ink max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-bold">
              {BRAND.programmeName} Application — {selectedPackage} Package
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-soft">
              Please complete the diagnostic details below. Our team reviews all applications to ensure cohort fit.
            </DialogDescription>
            <div className="mt-3 p-3 bg-paper-sunken border border-line text-xs text-ink-soft">
              <strong className="text-ink">Payment terms:</strong> 40% commitment before classes begin, 30% by the end of September, and the final 30% by mid-October before the programme ends. Full upfront payment receives a 10% discount.
            </div>
          </DialogHeader>

          {submittedResult ? (
            <div className="py-8 text-center space-y-6">
              <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-600" />
              <h3 className="font-serif text-2xl font-bold">Registration Received</h3>
              <p className="text-sm text-ink-soft max-w-md mx-auto leading-relaxed">
                {submittedResult.message}
              </p>
              <div className="p-4 bg-paper-sunken border border-line text-xs text-left space-y-1">
                <p><strong>Package:</strong> {selectedPackage}</p>
                <p><strong>Status:</strong> {submittedResult.status}</p>
                <p><strong>Acknowledgement:</strong> {submittedResult.emailStatus === "Sent" ? `Sent to ${formData.email}` : "Recorded; delivery is pending email configuration."}</p>
              </div>
              <Button
                onClick={() => setIsRegisterOpen(false)}
                className="w-full bg-ink text-paper rounded-none uppercase tracking-wider text-xs py-6"
              >
                Close &amp; Return to Page
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitRegistration} className="space-y-5 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs uppercase tracking-wider text-ink-muted">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Adebayo Ogunlesi"
                    required
                    className="bg-paper-sunken border-line"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs uppercase tracking-wider text-ink-muted">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="adebayo@company.com"
                    required
                    className="bg-paper-sunken border-line"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs uppercase tracking-wider text-ink-muted">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+234 803 000 0000"
                    required
                    className="bg-paper-sunken border-line"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-xs uppercase tracking-wider text-ink-muted">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="Enterprise Ltd"
                    required
                    className="bg-paper-sunken border-line"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessModel" className="text-xs uppercase tracking-wider text-ink-muted">Business Model Type *</Label>
                <Select
                  value={formData.businessModel}
                  onValueChange={(val: "Maker" | "Trader" | "Expert") => setFormData({ ...formData, businessModel: val })}
                >
                  <SelectTrigger className="bg-paper-sunken border-line">
                    <SelectValue placeholder="Select business model" />
                  </SelectTrigger>
                  <SelectContent className="bg-paper border-line">
                    <SelectItem value="Maker">Maker (Turns input into units / Manufacturing, Processing)</SelectItem>
                    <SelectItem value="Trader">Trader (Buys, moves &amp; sells / Retail, E-commerce, Real estate)</SelectItem>
                    <SelectItem value="Expert">Expert (Sells something invisible / Consulting, Services)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessDescription" className="text-xs uppercase tracking-wider text-ink-muted">Business Description &amp; Main Bottleneck *</Label>
                <Textarea
                  id="businessDescription"
                  value={formData.businessDescription}
                  onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                  placeholder="Briefly describe what your business does and what specific friction or bottleneck you want to solve..."
                  rows={3}
                  required
                  className="bg-paper-sunken border-line"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="packageSelect" className="text-xs uppercase tracking-wider text-ink-muted">Chosen Package *</Label>
                <Select
                  value={selectedPackage}
                  onValueChange={(val: "Foundation" | "Engine Room" | "Boardroom") => setSelectedPackage(val)}
                >
                  <SelectTrigger className="bg-paper-sunken border-line">
                    <SelectValue placeholder="Select package" />
                  </SelectTrigger>
                  <SelectContent className="bg-paper border-line">
                    <SelectItem value="Foundation">Foundation ({formatProgrammePrice("Foundation", currency)})</SelectItem>
                    <SelectItem value="Engine Room">Engine Room ({formatProgrammePrice("Engine Room", currency)})</SelectItem>
                    <SelectItem value="Boardroom">Boardroom ({formatProgrammePrice("Boardroom", currency)} — Capped at 8)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="question" className="text-xs uppercase tracking-wider text-ink-muted">Pre-submission Question for Open Office / Q&amp;A</Label>
                <Textarea
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder={`What specific question or problem would you like ${BRAND.facilitatorFirstName} to address in session?`}
                  rows={2}
                  className="bg-paper-sunken border-line"
                />
              </div>

              {selectedPackage === "Boardroom" && boardroomRemaining === 0 && (
                <div className="p-3 bg-danger-tint border border-danger text-danger text-xs">
                  <strong>Notice:</strong> Boardroom capacity is currently full (8/8). Submitting will automatically place you on the priority Waitlist.
                </div>
              )}

              <Button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full bg-ink text-paper hover:bg-charcoal rounded-none py-6 uppercase tracking-wider text-xs font-semibold"
              >
                {registerMutation.isPending ? "Submitting Application..." : "Submit Application &amp; Acknowledge"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
