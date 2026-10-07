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

/**
 * Universal account session cookie: HttpOnly, SameSite=Lax, Secure on HTTPS and always in production.
 * The token is random and only its hash is stored server-side; it is never exposed to client script.
 */
export function getAccountSessionCookieOptions(
  req: Request,
  nodeEnv = process.env.NODE_ENV
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: isSecureRequest(req) || nodeEnv === "production",
  };
}
