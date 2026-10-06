import { Button } from "@/components/ui/button";
import DiagnosticRegistrationDialog from "@/components/DiagnosticRegistrationDialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ArrowRight, CheckCircle2, KeyRound, MailCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { BRAND } from "@shared/brand";
import { JOURNEY, PROBLEM_AREAS } from "@shared/businessSupport";

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

  /** The free business check: the external form when configured, otherwise the on-site form. */
  const handleStartCheck = () => {
    if (BRAND.applyUrl) {
      window.open(BRAND.applyUrl, "_blank", "noopener,noreferrer");
      return;
    }
    handleOpenRegister("Foundation");
  };


  return (
    <div className="min-h-screen bg-paper text-ink font-sans flex flex-col selection:bg-brand selection:text-paper">
      {/* Copy: concept note v0.8.1, section 16 ("lift as is"). [NAME] is BRAND.productName. */}
      <header className="border-b border-line bg-paper/90 backdrop-blur sticky top-0 z-50">
        <div className="container flex items-center justify-between h-20">
          <a href="#top" className="flex items-center gap-3" aria-label={`${BRAND.organisationName} ${BRAND.productName}`}>
            <img src={BRAND.markUrl} alt={BRAND.organisationName} className="h-9 w-auto shrink-0 sm:hidden" />
            <img src={BRAND.logoUrl} alt={BRAND.organisationName} className="hidden h-10 w-auto shrink-0 sm:block" />
            <span className="hidden lg:inline-block border-l border-line pl-3 text-xs font-semibold uppercase tracking-widest text-ink-muted">{BRAND.productName}</span>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-ink-600">
            <a href="#how" className="hover:text-brand transition-colors">How it works</a>
            <a href="#stuck" className="hover:text-brand transition-colors">Where you're stuck</a>
            <a href="#for" className="hover:text-brand transition-colors">Who it's for</a>
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
            <Button onClick={handleStartCheck} className="hidden sm:inline-flex bg-ink text-paper hover:bg-charcoal font-medium text-xs uppercase tracking-widest px-5 py-2.5 rounded-none">
              Free business check
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative pt-20 pb-20 md:pt-28 md:pb-24 border-b border-line">
        <div className="container max-w-4xl mx-auto text-center px-4">
          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] text-ink mb-8">
            You know what your business needs.
          </h1>
          <p className="font-serif italic text-xl sm:text-2xl text-ink-soft max-w-3xl mx-auto mb-6 leading-relaxed">
            You just can&apos;t get it done, with everything else on your plate.
          </p>
          <p className="text-lg text-ink-600 max-w-2xl mx-auto mb-12 leading-relaxed">
            {BRAND.productName} gets in with you, names the real problem, shows you exactly what to do, gives you the tools, and checks your work every week until the number moves.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Button onClick={handleStartCheck} className="h-14 w-full max-w-sm bg-ink text-paper hover:bg-charcoal text-sm uppercase tracking-widest px-8 rounded-none font-semibold shadow-lg">
              Start with a free business check <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <p className="text-sm text-ink-muted">Ten minutes, on your phone.</p>
          </div>
        </div>
      </section>

      {/* The problem, in your words */}
      <section id="problem" className="py-24 border-b border-line">
        <div className="container max-w-5xl mx-auto">
          <span className="text-xs uppercase tracking-widest text-ink-muted font-semibold block mb-6 text-center">The problem, in your words</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {["I'm busy but not making money.", "Nothing moves unless I'm there.", "How do I get more customers, every month?", "Cash is always tight and my prices are guesses."].map((quote) => (
              <div key={quote} className="p-6 bg-paper-sunken border border-line">
                <p className="font-serif italic text-xl text-ink-750 leading-snug">&ldquo;{quote}&rdquo;</p>
              </div>
            ))}
          </div>
          <p className="font-serif text-2xl sm:text-3xl text-center text-ink max-w-3xl mx-auto leading-snug">
            If one of those is you, you don&apos;t need another course. You need someone who stays with you while you fix it.
          </p>
        </div>
      </section>

      {/* What we are, and are not */}
      <section id="what" className="py-24 border-b border-line bg-paper-sunken/50">
        <div className="container max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div>
            <span className="text-xs uppercase tracking-widest text-ink-muted font-semibold block mb-3">What we are, and are not</span>
            <h2 className="font-serif text-4xl font-bold tracking-tight mb-6">We don&apos;t run your business; you do.</h2>
            <ul className="space-y-2 text-ink-600">
              <li>We are not a course.</li>
              <li>We are not a consultant who writes a report and leaves.</li>
            </ul>
          </div>
          <div className="space-y-5 text-lg text-ink-600 leading-relaxed">
            <p>We work out what is really wrong, tell you what to do about it, hand you the tools, and meet you every week until it is done.</p>
            <p className="p-5 border border-brand-line bg-brand-tint text-base text-brand-deep">Our analysts and AI do the heavy lifting, under a named {BRAND.organisationName} consultant. We say so up front.</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 border-b border-line">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight">How it works</h2>
          </div>
          <ol className="space-y-4">
            {JOURNEY.map((step, index) => (
              <li key={step.id} className="flex gap-5 bg-paper-raised border border-line p-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-brand text-paper font-mono text-sm font-semibold">{index + 1}</span>
                <div>
                  <p className="font-serif font-bold text-xl mb-1">{step.name}</p>
                  <p className="text-ink-soft leading-relaxed">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Where businesses get stuck */}
      <section id="stuck" className="py-24 border-b border-line bg-paper-sunken/50">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-widest text-ink-muted font-semibold block mb-3">Where businesses get stuck</span>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight">Pick yours.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROBLEM_AREAS.filter((area) => area.siteSentence).map((area) => (
              <button
                key={area.number}
                type="button"
                onClick={handleStartCheck}
                className="group flex items-center justify-between gap-4 text-left bg-paper border border-line p-5 hover:border-brand hover:bg-brand-tint transition-colors"
              >
                <span className="font-serif italic text-lg text-ink-750 leading-snug">&ldquo;{area.siteSentence}&rdquo;</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-ink-faint group-hover:text-brand" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Who it is for / who you work with */}
      <section id="for" className="py-24 border-b border-line">
        <div className="container max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <span className="text-xs uppercase tracking-widest text-ink-muted font-semibold block mb-3">Who it is for</span>
            <p className="text-lg text-ink-600 leading-relaxed mb-4">
              Business owners who already trade, at about ₦5 million a month or more, and who can give two to four hours a week for six weeks.
            </p>
            <p className="text-ink-soft leading-relaxed">
              If you are smaller, start with the free check and our training timetable. If you are much larger, we will point you to {BRAND.organisationName} Advisory.
            </p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-ink-muted font-semibold block mb-3">Who you work with</span>
            <ul className="space-y-3 text-lg text-ink-600">
              <li className="flex items-start gap-3"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-highlight-ink" />A named {BRAND.organisationName} consultant leads your work.</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-highlight-ink" />Analysts prepare every call.</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-highlight-ink" />A partner joins for larger businesses.</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-highlight-ink" />We use AI for analysis and say so.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Questions */}
      <section id="questions" className="py-24 border-b border-line bg-paper-sunken/50">
        <div className="container max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl font-bold tracking-tight">Questions business owners ask</h2>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {[
              { q: "Do you do the work for me?", a: "No. You do; we make sure you know what to do and that it gets done." },
              { q: "What if the number doesn't move in six weeks?", a: "We extend, at no charge, for up to two weeks before anything else is paid." },
              { q: "What do you do with my information?", a: `It stays between you and your ${BRAND.organisationName} team. We only use anonymised cases, and only with your consent.` },
              { q: "What happens after the fix?", a: "You have a plan. If you want us to stay, we agree what that looks like and what it costs." },
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

      {/* The ask */}
      <section className="py-20 bg-brand text-paper">
        <div className="container max-w-3xl mx-auto text-center">
          <img src={BRAND.logoOnDarkUrl} alt={BRAND.organisationName} className="mx-auto mb-8 h-12 w-auto" />
          <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight mb-4">Start with the free business check.</h2>
          <p className="text-on-dark-muted max-w-xl mx-auto mb-8">Ten minutes. No card. You&apos;ll know where you stand before you decide anything.</p>
          <Button onClick={handleStartCheck} className="bg-highlight text-brand-deep hover:bg-highlight-hover rounded-none px-10 h-14 text-sm uppercase tracking-widest font-semibold">
            Start with a free business check <ArrowRight className="ml-2 w-4 h-4" />
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
            {!passwordLinkSent && <p className="text-center text-xs leading-5 text-ink-muted">Not a client yet? <button type="button" onClick={() => { setIsParticipantSignInOpen(false); handleStartCheck(); }} className="font-semibold text-brand underline underline-offset-2">Start with the free business check</button>.</p>}
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
            <a href="#stuck" className="hover:text-ink">Where you're stuck</a>
            <a href="#questions" className="hover:text-ink">Questions</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
