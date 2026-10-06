import { CheckCircle2, Circle, LockKeyhole } from "lucide-react";
import { getGettingStartedMilestones, programmeFormat, programmePathwayDelivery, programmeSessions, type ProgrammeMilestone, type ProgrammeMilestoneState, type ProgrammePathway } from "../../../shared/programmeProgress";

function StateIcon({ state }: { state: ProgrammeMilestoneState }) {
  if (state === "complete") return <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />;
  if (state === "available") return <Circle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />;
  return <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />;
}

function MilestoneRow({ milestone }: { milestone: ProgrammeMilestone }) {
  return (
    <div className={`flex gap-3 rounded-lg border p-3 ${milestone.state === "complete" ? "border-emerald-200 bg-emerald-50" : milestone.state === "available" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
      <StateIcon state={milestone.state} />
      <div>
        <p className={`text-sm font-semibold ${milestone.state === "locked" ? "text-slate-600" : "text-slate-800"}`}>{milestone.title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{milestone.note}</p>
      </div>
    </div>
  );
}

export function ProgrammeProgressTracker({ briefAcknowledged, pathway }: { briefAcknowledged: boolean; pathway: ProgrammePathway }) {
  const gettingStarted = getGettingStartedMilestones(briefAcknowledged);
  const delivery = programmePathwayDelivery[pathway];
  return (
    <section aria-labelledby="programme-progress-heading" className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Your programme journey</p>
        <h2 id="programme-progress-heading" className="mt-1 font-serif text-3xl text-[#1F4E79]">Your progress at a glance</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Your current actions are shown once below. The session sequence and the way the engagement works are then set out in one clear view.</p>
      </div>
      <div className="rounded-xl border border-[#1F4E79]/20 bg-white p-5 shadow-sm">
        <h3 className="font-serif text-xl text-[#1F4E79]">Getting started</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {gettingStarted.map((milestone) => <MilestoneRow key={milestone.title} milestone={milestone} />)}
        </div>
      </div>

      <div className="rounded-xl border border-[#1F4E79]/20 bg-[#F2F6FA] p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#1F4E79]">{delivery.label}</p>
        <h3 className="mt-2 font-serif text-xl text-[#1F4E79]">{delivery.title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">{delivery.body}</p>
        <ul className="mt-4 grid gap-2 text-sm leading-6 text-slate-700 sm:grid-cols-3">
          {delivery.inclusions.map((inclusion) => (
            <li key={inclusion} className="rounded-lg bg-white px-3 py-2">{inclusion}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-[#1F4E79]/15 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">The five-session sequence</p>
        <h3 className="mt-1 font-serif text-xl text-[#1F4E79]">{programmeFormat.heading}</h3>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{programmeFormat.body}</p>
        <ol className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {programmeSessions.map((session, index) => (
            <li key={session.title} className="rounded-lg border border-[#1F4E79]/10 bg-[#FBF9F5] p-4">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#1F4E79] text-xs font-semibold text-white">{index + 1}</span>
              <p className="mt-3 text-sm font-semibold text-[#1F4E79]">{session.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{session.focus}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
