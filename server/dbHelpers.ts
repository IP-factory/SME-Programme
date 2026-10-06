import { sql, type AnyColumn, type SQL } from "drizzle-orm";

/**
 * Case-insensitive match of a stored email against an already-normalised (trimmed, lower-cased) address.
 * MySQL's default collation compared emails case-insensitively; PostgreSQL does not, and stored values
 * such as `users.email` come from OAuth without normalisation.
 */
export function emailEquals(column: AnyColumn, normalisedEmail: string): SQL {
  return sql`lower(${column}) = ${normalisedEmail.trim().toLowerCase()}`;
}
