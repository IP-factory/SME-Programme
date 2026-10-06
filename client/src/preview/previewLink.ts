/**
 * Stand-in for the server in the static preview build (`pnpm build:preview`).
 * Answers the public calls the way the real server would, without saving or sending anything,
 * so the site can be clicked through without hosting, a database or credentials.
 */
import { TRPCClientError, type TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import type { AppRouter } from "../../../server/routers";
import { deriveDiagnostic, type DiagnosticInput } from "../../../server/diagnostic";

const PREVIEW_NOTICE = "This is a preview: nothing was saved or sent.";

type Responder = (input: unknown) => unknown;

const responders: Record<string, Responder> = {
  "auth.me": () => null,
  "registration.capacity": () => ({ boardroomCount: 0 }),
  "registration.submit": (input) => {
    const diagnostic = (input as { diagnostic?: DiagnosticInput }).diagnostic;
    return {
      success: true,
      status: "Pending",
      bookingToken: "preview",
      diagnostic: diagnostic ? deriveDiagnostic(diagnostic) : undefined,
      emailStatus: "Simulated",
      message: `Your answers were received. ${PREVIEW_NOTICE}`,
    };
  },
  "registration.requestPortalLink": () => ({ success: true }),
};

const refusals: Record<string, string> = {
  "participant.signIn": `Client sign-in works on the live site. ${PREVIEW_NOTICE}`,
};

export const previewLink: TRPCLink<AppRouter> = () => ({ op }) =>
  observable((observer) => {
    const timer = setTimeout(() => {
      if (refusals[op.path]) {
        observer.error(TRPCClientError.from(new Error(refusals[op.path])));
        return;
      }
      const respond = responders[op.path];
      if (!respond && op.type === "mutation") {
        observer.error(TRPCClientError.from(new Error(`Not available in the preview. ${PREVIEW_NOTICE}`)));
        return;
      }
      observer.next({ result: { type: "data", data: respond ? respond(op.input) : null } });
      observer.complete();
    }, 350);
    return () => clearTimeout(timer);
  });
