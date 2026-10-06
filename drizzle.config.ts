import { defineConfig } from "drizzle-kit";

// Migrations use MIGRATION_DATABASE_URL (a Supabase Session Pooler or direct connection).
// Runtime queries use DATABASE_URL (the Transaction Pooler); see server/db.ts.
// `generate` works offline; the URL is only required for commands that connect.
const connectionString = process.env.MIGRATION_DATABASE_URL ?? "";
const connects = process.argv.some(arg => ["migrate", "push", "pull", "studio", "check", "up"].includes(arg));
if (connects && !connectionString) {
  throw new Error("MIGRATION_DATABASE_URL is required to run drizzle commands that connect to the database");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
