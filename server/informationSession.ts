import { BRAND } from "../shared/brand";
export const INFORMATION_SESSION = {
  eventId: "jump2026infosessionaug23",
  subject: `${BRAND.programmeName} — Information Session & Briefing | Sunday, 23 August`,
  summary: `${BRAND.programmeName} Information Session & Briefing`,
  meetUrl: "https://meet.google.com/cxp-cgzi-hxm",
  startAt: new Date("2026-08-23T18:00:00.000Z"),
  endAt: new Date("2026-08-23T19:00:00.000Z"),
} as const;

/**
 * The canonical recipient list deliberately excludes the two internal quality-assurance
 * rows and the superseded Foundation entry, while retaining Emmanuel's three controlled
 * experience records so he receives the same participant communication.
 */
export const INFORMATION_SESSION_RECIPIENT_IDS = [
  1, 30001, 60001, 90001, 120001, 150001, 180002, 210001, 240001, 270001,
  300001, 330001, 360001, 390001, 420001, 450001, 480001, 540001, 600001,
] as const;

export function buildInformationSessionCalendarDescription() {
  return `${BRAND.programmeName} Information Session & Briefing

Having interacted with some individuals already, I would like to give everyone an opportunity to be properly advised on the programme. This live briefing is a chance to bring the room together, answer practical questions and allow participants to meet one another.

During the session, I will explain what ${BRAND.programmeShortName} is designed to achieve, how the advisory journey is structured, and how the participant portal, Current State Assessment, working materials and subsequent sessions fit together.

If you are already clear on what you want and ready to move forward, kindly feel free to continue with your registration, portal consent, payment and any scheduling made available to you. You are still very welcome to attend this Information Session.

Google Meet: ${INFORMATION_SESSION.meetUrl}

The session will be recorded for participants who cannot attend live. Kindly use the Google Calendar response buttons to confirm whether you will attend.`;
}

export function hasSentFinalInformationSessionEmail(
  previousDeliveries: Array<{ status: string; body: string | null }>,
  approvedBody: string,
) {
  return previousDeliveries.some((delivery) => delivery.status === "Sent" && delivery.body === approvedBody);
}
