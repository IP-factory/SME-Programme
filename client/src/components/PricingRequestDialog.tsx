import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type PricingRequestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: "public" | "portal";
};

const packageOptions = ["Foundation", "Engine Room", "Boardroom", "Not sure yet"] as const;

export default function PricingRequestDialog({ open, onOpenChange, source }: PricingRequestDialogProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [preferredPackage, setPreferredPackage] = useState<(typeof packageOptions)[number]>("Not sure yet");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const close = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) setSubmitted(false);
  };

  const publicRequest = trpc.pricingRequests.submitPublic.useMutation({
    onSuccess: () => setSubmitted(true),
  });
  const portalRequest = trpc.pricingRequests.submitPortal.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  const error = source === "public" ? publicRequest.error : portalRequest.error;
  const pending = source === "public" ? publicRequest.isPending : portalRequest.isPending;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (source === "public") {
      publicRequest.mutate({ fullName: fullName.trim(), email: email.trim(), businessName: businessName.trim(), preferredPackage, note: note.trim() || undefined });
      return;
    }
    portalRequest.mutate({ note: note.trim() || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-[#E6E2D8] bg-[#FBF9F5] text-[#1A1A1A] sm:max-w-lg">
        <DialogHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1F4E79]">Programme office</p>
          <DialogTitle className="font-serif text-3xl">Request programme pricing</DialogTitle>
          <DialogDescription className="leading-6 text-[#5A5750]">Send a private request to the JUMP programme office. We will review your request and respond with the relevant pathway information.</DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950">
            <p className="font-semibold">Your request has reached the JUMP programme office.</p>
            <p className="mt-2">Thank you. Kindly watch for a response from the programme team.</p>
            <Button type="button" onClick={() => close(false)} className="mt-5 rounded-none bg-[#1F4E79] text-xs uppercase tracking-wider text-white hover:bg-[#153554]">Close</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 pt-2">
            {source === "public" ? <>
              <div className="space-y-2"><Label htmlFor="pricing-full-name">Your name</Label><Input id="pricing-full-name" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" required /></div>
              <div className="space-y-2"><Label htmlFor="pricing-email">Email address</Label><Input id="pricing-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></div>
              <div className="space-y-2"><Label htmlFor="pricing-business-name">Business or organisation</Label><Input id="pricing-business-name" value={businessName} onChange={(event) => setBusinessName(event.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="pricing-package">Programme interest</Label><Select value={preferredPackage} onValueChange={(value) => setPreferredPackage(value as (typeof packageOptions)[number])}><SelectTrigger id="pricing-package" className="rounded-none border-[#C6D7E6] bg-white"><SelectValue /></SelectTrigger><SelectContent className="bg-[#FBF9F5]">{packageOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></div>
            </> : null}
            <div className="space-y-2"><Label htmlFor="pricing-note">What would you like clarified? <span className="text-[#6A6760]">(optional)</span></Label><Textarea id="pricing-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} rows={4} placeholder="For example: I would like to compare the programme pathways." /></div>
            {error ? <p role="alert" className="border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error.message}</p> : null}
            <Button type="submit" disabled={pending} className="w-full rounded-none bg-[#1F4E79] py-6 text-xs uppercase tracking-wider text-white hover:bg-[#153554]">{pending ? "Sending request…" : "Send pricing request"}</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
