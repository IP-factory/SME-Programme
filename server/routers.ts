import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { registrationRouter } from "./routers/registration";
import { schedulingRouter } from "./routers/scheduling";
import { participantRouter } from "./routers/participant";
import { adminAccessRouter } from "./routers/adminAccess";
import { referralsRouter } from "./routers/referrals";
import { informationSessionRouter } from "./routers/informationSession";
import { paymentInstructionsRouter } from "./routers/paymentInstructions";
import { inboundRepliesRouter } from "./routers/inboundReplies";
import { pricingRequestsRouter } from "./routers/pricingRequests";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  registration: registrationRouter,
  adminAccess: adminAccessRouter,
  scheduling: schedulingRouter,
  participant: participantRouter,
  referrals: referralsRouter,
  informationSession: informationSessionRouter,
  paymentInstructions: paymentInstructionsRouter,
  inboundReplies: inboundRepliesRouter,
  pricingRequests: pricingRequestsRouter,
});

export type AppRouter = typeof appRouter;
