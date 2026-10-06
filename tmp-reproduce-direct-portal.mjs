import { getDb } from "./server/db.ts";
import { registrations } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";
import { replaceParticipantPortalLink } from "./server/participantAuth.ts";

const db = await getDb();
if (!db) throw new Error("Database unavailable");

const records = await db
  .select({ id: registrations.id, email: registrations.email })
  .from(registrations)
  .where(eq(registrations.email, "emmanuel.tarfa@enzokrypton.com"))
  .limit(1);

if (!records[0]) throw new Error("Controlled Enzo registration not found");

const request = {
  headers: { host: "emmanueltarfa.com", "x-forwarded-proto": "https" },
  protocol: "https",
  get(name) {
    return this.headers[name.toLowerCase()] || "";
  },
};

const portalUrl = await replaceParticipantPortalLink(records[0].id, request);
console.log(portalUrl);
process.exit(0);
