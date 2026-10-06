import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const routerSource = readFileSync(resolve(process.cwd(), "server/routers/adminAccess.ts"), "utf8");
const loginPageSource = readFileSync(resolve(process.cwd(), "client/src/pages/AdminLoginPage.tsx"), "utf8");

describe("JUMP administrator password reset safeguards", () => {
  it("requires an authenticated authorised administrator to request an email-delivered recovery link", () => {
    const requestSection = routerSource.slice(routerSource.indexOf("requestPasswordReset: protectedProcedure"), routerSource.indexOf("confirmPasswordReset: publicProcedure"));
    expect(routerSource).toContain("requestPasswordReset: protectedProcedure");
    expect(routerSource).toContain('ctx.user.role !== "admin"');
    expect(routerSource).toContain("randomBytes(32)");
    expect(routerSource).toContain("PASSWORD_RESET_TOKEN_MAX_AGE_MS");
    expect(routerSource).toContain("adminPasswordResetTokens");
    expect(routerSource).toContain('subject: "Reset your JUMP administrator password"');
    expect(requestSection).not.toContain("bcc:");
  });

  it("allows a new password only with an unexpired, unconsumed, and unrevoked emailed token", () => {
    expect(routerSource).toContain("confirmPasswordReset: publicProcedure");
    expect(routerSource).toContain("validateAdminPassword(input.password)");
    expect(routerSource).toContain("input.password !== input.confirmPassword");
    expect(routerSource).toContain("isNull(adminPasswordResetTokens.consumedAt)");
    expect(routerSource).toContain("isNull(adminPasswordResetTokens.revokedAt)");
    expect(routerSource).toContain("gt(adminPasswordResetTokens.expiresAt, new Date())");
  });

  it("consumes the credential, revokes prior administrator sessions, and does not create an immediate new session", () => {
    const completionSection = routerSource.slice(routerSource.indexOf("confirmPasswordReset: publicProcedure"), routerSource.indexOf("logoutPassword:"));
    expect(completionSection).toContain("revokeAdminSessionsForUser(administrator.id)");
    expect(completionSection).toContain("setAdminPassword(administrator.id, input.password)");
    expect(completionSection).toContain("consumedAt: new Date()");
    expect(completionSection).toContain("clearAdminAccessSession(ctx.req, ctx.res)");
    expect(completionSection).toContain('action: "admin_password_reset_completed"');
    expect(completionSection).not.toContain("issueAdminAccessSession");
  });

  it("offers email-reset request only after the recognised Gmail account is established as an authorised administrator", () => {
    expect(loginPageSource).toContain("access.data?.isAdmin && access.data.hasPassword");
    expect(loginPageSource).toContain("requestPasswordReset");
    expect(loginPageSource).toContain("Email me a secure reset link.");
    expect(loginPageSource).toContain("single-use reset link");
    expect(loginPageSource).not.toContain("resetPassword.useMutation");
  });
});
