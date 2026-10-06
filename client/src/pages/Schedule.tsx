import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { CalendarDays, Check, CircleAlert, Clock3, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BRAND } from "@shared/brand";

export default function Schedule() {
  const [kind, setKind] = useState<"Decide" | "Learn" | "Apply">("Decide");
  const [selected, setSelected] = useState<number[]>([]);
  const availableQuery = trpc.scheduling.availableSlots.useQuery({ kind });
  const bookingsQuery = trpc.scheduling.myBookings.useQuery();
  const bookMutation = trpc.scheduling.book.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      setSelected([]);
      availableQuery.refetch();
      bookingsQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const slots = availableQuery.data?.slots ?? [];
  const existingBookings = bookingsQuery.data ?? [];
  const requiredCount = availableQuery.data?.requiredCount ?? (kind === "Decide" || kind === "Apply" ? 3 : 5);
  const bookedIds = new Set(existingBookings.map((booking) => booking.id));
  const kindBookings = existingBookings.filter((booking) => booking.kind === kind);
  const remaining = Math.max(0, requiredCount - kindBookings.length);

  const toggleSlot = (id: number) => {
    if (selected.includes(id)) {
      setSelected((current) => current.filter((slotId) => slotId !== id));
      return;
    }
    if (selected.length >= remaining) {
      toast.error(`You can choose ${remaining} more ${kind} session${remaining === 1 ? "" : "s"}.`);
      return;
    }
    setSelected((current) => [...current, id]);
  };

  const reserveSelected = async () => {
    for (const slotId of selected) {
      await new Promise<void>((resolve) => {
        bookMutation.mutate({ slotId }, { onSettled: () => resolve() });
      });
    }
  };

  if (availableQuery.error || bookingsQuery.error) {
    return <main className="flex min-h-screen items-center justify-center bg-[#FBF9F5] p-6 text-[#1A1A1A]"><Card className="w-full max-w-md rounded-none border-[#E2A7A0] bg-[#FCE8E6]"><CardContent className="flex gap-3 p-6 text-sm text-[#8C3024]"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Please sign in to schedule.</p><p className="mt-1 leading-6">Use the one-time sign-in link sent to your registered email address before opening your private scheduling page.</p></div></CardContent></Card></main>;
  }

  if (availableQuery.isLoading || bookingsQuery.isLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-[#FBF9F5] p-6 text-[#1A1A1A]"><p className="text-sm text-[#5A5750]">Confirming your secure participant session…</p></main>;
  }

  return <main className="min-h-screen bg-[#FBF9F5] px-4 py-10 text-[#1A1A1A] sm:px-8">
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="max-w-3xl"><p className="text-[10px] uppercase tracking-[0.22em] text-[#1F4E79]">{BRAND.programmeName} / Private scheduling</p><h1 className="mt-2 font-serif text-4xl font-bold tracking-tight sm:text-5xl">Choose the dates that can work.</h1><p className="mt-4 text-base leading-relaxed text-[#5A5750]">These are the programme team’s live availability windows. A slot is held on a first-come, first-served basis. Dates are displayed in West Africa Time.</p></header>
      <Card className="rounded-none border-[#C6D7E6] bg-[#EAF1F8] shadow-none"><CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-[#1F4E79]" /><div><p className="font-semibold text-[#1F4E79]">Private booking window</p><p className="mt-1 text-xs leading-relaxed text-[#4A5F73]">{availableQuery.data?.reason ?? "Your availability is managed directly through the programme schedule."}</p></div></div><Badge className="border-[#C6D7E6] bg-[#FBF9F5] text-[#1F4E79]">Coordinated schedule</Badge></CardContent></Card>
        <div className="flex flex-wrap gap-2">{(["Decide", "Learn", "Apply"] as const).map((item) => <Button key={item} type="button" variant="outline" onClick={() => { setKind(item); setSelected([]); }} className={`rounded-none text-xs uppercase tracking-wider ${kind === item ? "border-[#1F4E79] bg-[#1F4E79] text-[#FBF9F5]" : "border-[#C6D7E6] text-[#1F4E79]"}`}>{item}</Button>)}</div>
        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card className="rounded-none border-[#E6E2D8] bg-[#FBF9F5]"><CardHeader className="border-b border-[#E6E2D8]"><CardTitle className="font-serif text-2xl">{kind} availability</CardTitle><p className="text-xs text-[#6A6760]">Choose {remaining} more session{remaining === 1 ? "" : "s"}. {kind === "Learn" ? "The Learn group has Friday, Saturday, and Sunday options for flexibility." : kind === "Apply" ? "Apply dates rotate across Friday evening, Saturday evening, and Sunday evening." : "Decide meetings are one-to-one and selected ahead of time."}</p></CardHeader><CardContent className="p-5">{availableQuery.isLoading ? <p className="py-8 text-center text-sm text-[#6A6760]">Checking available dates...</p> : !availableQuery.data?.eligible ? <p className="py-8 text-center text-sm text-[#8C3024]">{availableQuery.data?.reason ?? "This link is not yet eligible for scheduling."}</p> : slots.length === 0 ? <p className="py-8 text-center text-sm text-[#6A6760]">No open dates are showing in this window. The programme team will refresh the schedule shortly.</p> : <div className="grid gap-3 sm:grid-cols-2">{slots.map((slot) => { const selectedSlot = selected.includes(slot.id); return <button key={slot.id} type="button" onClick={() => toggleSlot(slot.id)} className={`min-h-28 border p-4 text-left transition-colors ${selectedSlot ? "border-[#1F4E79] bg-[#EAF1F8]" : "border-[#E6E2D8] bg-[#F4F1E8] hover:border-[#1F4E79]"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{new Date(slot.startAt).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p><p className="mt-1 flex items-center gap-1 text-xs text-[#6A6760]"><Clock3 className="h-3 w-3" />{new Date(slot.startAt).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" })} · {slot.timezone}</p></div>{selectedSlot && <Check className="h-5 w-5 text-[#1F4E79]" />}</div><p className="mt-4 text-[11px] text-[#6A6760]">{slot.remaining} place{slot.remaining === 1 ? "" : "s"} remaining{slot.sessionNumber ? ` · Session ${slot.sessionNumber}` : ""}</p></button>; })}</div>}</CardContent></Card>
          <aside className="space-y-4"><Card className="rounded-none border-[#E6E2D8] bg-[#1A1A1A] text-[#FBF9F5]"><CardContent className="space-y-5 p-6"><div><p className="text-[10px] uppercase tracking-[0.18em] text-[#A9C1D7]">Your selection</p><p className="mt-2 font-serif text-3xl">{selected.length} / {remaining}</p><p className="mt-2 text-xs leading-relaxed text-[#D8D2C8]">Select the dates you can genuinely attend. Once reserved, they are removed from this availability view.</p></div><Button type="button" onClick={reserveSelected} disabled={!selected.length || bookMutation.isPending || remaining === 0} className="w-full rounded-none bg-[#FBF9F5] py-6 text-xs uppercase tracking-wider text-[#1A1A1A] hover:bg-white">{bookMutation.isPending ? "Reserving..." : "Reserve selected dates"}</Button></CardContent></Card><Card className="rounded-none border-[#E6E2D8] bg-[#F4F1E8]"><CardContent className="p-6"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"><CalendarDays className="h-4 w-4 text-[#1F4E79]" />Already reserved</p>{existingBookings.length === 0 ? <p className="mt-3 text-xs text-[#6A6760]">Your confirmed dates will appear here.</p> : <div className="mt-3 space-y-2">{existingBookings.map((booking) => <div key={booking.id} className="border border-[#E6E2D8] bg-[#FBF9F5] p-3 text-xs"><p className="font-semibold">{booking.kind} · {new Date(booking.startAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p><p className="mt-1 text-[#6A6760]">{new Date(booking.startAt).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" })} · {booking.calendarStatus === "Created" ? "Calendar invitation sent" : "Programme team confirming calendar"}</p></div>)}</div>}</CardContent></Card></aside>
        </section>
    </div>
  </main>;
}
