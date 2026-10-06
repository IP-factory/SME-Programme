import type { CookieOptions, Request } from "express";

function isSecureRequest(req: Request) {
  return req.secure || req.protocol === "https";
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: isSecureRequest(req),
  };
}

/**
 * A JUMP-admin password session must not be sent in cross-site contexts. It is
 * deliberately distinct from the platform OAuth cookie so identity verification
 * and admin-password verification remain separate controls.
 */
export function getAdminAccessCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: isSecureRequest(req),
  };
}
