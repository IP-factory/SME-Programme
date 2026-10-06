import express, { type Express, type NextFunction, type Request, type Response } from "express";

/** Top-level URL prefixes the Express app serves. Must match the rewrites in vercel.json. */
export const GATEWAY_PREFIXES = ["api", "portal", "manus-storage"] as const;

const PREFIX_PARAM = "__prefix";
const PATH_PARAM = "__path";

function splitUrl(url: string) {
  const queryStart = url.indexOf("?");
  return queryStart === -1
    ? { pathname: url, query: "" }
    : { pathname: url.slice(0, queryStart), query: url.slice(queryStart + 1) };
}

function paramKey(pair: string) {
  const raw = pair.split("=", 1)[0];
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function isSafePath(path: string) {
  let decoded: string;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return false;
  }
  if (/[\u0000-\u001f\u007f\\]/.test(decoded) || /[\u0000-\u001f\u007f\\]/.test(path)) return false;
  return !decoded.split("/").some(segment => segment === "." || segment === "..");
}

const UNSAFE_CHARACTERS = /[\u0000-\u001f\u007f\\]/;
const hasDotSegment = (path: string) => path.split("/").some(segment => segment === "." || segment === "..");

/**
 * Vercel encodes the whole `:path*` value into the internal `__path` parameter, including the slashes
 * (`/api/trpc/x` arrives as `trpc%2Fx`). This decodes that one internal value once and returns the original,
 * slash-separated path, ready to be re-encoded for the URL. Returns null (never throws) for malformed
 * encoding, control characters, backslashes or traversal, including a second layer of encoding, because a
 * downstream handler (Express params, the storage key normaliser) decodes once more.
 */
function decodeInternalPath(raw: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  let decodedAgain = decoded;
  try {
    decodedAgain = decodeURIComponent(decoded);
  } catch {
    // A literal "%" that is not a second escape is fine; only a real second layer matters below.
  }
  for (const candidate of [decoded, decodedAgain]) {
    if (UNSAFE_CHARACTERS.test(candidate) || hasDotSegment(candidate)) return null;
  }
  return decoded.replace(/^\/+/, "");
}

/** Encodes a decoded path for use in a URL path: `/` and the sub-delimiters tRPC batching uses (`,`) are kept. */
function encodePath(path: string) {
  return encodeURI(path).replace(/\?/g, "%3F").replace(/#/g, "%23");
}

/**
 * Rebuilds the URL the browser originally requested from the internal Vercel rewrite
 * (`/api/index?__prefix=api&__path=trpc/x&batch=1` -> `/api/trpc/x?batch=1`).
 * The internal `__path` value is percent-decoded (Vercel encodes its slashes); genuine query parameters are
 * never decoded and pass through byte-for-byte. If the platform already delivered
 * the original path, it is kept. Returns null for anything outside the configured prefixes.
 */
export function restoreOriginalUrl(rewrittenUrl: string): string | null {
  const { pathname, query } = splitUrl(rewrittenUrl);
  const pairs = query ? query.split("&") : [];

  // The first occurrence wins: Vercel puts the destination's parameters ahead of the visitor's own.
  const internal = new Map<string, string>();
  const forwarded: string[] = [];
  const candidates: string[] = [];
  for (const pair of pairs) {
    if (!pair) continue;
    const key = paramKey(pair);
    if (key === PREFIX_PARAM || key === PATH_PARAM) {
      if (!internal.has(key)) internal.set(key, pair.slice(pair.indexOf("=") + 1));
      continue;
    }
    forwarded.push(pair);
    if (key === "path") candidates.push(pair);
  }
  // Vercel also appends a bare `path=<same value as __path>` for the `:path*` rewrite parameter.
  // Drop only that echo; a genuine `path` parameter with a different value survives.
  const echoed = internal.get(PATH_PARAM);
  if (echoed !== undefined) {
    const echo = candidates.find(pair => pair.slice(pair.indexOf("=") + 1) === echoed);
    if (echo) forwarded.splice(forwarded.indexOf(echo), 1);
  }
  const search = forwarded.length ? `?${forwarded.join("&")}` : "";

  const prefix = internal.get(PREFIX_PARAM);
  if (prefix === undefined) {
    const first = pathname.split("/")[1];
    const allowed = (GATEWAY_PREFIXES as readonly string[]).includes(first) && isSafePath(pathname);
    return allowed && pathname !== "/api/index" ? `${pathname}${search}` : null;
  }

  if (!(GATEWAY_PREFIXES as readonly string[]).includes(prefix)) return null;
  const path = decodeInternalPath(internal.get(PATH_PARAM) ?? "");
  if (path === null) return null;
  return `/${prefix}${path ? `/${encodePath(path)}` : ""}${search}`;
}

export function createVercelGateway(app: Express): Express {
  const gateway = express();
  gateway.disable("x-powered-by");
  gateway.use((req: Request, res: Response, next: NextFunction) => {
    const restored = restoreOriginalUrl(req.url);
    if (!restored) {
      res.status(404).json({ message: "Not found" });
      return;
    }
    req.url = restored;
    req.originalUrl = restored;
    next();
  });
  gateway.use(app);
  return gateway;
}
